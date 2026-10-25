import { cycleFor, type Cycle } from './dates';
import { balanceOf, type Data } from './model';

export interface CycleStats {
  cyc: Cycle;
  total: number;
  byCat: { id: string; a: number }[];
  /** Money that left accounts without being logged (negative adjustments). */
  untracked: number;
  fromSav: number;
  /** Total savings balance at the end of the cycle. */
  savings: number;
}

export function cycleStats(d: Data, today: string, off: number): CycleStats {
  const cyc = cycleFor(today, d.settings.payday, off);
  const sav = new Set(d.accounts.filter((a) => a.role === 'Savings').map((a) => a.id));
  const by: Record<string, number> = {};
  let total = 0;
  let untracked = 0;
  let fromSav = 0;
  for (const t of d.txns) {
    if (t.date < cyc.s || t.date > cyc.e) continue;
    if (t.type === 'expense') {
      total += t.amount;
      const c = t.cat || 'other';
      by[c] = (by[c] || 0) + t.amount;
      if (sav.has(t.acct)) fromSav += t.amount;
    } else if (t.type === 'adjust' && t.amount < 0) untracked -= t.amount;
  }
  const byCat = Object.entries(by)
    .map(([id, a]) => ({ id, a }))
    .filter((x) => x.a > 0)
    .sort((a, b) => b.a - a.a);
  const savings = [...sav].reduce((s, id) => s + balanceOf(d, id, cyc.e), 0);
  return { cyc, total, byCat, untracked, fromSav, savings };
}

/** Stats for the last `n` cycles, oldest first; the last entry is the current cycle. */
export const lastCycles = (d: Data, today: string, n = 6) =>
  Array.from({ length: n }, (_, i) => cycleStats(d, today, i - (n - 1)));
