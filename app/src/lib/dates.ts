// Dates are stored as local ISO day strings (YYYY-MM-DD) so they compare lexically.
export const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const todayIso = () => iso(new Date());
export const dayDiff = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5);
export const nice = (s: string) => {
  const d = parse(s);
  return MON[d.getMonth()] + ' ' + d.getDate();
};
export const addDays = (s: string, n: number) => {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};

/** The given day of a month, clamped to the month's last day (day 31 in Feb → Feb 28/29). */
export const dayInMonth = (y: number, m: number, day: number) => {
  const last = new Date(y, m + 1, 0).getDate();
  return new Date(y, m, Math.min(day, last));
};

export interface Cycle {
  s: string;
  e: string;
  label: string;
  bar: string;
}

/** Pay cycle containing `today` (payday to the day before next payday), shifted by `off` cycles. */
export function cycleFor(today: string, payday: number, off = 0): Cycle {
  const t = parse(today);
  let m = t.getMonth();
  if (t.getDate() < payday) m -= 1;
  m += off;
  const s = new Date(t.getFullYear(), m, payday);
  const e = new Date(t.getFullYear(), m + 1, payday - 1);
  return {
    s: iso(s),
    e: iso(e),
    label: `${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`,
    bar: MON[e.getMonth()],
  };
}

/** First occurrence of a monthly `day` strictly after `today`. */
export function firstDueAfter(today: string, day: number) {
  const t = parse(today);
  let d = dayInMonth(t.getFullYear(), t.getMonth(), day);
  if (iso(d) <= today) d = dayInMonth(t.getFullYear(), t.getMonth() + 1, day);
  return iso(d);
}

/** The occurrence one month after `due` for a rule on `day`. */
export function nextMonthDue(due: string, day: number) {
  const d = parse(due);
  return iso(dayInMonth(d.getFullYear(), d.getMonth() + 1, day));
}
