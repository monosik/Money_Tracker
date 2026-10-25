import { describe, expect, it } from 'vitest';
import { backupJson, parseBackup, transactionsCsv } from './backup';
import { cycleFor, firstDueAfter, nextMonthDue } from './dates';
import { budgetRow, derive } from './derive';
import { dig, fmt, short } from './format';
import { runMaintenance } from './maintenance';
import { balanceOf, emptyData, type Data } from './model';
import { cycleStats } from './reports';

function sample(): Data {
  const d = emptyData();
  return {
    ...d,
    onboarded: true,
    accounts: [
      { id: 'bca', name: 'BCA Salary', type: 'Bank', role: 'Salary', start: 1_000_000, target: null, lastRec: '2026-10-01' },
      { id: 'may', name: 'Maybank Savings', type: 'Bank', role: 'Savings', start: 5_000_000, target: 20_000_000, lastRec: '2026-10-01' },
    ],
    settings: { ...d.settings, payday: 25, defSav: 'may', lastCycleStart: '2026-09-25' },
  };
}

describe('format', () => {
  it('formats IDR with dot separators and a true minus', () => {
    expect(fmt(1250000)).toBe('Rp1.250.000');
    expect(fmt(-200000)).toBe('−Rp200.000');
    expect(fmt(0)).toBe('Rp0');
    expect(dig('9000000')).toBe('9.000.000');
    expect(short(1_200_000)).toBe('Rp1,2jt');
    expect(short(450_000)).toBe('Rp450rb');
  });
});

describe('cycles', () => {
  it('runs payday to the day before the next payday', () => {
    expect(cycleFor('2026-10-14', 25)).toMatchObject({ s: '2026-09-25', e: '2026-10-24', label: 'Sep 25 – Oct 24', bar: 'Oct' });
    expect(cycleFor('2026-10-25', 25).s).toBe('2026-10-25');
    expect(cycleFor('2026-10-14', 25, -1).label).toBe('Aug 25 – Sep 24');
    expect(cycleFor('2026-01-10', 25).s).toBe('2025-12-25');
    expect(cycleFor('2026-02-10', 1)).toMatchObject({ s: '2026-02-01', e: '2026-02-28' });
  });

  it('schedules monthly rules, clamping to short months', () => {
    expect(firstDueAfter('2026-10-14', 10)).toBe('2026-11-10');
    expect(firstDueAfter('2026-10-14', 14)).toBe('2026-11-14');
    expect(firstDueAfter('2026-10-14', 20)).toBe('2026-10-20');
    expect(firstDueAfter('2027-02-01', 31)).toBe('2027-02-28');
    expect(nextMonthDue('2027-02-28', 31)).toBe('2027-03-31');
  });
});

describe('balances and available money', () => {
  it('ignores transfers in spending, but moves balances', () => {
    const d = sample();
    d.txns = [
      { id: 't1', seq: 1, type: 'expense', amount: 100_000, acct: 'bca', cat: 'food', date: '2026-10-01', note: '' },
      { id: 't2', seq: 2, type: 'transfer', amount: 300_000, acct: 'bca', to: 'may', date: '2026-10-02', note: '' },
      { id: 't3', seq: 3, type: 'adjust', amount: -50_000, acct: 'bca', date: '2026-10-03', note: 'Untracked' },
    ];
    expect(balanceOf(d, 'bca')).toBe(550_000);
    expect(balanceOf(d, 'may')).toBe(5_300_000);
    const x = derive(d, '2026-10-14');
    expect(x.spentBy).toEqual({ food: 100_000 });
    expect(x.daysLeft).toBe(11);
  });

  it('subtracts upcoming recurring expenses in this cycle from Available', () => {
    const d = sample();
    d.recurring = [
      { id: 'r1', name: 'Gym', type: 'expense', amount: 300_000, acct: 'bca', cat: 'health', day: 20, paused: false, nextDue: '2026-10-20' },
      { id: 'r2', name: 'Rent', type: 'expense', amount: 999_000, acct: 'bca', cat: 'bills', day: 1, paused: false, nextDue: '2026-11-01' },
      { id: 'r3', name: 'Paused', type: 'expense', amount: 50_000, acct: 'bca', cat: 'bills', day: 22, paused: true, nextDue: '2026-10-22' },
    ];
    const x = derive(d, '2026-10-14');
    expect(x.avail).toBe(700_000);
  });

  it('colors budgets amber at 80% and red at 100%', () => {
    const c = { id: 'food', name: 'Food', budget: 1000, archived: false };
    expect(budgetRow(c, { food: 790 }).barColor).toBe('var(--salary)');
    expect(budgetRow(c, { food: 800 }).barColor).toBe('var(--warn)');
    expect(budgetRow(c, { food: 1040 })).toMatchObject({ barColor: 'var(--expense)', barPct: 100, pct: 104 });
  });
});

describe('maintenance', () => {
  it('auto-logs due recurring items and skips paused ones', () => {
    const d = sample();
    d.recurring = [
      { id: 'r1', name: 'Internet bill', type: 'expense', amount: 350_000, acct: 'bca', cat: 'bills', day: 10, paused: false, nextDue: '2026-09-10' },
      { id: 'r2', name: 'Spotify', type: 'expense', amount: 55_000, acct: 'bca', cat: 'entertainment', day: 5, paused: true, nextDue: '2026-10-05' },
    ];
    const n = runMaintenance(d, '2026-10-14');
    expect(n.txns.map((t) => [t.date, t.note, t.auto])).toEqual([
      ['2026-09-10', 'Internet bill', true],
      ['2026-10-10', 'Internet bill', true],
    ]);
    expect(n.recurring.map((r) => r.nextDue)).toEqual(['2026-11-10', '2026-11-05']);
    expect(runMaintenance(n, '2026-10-14')).toBe(n);
  });

  it('creates a pending sweep for leftover salary when a new cycle starts', () => {
    const d = sample();
    d.txns = [{ id: 't1', seq: 1, type: 'expense', amount: 150_000, acct: 'bca', cat: 'food', date: '2026-10-20', note: '' }];
    d.recurring = [{ id: 'r1', name: 'Salary', type: 'income', amount: 9_000_000, acct: 'bca', cat: null, day: 25, paused: false, nextDue: '2026-10-25' }];
    expect(runMaintenance(d, '2026-10-24').pending).toBeNull();
    const n = runMaintenance(d, '2026-10-26');
    // Leftover is measured at the end of the old cycle, before the new salary lands.
    expect(n.pending).toEqual({ amount: 850_000, from: 'bca', to: 'may', cycle: 'Sep 25 – Oct 24' });
    expect(n.settings.lastCycleStart).toBe('2026-10-25');
    expect(n.txns.some((t) => t.note === 'Salary' && t.source === 'Salary')).toBe(true);
    // Balances don't change until the user confirms.
    expect(balanceOf(n, 'may')).toBe(5_000_000);
  });

  it('does nothing before onboarding', () => {
    const d = emptyData();
    expect(runMaintenance(d, '2026-10-14')).toBe(d);
  });
});

describe('reports', () => {
  it('summarizes a cycle with untracked and savings spending', () => {
    const d = sample();
    d.txns = [
      { id: 't1', seq: 1, type: 'expense', amount: 1_200_000, acct: 'may', cat: 'shopping', date: '2026-10-12', note: '' },
      { id: 't2', seq: 2, type: 'expense', amount: 45_000, acct: 'bca', cat: 'food', date: '2026-10-13', note: '' },
      { id: 't3', seq: 3, type: 'adjust', amount: -320_000, acct: 'bca', date: '2026-10-07', note: 'Untracked' },
      { id: 't4', seq: 4, type: 'expense', amount: 99_000, acct: 'bca', cat: 'food', date: '2026-09-01', note: '' },
    ];
    const r = cycleStats(d, '2026-10-14', 0);
    expect(r).toMatchObject({ total: 1_245_000, untracked: 320_000, fromSav: 1_200_000, savings: 3_800_000 });
    expect(r.byCat[0]).toEqual({ id: 'shopping', a: 1_200_000 });
    expect(cycleStats(d, '2026-10-14', -1).total).toBe(99_000);
  });
});

describe('backup', () => {
  it('round-trips a JSON backup and rejects invalid files', () => {
    const d = sample();
    d.txns = [{ id: 't1', seq: 7, type: 'expense', amount: 1000, acct: 'bca', cat: 'food', date: '2026-10-01', note: 'Lunch, "big"' }];
    const back = parseBackup(backupJson(d, '2026-10-14'));
    expect(back.accounts).toEqual(d.accounts);
    expect(back.txns).toEqual(d.txns);
    expect(back.seq).toBe(8);
    expect(() => parseBackup('{"hello":1}')).toThrow();
    expect(() => parseBackup('not json')).toThrow();
    expect(transactionsCsv(d)).toBe('date,type,amount,account,to_account,category,note\n2026-10-01,expense,-1000,BCA Salary,,Food,"Lunch, ""big"""');
  });
});
