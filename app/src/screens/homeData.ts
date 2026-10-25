import type { App } from '../ctx';
import { budgetRow, targetPct } from '../lib/derive';
import { dayDiff } from '../lib/dates';
import { fmt } from '../lib/format';
import { acctOf } from '../lib/model';
import { deco } from '../components/txn';
import { changeLabel } from '../components/ui';

/** Everything the mobile Home and the desktop Dashboard share. */
export function homeData(app: App) {
  const { data, d, today, commit } = app;
  const { avail, salBal, upSum, daysLeft } = d;
  const neg = avail < 0;
  const hero = {
    bg: neg ? 'var(--expense)' : 'var(--salary)',
    availStr: fmt(avail),
    daysLeft,
    dailyStr: neg ? 'Rp0' : fmt(Math.floor(avail / daysLeft / 1000) * 1000),
    sub: neg ? `You're ${fmt(-avail)} over this month.` : `${fmt(salBal)} in salary accounts − ${fmt(upSum)} upcoming bills`,
  };

  const showNothing =
    data.settings.noSpendDate !== today && !data.txns.some((t) => t.date === today) && data.accounts.length > 0;
  const onNoSpend = () => {
    commit((x) => ({ ...x, settings: { ...x.settings, noSpendDate: today } }));
    app.toast('Got it — no spending today.');
  };

  const p = data.pending;
  const pending = p
    ? {
        amountStr: fmt(p.amount),
        toName: acctOf(data, p.to).name,
        cycle: p.cycle,
        done: () =>
          commit(
            (x) => ({
              ...x,
              txns: x.txns.concat([{ id: 'n' + x.seq, seq: x.seq, type: 'transfer', amount: p.amount, acct: p.from, to: p.to, date: today, note: 'Month-end sweep' }]),
              seq: x.seq + 1,
              pending: null,
              sweeps: x.sweeps.concat([{ cycle: p.cycle, amount: p.amount, status: 'Transferred' }]),
            }),
            `${fmt(p.amount)} moved to ${acctOf(data, p.to).name}`,
          ),
        skip: () =>
          commit(
            (x) => ({ ...x, pending: null, sweeps: x.sweeps.concat([{ cycle: p.cycle, amount: p.amount, status: 'Skipped' }]) }),
            'Sweep skipped · kept in Settings › Sweep history',
          ),
        setAmount: (amount: number) => commit((x) => (x.pending ? { ...x, pending: { ...x.pending, amount } } : x)),
      }
    : null;

  const stale = data.accounts
    .map((a) => ({ a, days: dayDiff(a.lastRec || today, today) }))
    .filter((x) => x.days >= 14)
    .sort((x, y) => y.days - x.days)[0];
  const recon = stale
    ? { name: stale.a.name, days: stale.days, invest: stale.a.role === 'Investment', open: () => app.openSheet({ kind: 'recon', acct: stale.a.id }) }
    : null;

  const savSpentLine = d.savSpent ? `−${fmt(d.savSpent)} spent from savings this cycle` : 'Nothing spent from savings this cycle';
  const savSpentColor = d.savSpent ? 'var(--expense)' : 'var(--ink3)';
  const savingsCards = d.savA.map((a) => {
    const b = d.bal(a.id);
    const sp = d.savSpentOf(a.id);
    const pct = targetPct(b, a.target);
    const interest = d.interestOf(a.id).year;
    return { id: a.id, name: a.name, balStr: fmt(b), target: a.target, pct, pctStr: pct + '%', targetStr: a.target ? fmt(a.target) : '', spent: sp, spentStr: '−' + fmt(sp), interest, interestStr: '+' + fmt(interest), open: () => app.go('acct', { acctId: a.id }) };
  });
  const savInterestLine = d.savInterest ? `+${fmt(d.savInterest)} interest this cycle` : '';

  const invChange = changeLabel(d.invGain, d.invStart, fmt);
  const invLine = { text: d.invGain ? invChange.text + ' growth this cycle' : 'No value change recorded this cycle', color: invChange.color };
  const investCards = d.invA.map((a) => {
    const g = d.growthOf(a.id);
    const ch = changeLabel(g.gain, g.startValue, fmt);
    return { id: a.id, name: a.name, balStr: fmt(d.bal(a.id)), gain: g.gain, changeStr: ch.text, changeColor: ch.color, open: () => app.go('acct', { acctId: a.id }) };
  });

  const budgetTop = d.activeCats
    .filter((c) => c.budget)
    .map((c) => budgetRow(c, d.spentBy))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  const recent = d.sorted.slice(0, 5).map((t) => deco(data, t));

  return { hero, showNothing, onNoSpend, pending, recon, savSpentLine, savSpentColor, savingsCards, savInterestLine, invLine, investCards, budgetTop, recent };
}
