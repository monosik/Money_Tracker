export type Role = 'Salary' | 'Savings' | 'Investment';
export type AcctType = 'Bank' | 'E-wallet' | 'Cash';
/** `adjust` = untracked difference found by reconciling; `revalue` = market gain/loss on an investment. */
export type TxnType = 'expense' | 'income' | 'transfer' | 'adjust' | 'revalue';
export type IncomeSource = 'Salary' | 'Bonus' | 'Interest' | 'Other';
export type ThemePref = 'system' | 'light' | 'dark';

export interface Account {
  id: string;
  name: string;
  type: AcctType;
  role: Role;
  /** Starting balance entered at setup. */
  start: number;
  target: number | null;
  /** Last day the balance was checked against the bank app. */
  lastRec: string;
}

export interface Category {
  id: string;
  name: string;
  budget: number | null;
  archived: boolean;
}

export interface Txn {
  id: string;
  /** Insertion order, used to sort same-day entries. */
  seq: number;
  type: TxnType;
  /** Always positive, except adjustments and revaluations, which are signed. */
  amount: number;
  acct: string;
  to?: string;
  cat?: string;
  source?: IncomeSource;
  date: string;
  note: string;
  auto?: boolean;
  ruleId?: string;
}

export interface Rule {
  id: string;
  name: string;
  type: 'expense' | 'income';
  amount: number;
  acct: string;
  cat: string | null;
  day: number;
  paused: boolean;
  nextDue: string;
}

export interface Pending {
  amount: number;
  from: string;
  to: string;
  cycle: string;
}

export interface Sweep {
  cycle: string;
  amount: number;
  status: 'Transferred' | 'Skipped';
}

export interface Settings {
  payday: number;
  salary: number;
  defSav: string | null;
  reminder: string | null;
  lastBackup: string | null;
  theme: ThemePref;
  /** Start of the cycle the app last ran in; a newer cycle triggers the month-end sweep. */
  lastCycleStart: string | null;
  noSpendDate: string | null;
  lastAcct: string | null;
  lastReminderSent: string | null;
}

export interface Data {
  version: 1;
  onboarded: boolean;
  accounts: Account[];
  cats: Category[];
  txns: Txn[];
  recurring: Rule[];
  pending: Pending | null;
  sweeps: Sweep[];
  settings: Settings;
  seq: number;
}

export const DEFAULT_CATS: Category[] = [
  ['food', 'Food'],
  ['transport', 'Transport'],
  ['bills', 'Bills'],
  ['shopping', 'Shopping'],
  ['entertainment', 'Entertainment'],
  ['health', 'Health'],
  ['other', 'Other'],
].map(([id, name]) => ({ id, name, budget: null, archived: false }));

export const defaultSettings = (): Settings => ({
  payday: 25,
  salary: 0,
  defSav: null,
  reminder: '21:00',
  lastBackup: null,
  theme: 'system',
  lastCycleStart: null,
  noSpendDate: null,
  lastAcct: null,
  lastReminderSent: null,
});

export const emptyData = (): Data => ({
  version: 1,
  onboarded: false,
  accounts: [],
  cats: DEFAULT_CATS.map((c) => ({ ...c })),
  txns: [],
  recurring: [],
  pending: null,
  sweeps: [],
  settings: defaultSettings(),
  seq: 1,
});

/** Net effect of all transactions on an account, optionally only those dated on or before `upTo`. */
export function netOf(id: string, txns: Txn[], upTo?: string) {
  let s = 0;
  for (const t of txns) {
    if (upTo && t.date > upTo) continue;
    if (t.type === 'expense' && t.acct === id) s -= t.amount;
    else if ((t.type === 'income' || t.type === 'adjust' || t.type === 'revalue') && t.acct === id) s += t.amount;
    else if (t.type === 'transfer') {
      if (t.acct === id) s -= t.amount;
      if (t.to === id) s += t.amount;
    }
  }
  return s;
}

export function balanceOf(d: Data, id: string, upTo?: string) {
  const a = d.accounts.find((x) => x.id === id);
  return a ? a.start + netOf(id, d.txns, upTo) : 0;
}

export const acctOf = (d: Data, id: string | undefined): Account =>
  d.accounts.find((a) => a.id === id) || {
    id: '',
    name: '—',
    type: 'Bank',
    role: 'Salary',
    start: 0,
    target: null,
    lastRec: '',
  };

export const catOf = (d: Data, id: string | undefined): Category =>
  d.cats.find((c) => c.id === id) || { id: 'other', name: 'Other', budget: null, archived: false };

/** The primary Salary account: the first one, where pay lands and the month-end sweep starts. */
export const primarySalary = (d: Data) => d.accounts.find((a) => a.role === 'Salary') || null;

// Category colors: fixed hues for defaults, a stable hash for custom ones.
const HUES: Record<string, number> = { food: 55, transport: 235, bills: 295, shopping: 345, entertainment: 185, health: 135, other: 95 };
const hueOf = (id: string) =>
  HUES[id] != null ? HUES[id] : [...String(id)].reduce((h, c) => h + c.charCodeAt(0) * 37, 0) % 360;
export const catFg = (id: string) => `oklch(0.56 0.12 ${hueOf(id)})`;
export const catChart = (id: string) => `oklch(0.7 0.12 ${hueOf(id)})`;
export const catBg = (id: string) => `oklch(0.7 0.12 ${hueOf(id)} / 0.18)`;
