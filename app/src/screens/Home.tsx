import { useState } from 'react';
import { useApp } from '../ctx';
import { dig, fmt, onlyDigits } from '../lib/format';
import { Bar, CatGlyph, catLabel, Label } from '../components/ui';
import { catBg, catFg } from '../lib/model';
import { Icon, type IconName } from '../components/Icon';
import { TxnBody } from '../components/txn';
import { homeData } from './homeData';

export function Home() {
  const app = useApp();
  const h = homeData(app);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const quickAdd = () => app.openSheet({ kind: 'qa' });
  const more = (label: string, go: () => void) => (
    <button className="link row-btn" onClick={go} style={{ gap: 2, padding: '4px 0' }}>
      {label}
      <Icon name="chev-r" size={16} />
    </button>
  );
  const accountCard = (s: { id: string; name: string; icon: IconName; balStr: string; open: () => void }, color: string, soft: string, children: React.ReactNode) => (
    <div key={s.id} role="button" tabIndex={0} onClick={s.open} onKeyDown={(e) => e.key === 'Enter' && s.open()} style={{ flex: 'none', width: 200, border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 16, padding: 14, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span className="tile" style={{ width: 28, height: 28, borderRadius: 9, background: soft, color }}>
          <Icon name={s.icon} size={16} />
        </span>
        <span className="ellipsis" style={{ fontSize: 13, color: 'var(--ink2)', minWidth: 0 }}>{s.name}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, margin: '10px 0' }}>{s.balStr}</div>
      {children}
    </div>
  );

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 4px' }}>
        <div className="title">Home</div>
        <div className="label" style={{ gap: 6, fontSize: 13, fontWeight: 400, color: 'var(--ink3)' }}>
          <Icon name="calendar" size={16} />
          {app.d.cyc.label}
        </div>
      </div>

      <div style={{ background: h.hero.bg, color: 'var(--on-accent)', borderRadius: 24, padding: '20px 20px 18px' }}>
        <div style={{ opacity: 0.92 }}>
          <Label icon="briefcase" size={14}>Available this month</Label>
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-.03em', margin: '6px 0 2px' }}>{h.hero.availStr}</div>
        <div style={{ fontSize: 14, opacity: 0.9 }}>{h.hero.sub}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid oklch(1 0 0 / 0.22)' }}>
          <div><div style={{ fontSize: 20, fontWeight: 600 }}>{h.hero.daysLeft}</div><div style={{ fontSize: 12, opacity: 0.85 }}>days left in cycle</div></div>
          <div><div style={{ fontSize: 20, fontWeight: 600 }}>{h.hero.dailyStr}</div><div style={{ fontSize: 12, opacity: 0.85 }}>suggested per day</div></div>
        </div>
      </div>

      {h.showNothing && (
        <div className="card" style={{ borderRadius: 20, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600, marginBottom: 12 }}>
            <span className="tile" style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}>
              <Icon name="bell" />
            </span>
            Nothing logged today. Did you spend anything?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ink row-btn" onClick={quickAdd} style={{ flex: 1, height: 44, borderRadius: 12 }}>
              <Icon name="plus" size={18} />
              Quick add
            </button>
            <button className="btn-line" onClick={h.onNoSpend} style={{ flex: 1, height: 44, borderRadius: 12 }}>No spending today</button>
          </div>
        </div>
      )}

      {h.pending && (
        <div style={{ background: 'var(--savings-soft)', border: '1px solid var(--line)', borderRadius: 20, padding: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Label icon="piggy" color="var(--savings)" size={13}>Month-end sweep · {h.pending.cycle}</Label>
          </div>
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
          <span className="tile" style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--warn-soft)', color: 'var(--warn-ink)' }}>
            <Icon name="alert" />
          </span>
          <div style={{ flex: 1, fontSize: 14, lineHeight: 1.4 }}>
            <b>{h.recon.name}</b> {h.recon.invest ? `hasn't been updated in ${h.recon.days} days. Check its value in your investment app.` : `hasn't been checked in ${h.recon.days} days. Compare it with your bank app.`}
          </div>
          <button className="btn-soft" onClick={h.recon.open} style={{ borderRadius: 12, padding: '0 14px', height: 40, whiteSpace: 'nowrap' }}>{h.recon.invest ? 'Update' : 'Reconcile'}</button>
        </div>
      )}

      <div className="card" style={{ borderRadius: 24, padding: '18px 0 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 18px' }}>
          <div>
            <Label icon="piggy" color="var(--savings)">Total savings</Label>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4 }}>{fmt(app.d.savTotal)}</div>
          </div>
          {more('Accounts', () => app.go('accounts'))}
        </div>
        <div style={{ padding: '0 18px', marginTop: 4, fontSize: 14, color: h.savSpentColor }}>{h.savSpentLine}</div>
        {h.savInterestLine && <div style={{ padding: '0 18px', marginTop: 2, fontSize: 14, color: 'var(--income)' }}>{h.savInterestLine}</div>}
        {h.savingsCards.length > 0 ? (
          <div className="hscroll" data-drag="1" style={{ gap: 10, padding: '14px 18px 2px' }}>
            {h.savingsCards.map((s) => accountCard(s, 'var(--savings)', 'var(--savings-soft)', <>
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
              </>))}
          </div>
        ) : (
          <div style={{ padding: '12px 18px 0', fontSize: 14, color: 'var(--ink2)', lineHeight: 1.45 }}>No savings accounts yet. Add one in Accounts to see your savings here.</div>
        )}
      </div>

      {h.investCards.length > 0 && (
        <div className="card" style={{ borderRadius: 24, padding: '18px 0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0 18px' }}>
            <div>
              <Label icon="invest" color="var(--invest)">Investments</Label>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-.02em', marginTop: 4 }}>{fmt(app.d.invTotal)}</div>
            </div>
            {more('Growth', () => app.go('reports'))}
          </div>
          <div style={{ padding: '0 18px', marginTop: 4, fontSize: 14, color: h.invLine.color }}>{h.invLine.text}</div>
          <div className="hscroll" data-drag="1" style={{ gap: 10, padding: '14px 18px 2px' }}>
            {h.investCards.map((s) => accountCard(s, 'var(--invest)', 'var(--invest-soft)',
              <div style={{ fontSize: 12, color: s.changeColor }}>{s.gain ? s.changeStr + ' this cycle' : 'No change this cycle'}</div>,
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ borderRadius: 24, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>
            <Icon name="target" style={{ color: 'var(--salary)' }} />
            Budgets
          </div>
          {more('All budgets', () => app.go('budgets'))}
        </div>
        {h.budgetTop.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {h.budgetTop.map((b) => (
              <div key={b.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <span className="tile" style={{ width: 26, height: 26, borderRadius: 8, background: catBg(b.id), color: catFg(b.id) }}>
                      <CatGlyph cat={b} size={15} />
                    </span>
                    {catLabel(b.name)}
                  </span>
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
          <div className="label" style={{ fontSize: 16, fontWeight: 700 }}>
            <Icon name="list" style={{ color: 'var(--salary)' }} />
            Recent
          </div>
          {more('See all', () => app.go('txns'))}
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
