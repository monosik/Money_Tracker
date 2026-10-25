import { useMemo, useState } from 'react';
import { useApp } from '../ctx';
import { fmt, short } from '../lib/format';
import { catChart, catOf } from '../lib/model';
import { lastCycles } from '../lib/reports';
import { changeLabel } from '../components/ui';

const N = 6;

export function Reports() {
  const app = useApp();
  const { data, today } = app;
  const [off, setOff] = useState(0);
  const all = useMemo(() => lastCycles(data, today, N), [data, today]);
  const sel = N - 1 + off;
  const R = all[sel];

  let acc = 0;
  const stops = R.byCat.map((x) => {
    const p = R.total ? (x.a / R.total) * 100 : 0;
    const s = `${catChart(x.id)} ${acc}% ${acc + p}%`;
    acc += p;
    return s;
  });
  const maxB = Math.max(1, ...all.map((c) => c.total));
  const points = (line: number[]) => {
    const lmin = Math.min(...line);
    const lmax = Math.max(...line);
    return line.map((x, i) => `${((i * 300) / (line.length - 1)).toFixed(1)},${(92 - (lmax === lmin ? 0.5 : (x - lmin) / (lmax - lmin)) * 80).toFixed(1)}`).join(' ');
  };
  const linePts = points(all.map((c) => c.savings));
  const invPts = points(all.map((c) => c.invValue));
  const hasInv = app.d.invA.length > 0;
  const invAll = all.reduce((s, c) => s + c.invGain, 0);
  const salPct = R.total ? Math.round(((R.total - R.fromSav) / R.total) * 100) : 100;
  const canPrev = off > -(N - 1);
  const canNext = off < 0;

  return (
    <div className="screen">
      <div className="title" style={{ padding: '0 4px' }}>Reports</div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: 4 }}>
        <button aria-label="Previous cycle" disabled={!canPrev} onClick={() => setOff(off - 1)} style={{ width: 44, height: 40, border: 0, background: 'none', fontSize: 20, cursor: canPrev ? 'pointer' : 'default', opacity: canPrev ? 1 : 0.25 }}>‹</button>
        <span style={{ fontWeight: 600 }}>{R.cyc.label}</span>
        <button aria-label="Next cycle" disabled={!canNext} onClick={() => setOff(off + 1)} style={{ width: 44, height: 40, border: 0, background: 'none', fontSize: 20, cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0.25 }}>›</button>
      </div>

      {R.total === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink2)', lineHeight: 1.5 }}>No spending recorded in this cycle yet.</div>
      ) : (
        <>
          <div className="card" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Spending by category</div>
            <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
              <div role="img" aria-label="Spending by category" style={{ width: 132, height: 132, flex: 'none', borderRadius: '50%', background: `conic-gradient(${stops.join(',')})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--ink3)' }}>Total</span>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{short(R.total)}</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                {R.byCat.map((x) => (
                  <div key={x.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: catChart(x.id), flex: 'none', display: 'block' }} />
                    <span className="ellipsis" style={{ flex: 1, color: 'var(--ink2)' }}>{catOf(data, x.id).name}</span>
                    <span style={{ fontWeight: 600 }}>{Math.round((x.a / R.total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="card" style={{ borderRadius: 20, padding: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Total spent</div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{fmt(R.total)}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1.5px dashed var(--ink3)', borderRadius: 20, padding: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--ink3)' }}>Unlogged spending</div>
              <div style={{ fontSize: 19, fontWeight: 700, marginTop: 4 }}>{fmt(R.untracked)}</div>
            </div>
          </div>
          <div className="card" style={{ borderRadius: 22, padding: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 12 }}>Paid from salary vs savings</div>
            <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
              <div style={{ width: salPct + '%', background: 'var(--salary)' }} />
              <div style={{ flex: 1, background: 'var(--savings)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 13 }}>
              <div><div style={{ color: 'var(--salary)', fontWeight: 600 }}>Salary</div><div>{fmt(R.total - R.fromSav)}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ color: 'var(--savings)', fontWeight: 600 }}>Savings</div><div>{fmt(R.fromSav)}</div></div>
            </div>
          </div>
        </>
      )}

      <div className="card" style={{ borderRadius: 22, padding: 18 }}>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Spending, last 6 cycles</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
          {all.map((c, i) => (
            <div key={c.cyc.s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 10, color: 'var(--ink3)' }}>{short(c.total)}</span>
              <div style={{ width: '100%', height: Math.max(2, Math.round((c.total / maxB) * 100 * 0.82)) + '%', background: i === sel ? 'var(--salary)' : 'var(--surface2)', borderRadius: '6px 6px 3px 3px' }} />
              <span style={{ fontSize: 11, color: 'var(--ink2)' }}>{c.cyc.bar}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ borderRadius: 22, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontWeight: 600 }}>Savings growth</span>
          <span style={{ fontSize: 14, color: 'var(--savings)', fontWeight: 600 }}>{fmt(app.d.savTotal)}</span>
        </div>
        <svg viewBox="0 0 300 100" role="img" aria-label="Savings balance at the end of each cycle" style={{ width: '100%', height: 110, display: 'block', overflow: 'visible' }}>
          <polyline points={linePts} fill="none" stroke="var(--savings)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink3)', marginTop: 6 }}>
          {all.map((c) => <span key={c.cyc.s}>{c.cyc.bar}</span>)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 14 }}>
          <span style={{ color: 'var(--ink2)' }}>Interest earned · {R.cyc.label}</span>
          <span style={{ fontWeight: 600, color: R.interest ? 'var(--income)' : 'var(--ink3)' }}>{R.interest ? '+' + fmt(R.interest) : fmt(0)}</span>
        </div>
      </div>
      {hasInv && (
        <div className="card" style={{ borderRadius: 22, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>Investment growth</span>
            <span style={{ fontSize: 14, color: 'var(--invest)', fontWeight: 600 }}>{fmt(app.d.invTotal)}</span>
          </div>
          <div style={{ fontSize: 13, color: changeLabel(invAll, 0, fmt).color, marginBottom: 10 }}>{(invAll > 0 ? '+' : '') + fmt(invAll)} market change over 6 cycles</div>
          <svg viewBox="0 0 300 100" role="img" aria-label="Investment value at the end of each cycle" style={{ width: '100%', height: 110, display: 'block', overflow: 'visible' }}>
            <polyline points={invPts} fill="none" stroke="var(--invest)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${N},1fr)`, marginTop: 6, textAlign: 'center' }}>
            {all.map((c, i) => (
              <div key={c.cyc.s} style={{ textAlign: i === 0 ? 'left' : i === N - 1 ? 'right' : 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--ink3)' }}>{c.cyc.bar}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: changeLabel(c.invGain, 0, short).color }}>{c.invGain ? (c.invGain > 0 ? '+' : '−') + short(Math.abs(c.invGain)) : '–'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
