import { cycleFor, dayDiff } from './dates';
import { balanceOf, type Category, type Data } from './model';

export type Derived = ReturnType<typeof derive>;

/** Values computed from stored data for the current cycle. */
export function derive(d: Data, today: string) {
  const cyc = cycleFor(today, d.settings.payday);
  const bal = (id: string) => balanceOf(d, id);
  const salA = d.accounts.filter((a) => a.role === 'Salary');
  const savA = d.accounts.filter((a) => a.role === 'Savings');
  const salBal = salA.reduce((s, a) => s + bal(a.id), 0);
  const savTotal = savA.reduce((s, a) => s + bal(a.id), 0);
  const upcoming = d.recurring.filter((r) => !r.paused && r.type === 'expense' && r.nextDue <= cyc.e);
  const upSum = upcoming.reduce((s, r) => s + r.amount, 0);
  const avail = salBal - upSum;
  const daysLeft = dayDiff(today, cyc.e) + 1;
  const cycTx = d.txns.filter((t) => t.date >= cyc.s && t.date <= cyc.e);
  const spentBy: Record<string, number> = {};
  cycTx.forEach((t) => {
    if (t.type === 'expense' && t.cat) spentBy[t.cat] = (spentBy[t.cat] || 0) + t.amount;
  });
  const savSpentOf = (id: string) =>
    cycTx.filter((t) => t.type === 'expense' && t.acct === id).reduce((s, t) => s + t.amount, 0);
  const savSpent = savA.reduce((s, a) => s + savSpentOf(a.id), 0);
  const sorted = d.txns.slice().sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq);
  const activeCats = d.cats.filter((c) => !c.archived);
  return { cyc, bal, salA, savA, salBal, savTotal, upSum, avail, daysLeft, cycTx, spentBy, savSpentOf, savSpent, sorted, activeCats };
}

export interface BudgetRow {
  id: string;
  name: string;
  pct: number;
  pctStr: string;
  barPct: number;
  barColor: string;
  statusColor: string;
  spent: number;
  budget: number | null;
}

/** Budget bar state: amber from 80%, red from 100%. */
export function budgetRow(c: Category, spentBy: Record<string, number>): BudgetRow {
  const sp = spentBy[c.id] || 0;
  const pct = c.budget ? Math.round((sp / c.budget) * 100) : 0;
  return {
    id: c.id,
    name: c.name,
    pct,
    pctStr: pct + '%',
    barPct: Math.min(100, pct),
    barColor: pct >= 100 ? 'var(--expense)' : pct >= 80 ? 'var(--warn)' : 'var(--salary)',
    statusColor: pct >= 100 ? 'var(--expense)' : 'var(--ink2)',
    spent: sp,
    budget: c.budget,
  };
}

export const targetPct = (bal: number, target: number | null) =>
  target ? Math.max(0, Math.min(100, Math.round((bal / target) * 100))) : 0;
