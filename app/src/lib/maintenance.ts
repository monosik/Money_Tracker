import { cycleFor, nextMonthDue } from './dates';
import { balanceOf, primarySalary, type Data, type Txn } from './model';

/**
 * Brings stored data up to `today`:
 * 1. Logs recurring rules that came due (paused rules skip ahead without logging).
 * 2. When a new pay cycle has started, creates a pending month-end sweep for the
 *    leftover in the primary Salary account at the end of the previous cycle.
 * Returns the same object when nothing changed.
 */
export function runMaintenance(d: Data, today: string): Data {
  if (!d.onboarded) return d;
  let changed = false;
  let seq = d.seq;
  const added: Txn[] = [];

  const recurring = d.recurring.map((r) => {
    if (r.nextDue > today) return r;
    changed = true;
    let due = r.nextDue;
    while (due <= today) {
      if (!r.paused) {
        added.push({
          id: 'n' + seq,
          seq: seq++,
          type: r.type,
          amount: r.amount,
          acct: r.acct,
          date: due,
          note: r.name,
          auto: true,
          ruleId: r.id,
          ...(r.type === 'expense'
            ? { cat: r.cat || 'other' }
            : { source: /salary|gaji|payroll/i.test(r.name) ? ('Salary' as const) : ('Other' as const) }),
        });
      }
      due = nextMonthDue(due, r.day);
    }
    return { ...r, nextDue: due };
  });

  let next: Data = changed ? { ...d, recurring, txns: d.txns.concat(added), seq } : d;

  const cur = cycleFor(today, next.settings.payday);
  const last = next.settings.lastCycleStart;
  if (!last || cur.s > last) {
    let { pending, sweeps } = next;
    if (last) {
      const prev = cycleFor(today, next.settings.payday, -1);
      const sal = primarySalary(next);
      const to = next.settings.defSav;
      const leftover = sal ? balanceOf(next, sal.id, prev.e) : 0;
      if (sal && to && to !== sal.id && next.accounts.some((a) => a.id === to) && leftover > 0) {
        // An unanswered sweep from an older cycle is kept in history as skipped.
        if (pending) sweeps = sweeps.concat([{ cycle: pending.cycle, amount: pending.amount, status: 'Skipped' }]);
        pending = { amount: leftover, from: sal.id, to, cycle: prev.label };
      }
    }
    next = { ...next, pending, sweeps, settings: { ...next.settings, lastCycleStart: cur.s } };
  }
  return next;
}
