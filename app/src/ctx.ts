import { createContext, useContext } from 'react';
import type { Derived } from './lib/derive';
import type { Data, Rule, Txn } from './lib/model';

export type Screen = 'onboarding' | 'home' | 'txns' | 'reports' | 'accounts' | 'acct' | 'budgets' | 'recurring' | 'settings';

export type Sheet =
  | { kind: 'qa'; edit?: Txn }
  | { kind: 'more' }
  | { kind: 'recon'; acct: string }
  | { kind: 'rule'; rule: Rule | null }
  | { kind: 'account' }
  | { kind: 'reset' };

export interface Filters {
  type: string;
  acct: string;
  cat: string;
  range: 'cycle' | '7' | 'all';
}
export const ALL_FILTERS: Filters = { type: 'all', acct: 'all', cat: 'all', range: 'cycle' };

export interface App {
  data: Data;
  today: string;
  d: Derived;
  isDesktop: boolean;
  screen: Screen;
  acctId: string | null;
  go: (screen: Screen, opts?: { acctId?: string; filters?: Filters }) => void;
  sheet: Sheet | null;
  openSheet: (s: Sheet) => void;
  closeSheet: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  toast: (msg: string) => void;
  /** Applies a change; with a toast message, offers Undo back to the data before the change. */
  commit: (fn: (d: Data) => Data, undoMsg?: string) => void;
}

export const AppCtx = createContext<App>(null as unknown as App);
export const useApp = () => useContext(AppCtx);
