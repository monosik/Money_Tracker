import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_FILTERS, AppCtx, type App as AppT, type Filters, type Screen, type Sheet } from './ctx';
import { derive } from './lib/derive';
import { todayIso } from './lib/dates';
import { runMaintenance } from './lib/maintenance';
import type { Data } from './lib/model';
import { msUntil, notifState, showReminder } from './lib/notify';
import { getData, setData, useData } from './lib/store';
import { AccountDetail, Accounts } from './screens/Accounts';
import { Budgets } from './screens/Budgets';
import { DesktopHome } from './screens/DesktopHome';
import { Home } from './screens/Home';
import { Onboarding } from './screens/Onboarding';
import { Recurring } from './screens/Recurring';
import { Reports } from './screens/Reports';
import { lastBackupInfo, Settings } from './screens/Settings';
import { Transactions } from './screens/Transactions';
import { SheetHost } from './sheets/Sheets';

/** Local date, refreshed when the app regains focus and once a minute (catches midnight). */
function useToday() {
  const [today, setToday] = useState(todayIso);
  useEffect(() => {
    const tick = () => setToday(todayIso());
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, []);
  return today;
}

function useMedia(q: string) {
  const [m, setM] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
}

const NAV: [string, Screen | 'more'][] = [['Home', 'home'], ['Transactions', 'txns'], ['Reports', 'reports'], ['Accounts', 'accounts'], ['More', 'more']];
const DESK_NAV: [string, Screen][] = [['Home', 'home'], ['Transactions', 'txns'], ['Reports', 'reports'], ['Accounts', 'accounts'], ['Budgets', 'budgets'], ['Recurring', 'recurring'], ['Settings', 'settings']];

export function App() {
  const data = useData();
  const today = useToday();
  const isDesktop = useMedia('(min-width: 1024px)');
  const prefersDark = useMedia('(prefers-color-scheme: dark)');
  const [screenState, setScreen] = useState<Screen>('home');
  const [acctId, setAcctId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [filters, setFilters] = useState<Filters>(ALL_FILTERS);
  const [toastState, setToast] = useState<{ msg: string; undo?: Data } | null>(null);
  const toastTimer = useRef<number>();

  const screen: Screen = !data.onboarded ? 'onboarding' : screenState === 'onboarding' ? 'home' : screenState;

  // Log due recurring items and create month-end sweeps whenever data or the date changes.
  useEffect(() => {
    const next = runMaintenance(data, today);
    if (next !== data) setData(next);
  }, [data, today]);

  const theme = data.settings.theme === 'system' ? (prefersDark ? 'dark' : 'light') : data.settings.theme;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    const bg = getComputedStyle(document.body).backgroundColor;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  }, [theme]);

  const toast = useCallback((msg: string, undo?: Data) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);
  const commit = useCallback(
    (fn: (d: Data) => Data, undoMsg?: string) => {
      const prev = getData();
      setData(fn);
      if (undoMsg) toast(undoMsg, prev);
    },
    [toast],
  );
  const undo = () => {
    if (!toastState?.undo) return;
    clearTimeout(toastTimer.current);
    setData(toastState.undo);
    setToast(null);
  };

  const go = useCallback((s: Screen, opts?: { acctId?: string; filters?: Filters }) => {
    setScreen(s);
    setSheet(null);
    if (opts?.acctId) setAcctId(opts.acctId);
    if (opts?.filters) setFilters(opts.filters);
    window.scrollTo(0, 0);
  }, []);
  const openSheet = useCallback((s: Sheet) => setSheet(s), []);
  const closeSheet = useCallback(() => setSheet(null), []);

  // Opening from the reminder notification goes straight to Quick Add.
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.has('quickadd')) {
      url.searchParams.delete('quickadd');
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      if (getData().onboarded) setSheet({ kind: 'qa' });
    }
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'quickadd' && getData().onboarded) setSheet({ kind: 'qa' });
    };
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg);
  }, []);

  // Daily reminder: fires at the set time while the app is open or in the background,
  // only if nothing has been logged today.
  const { reminder, lastReminderSent } = data.settings;
  useEffect(() => {
    if (!data.onboarded || !reminder || lastReminderSent === today || notifState() !== 'granted') return;
    const ms = msUntil(reminder);
    if (ms === null) return;
    const id = setTimeout(() => {
      const cur = getData();
      const t = todayIso();
      if (cur.settings.noSpendDate === t || cur.txns.some((x) => x.date === t)) return;
      void showReminder();
      setData((x) => ({ ...x, settings: { ...x.settings, lastReminderSent: t } }));
    }, ms);
    return () => clearTimeout(id);
  }, [data.onboarded, reminder, lastReminderSent, today]);

  const d = useMemo(() => derive(data, today), [data, today]);
  const app: AppT = { data, today, d, isDesktop, screen, acctId, go, sheet, openSheet, closeSheet, filters, setFilters, toast, commit };

  const body = (
    <>
      {screen === 'onboarding' && <Onboarding />}
      {screen === 'home' && (isDesktop ? <DesktopHome /> : <Home />)}
      {screen === 'txns' && <Transactions />}
      {screen === 'reports' && <Reports />}
      {screen === 'accounts' && <Accounts />}
      {screen === 'acct' && <AccountDetail />}
      {screen === 'budgets' && <Budgets />}
      {screen === 'recurring' && <Recurring />}
      {screen === 'settings' && <Settings />}
    </>
  );

  const toastEl = toastState && (
    <div className="toast-wrap">
      <div className="toast" role="status">
        <span style={{ flex: 1, fontSize: 14 }}>{toastState.msg}</span>
        {toastState.undo && (
          <button onClick={undo} style={{ border: 0, background: 'none', color: 'var(--bg)', fontWeight: 700, padding: '0 14px', height: 40, cursor: 'pointer', textDecoration: 'underline' }}>Undo</button>
        )}
      </div>
    </div>
  );
  const fab = (
    <button className="fab" aria-label="Quick add" onClick={() => openSheet({ kind: 'qa' })}>+</button>
  );

  if (isDesktop && screen !== 'onboarding') {
    const active = screen === 'acct' ? 'accounts' : screen;
    return (
      <AppCtx.Provider value={app}>
        <div className="desk">
          <nav className="desk-side" aria-label="Main">
            <div style={{ fontWeight: 700, fontSize: 17, padding: '0 10px 20px' }}>Money Tracker</div>
            {DESK_NAV.map(([label, id]) => {
              const on = id === active;
              return (
                <button key={id} aria-current={on ? 'page' : undefined} onClick={() => go(id)} style={{ background: on ? 'var(--surface2)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink2)', fontWeight: on ? 600 : 500 }}>
                  {label}
                </button>
              );
            })}
            <div style={{ marginTop: 'auto', padding: 12, fontSize: 12, color: 'var(--ink3)', lineHeight: 1.5 }}>
              Stored on this device
              <br />
              Last backup: {lastBackupInfo(data.settings.lastBackup, today, data.txns.length > 0).text}
            </div>
          </nav>
          <main className="desk-main">{screen === 'home' ? body : <div className="desk-col">{body}</div>}</main>
          {screen !== 'home' && !sheet && <div className="desk-fab">{fab}</div>}
        </div>
        {toastEl}
        <SheetHost />
      </AppCtx.Provider>
    );
  }

  const activeNav = screen === 'acct' ? 'accounts' : ['budgets', 'recurring', 'settings'].includes(screen) ? 'more' : screen;
  return (
    <AppCtx.Provider value={app}>
      <div className="shell">
        <main className={'content' + (screen === 'onboarding' ? ' onboarding' : '')}>{body}</main>
        {screen !== 'onboarding' && (
          <>
            {!sheet && <div className="fab-wrap">{fab}</div>}
            <nav className="nav" aria-label="Main">
              {NAV.map(([label, id]) => {
                const on = id === activeNav;
                return (
                  <button key={id} aria-current={on ? 'page' : undefined} onClick={() => (id === 'more' ? openSheet({ kind: 'more' }) : go(id))} style={{ color: on ? 'var(--ink)' : 'var(--ink3)', fontWeight: on ? 600 : 500 }}>
                    <span style={{ background: on ? 'var(--ink)' : 'transparent' }} />
                    {label}
                  </button>
                );
              })}
            </nav>
          </>
        )}
      </div>
      {toastEl}
      <SheetHost />
    </AppCtx.Provider>
  );
}
