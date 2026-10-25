import { useEffect, useState } from 'react';
import { useApp, type Screen } from '../ctx';
import { firstDueAfter } from '../lib/dates';
import { dig, fmt, onlyDigits, ordinal, uid } from '../lib/format';
import { acctOf, emptyData, type Rule } from '../lib/model';
import { Seg } from '../components/ui';
import { AccountForm } from '../screens/Onboarding';
import { QuickAdd } from './QuickAdd';

export function SheetHost() {
  const app = useApp();
  const s = app.sheet;
  useEffect(() => {
    if (!s) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && app.closeSheet();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s, app]);
  if (!s) return null;
  return (
    <>
      <div className="scrim" onClick={app.closeSheet} />
      <div className="sheet" role="dialog" aria-modal="true">
        <div className="grabber" />
        {s.kind === 'qa' && <QuickAdd edit={s.edit} />}
        {s.kind === 'more' && <More />}
        {s.kind === 'recon' && <Reconcile acct={s.acct} />}
        {s.kind === 'rule' && <RuleSheet rule={s.rule} />}
        {s.kind === 'account' && <AddAccount />}
        {s.kind === 'reset' && <ConfirmReset />}
      </div>
    </>
  );
}

function More() {
  const app = useApp();
  const items: [string, Screen, string][] = [['Budgets', 'budgets', 'Monthly limits'], ['Recurring', 'recurring', 'Bills & salary'], ['Settings', 'settings', 'Backup, payday']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 6 }}>
      {items.map(([label, id, hint]) => (
        <button key={id} onClick={() => app.go(id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 58, padding: '0 18px', borderRadius: 16, border: '1px solid var(--line)', background: 'var(--bg)', fontSize: 16, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
          <span>{label}</span>
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink3)' }}>{hint}</span>
        </button>
      ))}
    </div>
  );
}

function Reconcile({ acct }: { acct: string }) {
  const app = useApp();
  const { data, today } = app;
  const [digits, setDigits] = useState('');
  const a = acctOf(data, acct);
  const app_ = app.d.bal(acct);
  const has = digits !== '';
  const real = Number(digits) || 0;
  const diff = real - app_;
  const markChecked = (x: typeof data) => x.accounts.map((y) => (y.id === acct ? { ...y, lastRec: today } : y));

  const record = () => {
    app.commit((x) => ({ ...x, txns: x.txns.concat([{ id: 'n' + x.seq, seq: x.seq, type: 'adjust', amount: diff, acct, date: today, note: 'Untracked' }]), seq: x.seq + 1, accounts: markChecked(x) }), `Recorded ${fmt(Math.abs(diff))} as Untracked`);
    app.closeSheet();
  };
  const find = () => app.go('txns', { filters: { type: 'all', acct, cat: 'all', range: '7' } });
  const markOk = () => {
    app.commit((x) => ({ ...x, accounts: markChecked(x) }));
    app.closeSheet();
    app.toast(a.name + ' checked');
  };

  const explain = !has
    ? 'The difference is money you spent or received without logging it.'
    : diff === 0
      ? 'Everything matches. Nice.'
      : diff < 0
        ? `${fmt(-diff)} left the account without being logged. Record it as Untracked, or look for the missing entries yourself.`
        : `${fmt(diff)} more than expected. Record it as Untracked income, or find the missing entry.`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Reconcile {a.name}</div>
      <div style={{ fontSize: 14, color: 'var(--ink2)' }}>Enter the real balance from your bank app.</div>
      <div className="money-field" style={{ border: '1.5px solid var(--ink)', background: 'var(--bg)', borderRadius: 14 }}>
        <span style={{ fontSize: 18 }}>Rp</span>
        <input autoFocus value={dig(digits)} onChange={(e) => setDigits(onlyDigits(e.target.value, 13))} inputMode="numeric" placeholder="0" aria-label="Real balance" style={{ padding: '14px 8px', fontSize: 22, fontWeight: 600 }} />
      </div>
      <div style={{ background: 'var(--surface2)', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink2)' }}>Balance in app</span><span>{fmt(app_)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--ink2)' }}>Real balance</span><span>{has ? fmt(real) : '—'}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: 8, fontWeight: 700 }}>
          <span>Difference</span>
          <span style={{ color: !has || diff === 0 ? 'var(--ink)' : diff < 0 ? 'var(--expense)' : 'var(--income)' }}>{has ? (diff > 0 ? '+' : '') + fmt(diff) : '—'}</span>
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink2)', lineHeight: 1.45 }}>{explain}</div>
      {has && diff !== 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn-line" onClick={find} style={{ height: 50, borderRadius: 14 }}>I'll find it</button>
          <button className="btn-ink" onClick={record} style={{ height: 50, borderRadius: 14 }}>Record as Untracked</button>
        </div>
      )}
      {has && diff === 0 && (
        <button className="btn" onClick={markOk} style={{ height: 50, borderRadius: 14, background: 'var(--income)', color: 'var(--on-accent)' }}>Balances match · Mark as checked</button>
      )}
    </div>
  );
}

function RuleSheet({ rule }: { rule: Rule | null }) {
  const app = useApp();
  const { data, d, today } = app;
  const [r, setR] = useState(() => ({
    name: rule?.name || '',
    type: rule?.type || ('expense' as Rule['type']),
    digits: rule ? String(rule.amount) : '',
    acct: rule?.acct || (d.salA[0] || data.accounts[0])?.id || '',
    cat: rule?.cat || 'bills',
    day: rule?.day || 1,
  }));
  const set = (p: Partial<typeof r>) => setR({ ...r, ...p });
  const ok = !!r.name.trim() && !!Number(r.digits) && !!r.acct;
  const sel = { border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 12, padding: '11px 10px', minWidth: 0 } as const;

  const save = () => {
    if (!ok) return;
    const base = { name: r.name.trim(), type: r.type, amount: Number(r.digits), acct: r.acct, cat: r.type === 'expense' ? r.cat : null, day: r.day };
    app.commit((x) => ({
      ...x,
      recurring: rule
        ? x.recurring.map((y) => (y.id === rule.id ? { ...y, ...base, nextDue: y.day === r.day ? y.nextDue : firstDueAfter(today, r.day) } : y))
        : x.recurring.concat([{ id: uid('r'), ...base, paused: false, nextDue: firstDueAfter(today, r.day) }]),
    }));
    app.closeSheet();
  };
  const del = () => {
    app.commit((x) => ({ ...x, recurring: x.recurring.filter((y) => y.id !== rule!.id) }), 'Rule deleted');
    app.closeSheet();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>{rule ? 'Edit rule' : 'New recurring rule'}</div>
      <Seg value={r.type} onChange={(t) => set({ type: t })} opts={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }]} />
      <input className="text-field" value={r.name} onChange={(e) => set({ name: e.target.value })} placeholder="Name, e.g. Internet bill" aria-label="Rule name" />
      <div className="money-field" style={{ background: 'var(--bg)' }}>
        <span>Rp</span>
        <input value={dig(r.digits)} onChange={(e) => set({ digits: onlyDigits(e.target.value) })} inputMode="numeric" placeholder="Amount" aria-label="Amount" style={{ padding: '12px 6px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <select aria-label="Account" value={r.acct} onChange={(e) => set({ acct: e.target.value })} style={sel}>
          {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select aria-label="Day of month" value={String(r.day)} onChange={(e) => set({ day: Number(e.target.value) })} style={sel}>
          {Array.from({ length: 31 }, (_, i) => <option key={i} value={i + 1}>Every {ordinal(i + 1)}</option>)}
        </select>
      </div>
      {r.type === 'expense' && (
        <select aria-label="Category" value={r.cat} onChange={(e) => set({ cat: e.target.value })} style={sel}>
          {d.activeCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Logged automatically on the due date and shown in Auto-logged for review.</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {rule && <button onClick={del} style={{ height: 52, padding: '0 18px', borderRadius: 14, border: '1px solid var(--line)', background: 'none', color: 'var(--expense)', fontWeight: 600, cursor: 'pointer' }}>Delete</button>}
        <button className="btn-ink" onClick={save} aria-disabled={!ok} style={{ flex: 1, height: 52, borderRadius: 14, opacity: ok ? 1 : 0.4 }}>Save rule</button>
      </div>
    </div>
  );
}

function AddAccount() {
  const app = useApp();
  const { today } = app;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Add account</div>
      <AccountForm
        withTarget
        defaultRole="Savings"
        onAdd={(a) => {
          app.commit((x) => ({
            ...x,
            accounts: x.accounts.concat([{ id: a.id, name: a.name, type: a.type, role: a.role, start: a.bal, target: a.target, lastRec: today }]),
            settings: a.role === 'Savings' && !x.settings.defSav ? { ...x.settings, defSav: a.id } : x.settings,
          }));
          app.closeSheet();
          app.toast(a.name + ' added');
        }}
      />
    </div>
  );
}

function ConfirmReset() {
  const app = useApp();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Reset all data?</div>
      <div style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.5 }}>This deletes every account, transaction and setting on this device. It can't be undone. Export a backup first if you might need it.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
        <button className="btn-line" onClick={app.closeSheet} style={{ height: 50, borderRadius: 14 }}>Cancel</button>
        <button className="btn" onClick={() => { app.commit(() => emptyData()); app.go('onboarding'); }} style={{ height: 50, borderRadius: 14, background: 'var(--expense)', color: 'var(--on-accent)' }}>Reset everything</button>
      </div>
    </div>
  );
}
