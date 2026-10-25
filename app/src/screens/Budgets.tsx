import { useState } from 'react';
import { useApp } from '../ctx';
import { budgetRow } from '../lib/derive';
import { dig, fmt, onlyDigits } from '../lib/format';
import { catChart } from '../lib/model';
import { Bar, divider } from '../components/ui';

export function Budgets() {
  const app = useApp();
  const { data, d } = app;
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const editing = !!draft;

  const toggle = () => {
    if (editing) return setDraft(null);
    const x: Record<string, string> = {};
    data.cats.forEach((c) => (x[c.id] = c.budget ? String(c.budget) : ''));
    setDraft(x);
  };
  const save = () => {
    const x = draft!;
    app.commit((dd) => ({ ...dd, cats: dd.cats.map((c) => ({ ...c, budget: Number(x[c.id]) || null })) }));
    setDraft(null);
    app.toast('Budgets updated');
  };

  const cats = d.activeCats;
  const totB = cats.reduce((s, c) => s + (c.budget || 0), 0);
  const totS = cats.filter((c) => c.budget).reduce((s, c) => s + (d.spentBy[c.id] || 0), 0);

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div className="title">Budgets</div>
        <button className="btn-line" onClick={toggle} style={{ borderRadius: 10, height: 36, padding: '0 14px' }}>{editing ? 'Cancel' : 'Edit'}</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink3)', padding: '0 4px' }}>
        {d.cyc.label} · {totB ? `${fmt(totS)} of ${fmt(totB)} budgeted` : 'No budgets set — tap Edit to add limits'}
      </div>
      <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
        {cats.map((c, i) => {
          const r = budgetRow(c, d.spentBy);
          const sp = d.spentBy[c.id] || 0;
          const right = c.budget ? fmt(c.budget) : sp ? fmt(sp) + ' spent · no limit' : 'No limit';
          const remain = c.budget ? (c.budget - sp >= 0 ? fmt(c.budget - sp) + ' left' : fmt(sp - c.budget) + ' over') : '';
          return (
            <div key={c.id} style={{ padding: '14px 16px', borderTop: divider(i) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="dot" style={{ width: 10, height: 10, background: catChart(c.id) }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{c.name}</span>
                {!editing && <span style={{ fontSize: 14, color: c.budget ? r.statusColor : 'var(--ink3)' }}>{right}</span>}
                {editing && (
                  <div className="money-field" style={{ background: 'var(--bg)', borderRadius: 10, padding: '0 10px', width: 150 }}>
                    <span style={{ fontSize: 13 }}>Rp</span>
                    <input value={dig(draft![c.id] || '')} onChange={(e) => setDraft({ ...draft!, [c.id]: onlyDigits(e.target.value) })} inputMode="numeric" placeholder="No limit" aria-label={c.name + ' budget'} style={{ padding: '8px 4px', textAlign: 'right' }} />
                  </div>
                )}
              </div>
              {!editing && c.budget && (
                <>
                  <Bar pct={r.barPct} color={r.barColor} style={{ margin: '10px 0 6px 20px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink3)', marginLeft: 20 }}>
                    <span>{fmt(sp)} spent · {r.pctStr}</span>
                    <span style={{ color: r.statusColor }}>{remain}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      {editing && <button className="btn-ink" onClick={save} style={{ height: 52, borderRadius: 16, fontSize: 16 }}>Save budgets</button>}
    </div>
  );
}
