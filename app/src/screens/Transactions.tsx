import { useRef, useState } from 'react';
import { useApp } from '../ctx';
import { addDays, dayDiff, DOW, nice, parse } from '../lib/dates';
import { fmt } from '../lib/format';
import type { Txn } from '../lib/model';
import { chipStyle } from '../components/ui';
import { deco, TxnBody } from '../components/txn';

const TYPES = [
  { label: 'All', value: 'all' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
  { label: 'Transfers', value: 'transfer' },
  { label: 'Interest', value: 'interest' },
  { label: 'Value updates', value: 'revalue' },
  { label: 'Untracked', value: 'adjust' },
];

const selectStyle = { minWidth: 0, border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: 10, padding: '9px 8px', fontSize: 13 };

export function Transactions() {
  const app = useApp();
  const { data, d, today, filters: F } = app;
  const [swiped, setSwiped] = useState<string | null>(null);
  const press = useRef<{ x: number; id: string } | null>(null);
  const setF = (p: Partial<typeof F>) => {
    app.setFilters({ ...F, ...p });
    setSwiped(null);
  };

  const from = F.range === 'cycle' ? d.cyc.s : F.range === '7' ? addDays(today, -6) : '0000';
  const filt = d.sorted.filter(
    (t) =>
      t.date >= from &&
      (F.type === 'all' || t.type === F.type || (F.type === 'interest' && t.type === 'income' && t.source === 'Interest')) &&
      (F.acct === 'all' || t.acct === F.acct || t.to === F.acct) &&
      (F.cat === 'all' || t.cat === F.cat),
  );
  const groups: { date: string; items: Txn[] }[] = [];
  filt.forEach((t) => {
    const g = groups[groups.length - 1];
    if (g && g.date === t.date) g.items.push(t);
    else groups.push({ date: t.date, items: [t] });
  });

  const del = (t: Txn) => {
    setSwiped(null);
    app.commit((x) => ({ ...x, txns: x.txns.filter((y) => y.id !== t.id) }), 'Transaction deleted');
  };

  return (
    <div className="screen" style={{ gap: 12 }}>
      <div className="title" style={{ padding: '0 4px' }}>Transactions</div>
      <div className="hscroll" style={{ gap: 6 }}>
        {TYPES.map((o) => (
          <button key={o.value} onClick={() => setF({ type: o.value })} style={chipStyle(o.value === F.type, { flex: 'none', borderRadius: 999, padding: '8px 14px', fontSize: 14 })}>
            {o.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <select aria-label="Account" value={F.acct} onChange={(e) => setF({ acct: e.target.value })} style={selectStyle}>
          <option value="all">All accounts</option>
          {data.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select aria-label="Category" value={F.cat} onChange={(e) => setF({ cat: e.target.value })} style={selectStyle}>
          <option value="all">All categories</option>
          {data.cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select aria-label="Date range" value={F.range} onChange={(e) => setF({ range: e.target.value as typeof F.range })} style={selectStyle}>
          <option value="cycle">This cycle</option>
          <option value="7">Last 7 days</option>
          <option value="all">All time</option>
        </select>
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink3)', padding: '0 4px' }}>Swipe left or tap a row to edit or delete.</div>

      {groups.map((g) => {
        const spent = g.items.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const dd = dayDiff(g.date, today);
        const label = dd === 0 ? 'Today' : dd === 1 ? 'Yesterday' : DOW[parse(g.date).getDay()] + ', ' + nice(g.date);
        return (
          <div key={g.date}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: 13, color: 'var(--ink3)' }}>
              <span style={{ fontWeight: 600, color: 'var(--ink2)' }}>{label}</span>
              <span>{spent ? '−' + fmt(spent) : ''}</span>
            </div>
            <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
              {g.items.map((t, i) => {
                const v = deco(data, t);
                const canEdit = t.type !== 'adjust' && t.type !== 'revalue';
                const on = swiped === t.id;
                return (
                  <div key={t.id} style={{ position: 'relative', borderTop: i ? '1px solid var(--line)' : 'none' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, display: 'flex' }}>
                      {canEdit && <button className="btn" tabIndex={on ? 0 : -1} onClick={() => { setSwiped(null); app.openSheet({ kind: 'qa', edit: t }); }} style={{ width: 74, background: 'var(--surface2)' }}>Edit</button>}
                      <button className="btn" tabIndex={on ? 0 : -1} onClick={() => del(t)} style={{ width: 74, background: 'var(--expense)', color: 'var(--on-accent)' }}>Delete</button>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={on}
                      onPointerDown={(e) => { press.current = { x: e.clientX, id: t.id }; }}
                      onPointerUp={(e) => {
                        const p = press.current;
                        if (!p || p.id !== t.id) return;
                        press.current = null;
                        const dx = e.clientX - p.x;
                        setSwiped(dx < -30 ? t.id : dx > 30 ? null : on ? null : t.id);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSwiped(on ? null : t.id); } }}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface)', transform: `translateX(${on ? (canEdit ? -148 : -74) : 0}px)`, transition: 'transform .22s ease', cursor: 'pointer', touchAction: 'pan-y', userSelect: 'none' }}
                    >
                      <TxnBody v={v} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {!groups.length && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink2)', fontSize: 15, lineHeight: 1.5 }}>
          {data.txns.length ? 'No transactions match these filters.' : 'No transactions yet. Tap + to log your first one.'}
        </div>
      )}
    </div>
  );
}
