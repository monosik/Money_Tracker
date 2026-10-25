import { useApp } from '../ctx';
import { fmt } from '../lib/format';
import { Bar } from '../components/ui';
import { TxnIcon } from '../components/txn';
import { homeData } from './homeData';

export function DesktopHome() {
  const app = useApp();
  const h = homeData(app);
  const quickAdd = () => app.openSheet({ kind: 'qa' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em' }}>Home</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink3)' }}>{app.d.cyc.label}</div>
        <button className="btn-ink" onClick={quickAdd} style={{ marginLeft: 'auto', height: 44, padding: '0 20px', borderRadius: 14 }}>+ Quick add</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.7fr) minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: h.hero.bg, color: 'var(--on-accent)', borderRadius: 24, padding: '26px 28px', display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr', gap: 20, alignItems: 'end' }}>
            <div>
              <div className="eyebrow" style={{ opacity: 0.85 }}>Available this month</div>
              <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-.03em', margin: '6px 0 2px' }}>{h.hero.availStr}</div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>{h.hero.sub}</div>
            </div>
            <div><div style={{ fontSize: 24, fontWeight: 600 }}>{h.hero.daysLeft}</div><div style={{ fontSize: 13, opacity: 0.85 }}>days left in cycle</div></div>
            <div><div style={{ fontSize: 24, fontWeight: 600 }}>{h.hero.dailyStr}</div><div style={{ fontSize: 13, opacity: 0.85 }}>suggested per day</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="card" style={{ borderRadius: 22, padding: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 16 }}>Budgets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {h.budgetTop.map((b) => (
                  <div key={b.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}><span>{b.name}</span><span style={{ color: b.statusColor }}>{b.pctStr}</span></div>
                    <Bar pct={b.barPct} color={b.barColor} />
                    <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 5 }}>{fmt(b.spent)} of {fmt(b.budget!)}</div>
                  </div>
                ))}
              </div>
              {!h.budgetTop.length && <div style={{ fontSize: 14, color: 'var(--ink2)' }}>No budgets set yet.</div>}
            </div>
            <div className="card" style={{ borderRadius: 22, padding: '20px 20px 8px' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Recent</div>
              {h.recent.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: '1px solid var(--line)' }}>
                  <TxnIcon v={t} size={32} radius={10} font={13} showAuto={false} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ellipsis" style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                    <div className="ellipsis" style={{ fontSize: 12, color: 'var(--ink3)' }}>{t.sub}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.amtColor, whiteSpace: 'nowrap' }}>{t.amtStr}</div>
                </div>
              ))}
              {!h.recent.length && <div style={{ padding: '14px 0', borderTop: '1px solid var(--line)', fontSize: 14, color: 'var(--ink2)' }}>No transactions yet.</div>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ borderRadius: 22, padding: 20 }}>
            <div className="eyebrow" style={{ color: 'var(--savings)' }}>Total savings</div>
            <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', margin: '4px 0 2px' }}>{fmt(app.d.savTotal)}</div>
            <div style={{ fontSize: 14, color: h.savSpentColor, marginBottom: h.savInterestLine ? 2 : 14 }}>{h.savSpentLine}</div>
            {h.savInterestLine && <div style={{ fontSize: 14, color: 'var(--income)', marginBottom: 14 }}>{h.savInterestLine}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {h.savingsCards.map((s) => (
                <div key={s.id} role="button" tabIndex={0} onClick={s.open} onKeyDown={(e) => e.key === 'Enter' && s.open()} style={{ border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--ink2)' }}>{s.name}</span><span style={{ fontWeight: 600 }}>{s.balStr}</span></div>
                  {s.target ? (
                    <>
                      <Bar pct={s.pct} color="var(--savings)" h={6} style={{ marginTop: 10 }} />
                      <div style={{ fontSize: 12, color: 'var(--ink3)', marginTop: 5 }}>{s.pctStr} of {s.targetStr}</div>
                    </>
                  ) : null}
                  {s.spent > 0 && <div style={{ fontSize: 12, color: 'var(--expense)', marginTop: 4 }}>{s.spentStr} spent this cycle</div>}
                  {s.interest > 0 && <div style={{ fontSize: 12, color: 'var(--income)', marginTop: 4 }}>{s.interestStr} interest this year</div>}
                </div>
              ))}
            </div>
          </div>
          {h.investCards.length > 0 && (
            <div className="card" style={{ borderRadius: 22, padding: 20 }}>
              <div className="eyebrow" style={{ color: 'var(--invest)' }}>Investments</div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', margin: '4px 0 2px' }}>{fmt(app.d.invTotal)}</div>
              <div style={{ fontSize: 14, color: h.invLine.color, marginBottom: 14 }}>{h.invLine.text}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {h.investCards.map((s) => (
                  <div key={s.id} role="button" tabIndex={0} onClick={s.open} onKeyDown={(e) => e.key === 'Enter' && s.open()} style={{ border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span style={{ color: 'var(--ink2)' }}>{s.name}</span><span style={{ fontWeight: 600 }}>{s.balStr}</span></div>
                    <div style={{ fontSize: 12, color: s.changeColor, marginTop: 4 }}>{s.gain ? s.changeStr + ' this cycle' : 'No change this cycle'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {h.pending && (
            <div style={{ background: 'var(--savings-soft)', border: '1px solid var(--line)', borderRadius: 22, padding: 18 }}>
              <div className="eyebrow" style={{ color: 'var(--savings)', marginBottom: 6 }}>Month-end sweep</div>
              <div style={{ fontWeight: 600, lineHeight: 1.35 }}>Move {h.pending.amountStr} to {h.pending.toName}.</div>
              <div style={{ color: 'var(--ink2)', fontSize: 14, margin: '2px 0 12px' }}>Did you transfer it in your bank app?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={h.pending.done} style={{ flex: 1, height: 40, borderRadius: 12, background: 'var(--savings)', color: 'var(--on-accent)' }}>Done</button>
                <button className="btn-line" onClick={h.pending.skip} style={{ flex: 1, height: 40, borderRadius: 12 }}>Skip</button>
              </div>
            </div>
          )}
          {h.recon && (
            <div className="card" role="button" tabIndex={0} onClick={h.recon.open} onKeyDown={(e) => e.key === 'Enter' && h.recon!.open()} style={{ borderRadius: 22, padding: 18, fontSize: 14, lineHeight: 1.45, cursor: 'pointer' }}>
              <b>{h.recon.name}</b> {h.recon.invest ? `hasn't been updated in ${h.recon.days} days. Check its value in your investment app.` : `hasn't been checked in ${h.recon.days} days. Compare it with your bank app to catch anything you forgot.`}
            </div>
          )}
          {h.showNothing && (
            <div className="card" style={{ borderRadius: 22, padding: 18 }}>
              <div style={{ fontWeight: 600, marginBottom: 10 }}>Nothing logged today. Did you spend anything?</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-ink" onClick={quickAdd} style={{ flex: 1, height: 40, borderRadius: 12 }}>Quick add</button>
                <button className="btn-line" onClick={h.onNoSpend} style={{ flex: 1, height: 40, borderRadius: 12 }}>No spending today</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
