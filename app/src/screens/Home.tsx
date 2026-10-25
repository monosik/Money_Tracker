import { useState } from 'react';
import { useApp } from '../ctx';
import { dig, fmt, onlyDigits } from '../lib/format';
import { Bar } from '../components/ui';
import { TxnBody } from '../components/txn';
import { homeData } from './homeData';

export function Home() {
  const app = useApp();
  const h = homeData(app);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const quickAdd = () => app.openSheet({ kind: 'qa' });

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
        <div className="title">Home</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>{app.d.cyc.label}</div>
      </div>

      <div style={{ background: h.hero.bg, color: 'var(--on-accent)', borderRadius: 24, padding: '20px 20px 18px' }}>
        <div className="eyebrow" style={{ opacity: 0.85 }}>Available this month</div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em', margin: '6px 0 2px' }}>{h.hero.availStr}</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>{h.hero.sub}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid oklch(1 0 0 / 0.22)' }}>
          <div><div style={{ fontSize: 20, fontWeight: 600 }}>{h.hero.daysLeft}</div><div style={{ fontSize: 12, opacity: 0.85 }}>days left in cycle</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 600 }}>{h.hero.dailyStr}</div><div style={{ fontSize: 12, opacity: 0.85 }}>suggested per day</div></div>
        </div>
      </div>

      {h.showNothing && (
        <div className="card" style={{ borderRadius: 20, padding: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Nothing logged today. Did you spend anything?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ink" onClick={quickAdd} style={{ flex: 1, height: 44, borderRadius: 12 }}>Quick add</button>
            <button className="btn-line" onClick={h.onNoSpend} style={{ flex: 1, height: 44, borderRadius: 12 }}>No spending today</button>
          </div>
        </div>
      )}

      {h.pending && (
        <div style={{ background: 'var(--savings-soft)', border: '1px solid var(--line)', borderRadius: 20, padding: 16 }}>
          <div className="eyebrow" style={{ color: 'var(--savings)', marginBottom: 6 }}>Month-end sweep · {h.pending.cycle}</div>
          <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.35, marginBottom: 4 }}>Move {h.pending.amountStr} to {h.pending.toName}.</div>
          <div style={{ color: 'var(--ink2)', fontSize: 14, marginBottom: 12 }}>Did you transfer it in your bank app?</div>
          {editing && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div className="money-field" style={{ flex: 1, background: 'var(--surface)', padding: '0 12px' }}>
                <span>Rp</span>
                <input value={dig(draft)} onChange={(e) => setDraft(onlyDigits(e.target.value))} inputMode="numeric" aria-label="Sweep amount" style={{ padding: '10px 6px', fontSize: 15 }} />
              </div>
              <button className="btn-ink" onClick={() => { const a = Number(draft); if (a) { h.pending!.setAmount(a); setEditing(false); } }} style={{ borderRadius: 12, padding: '0 16px' }}>Update</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { setEditing(false); h.pending!.done(); }} style={{ flex: 1.3, height: 44, borderRadius: 12, background: 'var(--savings)', color: 'var(--on-accent)' }}>Done</button>
            <button className="btn-line" onClick={() => { setEditing(!editing); setDraft(String(app.data.pending!.amount)); }} style={{ flex: 1.3, height: 44, borderRadius: 12 }}>Edit amount</button>
            <button className="btn-line" onClick={() => { setEditing(false); h.pending!.skip(); }} style={{ flex: 1, height: 44, borderRadius: 12 }}>Skip</button>
          </div>
        </div>
      )}

      {h.recon && (
        <div className="card" style={{ borderRadius: 20, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="dot" style={{ width: 10, height: 10, background: 'var(--warn)' }} />
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>
            <b>{h.recon.name}</b> {h.recon.invest ? `hasn't been updated in ${h.recon.days} days. Check its value in your investment app.` : `hasn't been checked in ${h.recon.days} days. Compare it with your bank app.`}
          </div>
          <button className="btn-soft" onClick={h.recon.open} style={{ borderRadius: 12, padding: '0 14px', height: 40, whiteSpace: 'nowrap' }}>{h.recon.invest ? 'Update' : 'Reconcile'}</button>
        </div>
      )}

      <div className="card" style={{ borderRadius: 24, padding: '18px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 18px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--savings)' }}>Total savings</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4 }}>{fmt(app.d.savTotal)}</div>
          </div>
          <button className="link" onClick={() => app.go('accounts')} style={{ padding: '4px 0' }}>Accounts ›</button>
        </div>
        <div style={{ padding: '0 18px', marginTop: 4, fontSize: 14, color: h.savSpentColor }}>{h.savSpentLine}</div>
        {h.savInterestLine && <div style={{ padding: '0 18px', marginTop: 2, fontSize: 14, color: 'var(--income)' }}>{h.savInterestLine}</div>}
        {h.savingsCards.length > 0 ? (
          <div className="hscroll" style={{ gap: 10, padding: '14px 18px 2px' }}>
            {h.savingsCards.map((s) => (
              <div key={s.id} role="button" tabIndex={0} onClick={s.open} onKeyDown={(e) => e.key === 'Enter' && s.open()} style={{ flex: 'none', width: 200, border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 16, padding: 14, cursor: 'pointer' }}>
                <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{s.name}</div>
                <div style={{ fontSize: 19, fontWeight: 600, margin: '4px 0 10px' }}>{s.balStr}</div>
                {s.target ? (
                  <>
                    <Bar pct={s.pct} color="var(--savings)" h={6} />
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 6 }}>{s.pctStr} of {s.targetStr}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ink3)' }}>No target set · <span style={{ color: 'var(--savings)' }}>Set one</span></div>
                )}
                {s.spent > 0 && <div style={{ fontSize: 12, color: 'var(--expense)', marginTop: 6 }}>{s.spentStr} spent this cycle</div>}
                {s.interest > 0 && <div style={{ fontSize: 12, color: 'var(--income)', marginTop: 6 }}>{s.interestStr} interest this year</div>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px 18px 0', fontSize: 14, color: 'var(--ink2)', lineHeight: 1.45 }}>No savings accounts yet. Add one in Accounts to see your savings here.</div>
        )}
      </div>

      {h.investCards.length > 0 && (
        <div className="card" style={{ borderRadius: 24, padding: '18px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 18px' }}>
            <div>
              <div className="eyebrow" style={{ color: 'var(--invest)' }}>Investments</div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4 }}>{fmt(app.d.invTotal)}</div>
            </div>
            <button className="link" onClick={() => app.go('reports')} style={{ padding: '4px 0' }}>Growth ›</button>
          </div>
          <div style={{ padding: '0 18px', marginTop: 4, fontSize: 14, color: h.invLine.color }}>{h.invLine.text}</div>
          <div className="hscroll" style={{ gap: 10, padding: '14px 18px 2px' }}>
            {h.investCards.map((s) => (
              <div key={s.id} role="button" tabIndex={0} onClick={s.open} onKeyDown={(e) => e.key === 'Enter' && s.open()} style={{ flex: 'none', width: 200, border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 16, padding: 14, cursor: 'pointer' }}>
                <div style={{ fontSize: 13, color: 'var(--ink2)' }}>{s.name}</div>
                <div style={{ fontSize: 19, fontWeight: 600, margin: '4px 0 6px' }}>{s.balStr}</div>
                <div style={{ fontSize: 12, color: s.changeColor }}>{s.gain ? s.changeStr + ' this cycle' : 'No change this cycle'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ borderRadius: 24, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 600 }}>Budgets</div>
          <button className="link" onClick={() => app.go('budgets')}>All budgets ›</button>
        </div>
        {h.budgetTop.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {h.budgetTop.map((b) => (
              <div key={b.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{b.name}</span>
                  <span style={{ color: b.statusColor }}>{fmt(b.spent)} <span style={{ color: 'var(--ink3)' }}>/ {fmt(b.budget!)}</span></span>
                </div>
                <Bar pct={b.barPct} color={b.barColor} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: 'var(--ink2)', lineHeight: 1.45 }}>No budgets yet. Set a monthly limit for a category to see how close you are.</div>
            <button className="btn-soft" onClick={() => app.go('budgets')} style={{ marginTop: 12, borderRadius: 12, height: 40, padding: '0 14px' }}>Set a budget</button>
          </>
        )}
      </div>

      <div className="card" style={{ borderRadius: 24, padding: '18px 18px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div style={{ fontWeight: 600 }}>Recent</div>
          <button className="link" onClick={() => app.go('txns')}>See all ›</button>
        </div>
        {h.recent.map((t) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderTop: '1px solid var(--line)' }}>
            <TxnBody v={t} />
          </div>
        ))}
        {!h.recent.length && (
          <div style={{ padding: '18px 0 14px', borderTop: '1px solid var(--line)', fontSize: 14, color: 'var(--ink2)', lineHeight: 1.45 }}>
            No transactions yet. Tap <b>+</b> to log your first expense — it takes three taps.
          </div>
        )}
      </div>
    </div>
  );
}
