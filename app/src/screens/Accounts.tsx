import { useState } from 'react';
import { useApp } from '../ctx';
import { targetPct } from '../lib/derive';
import { addDays, cycleFor, dayDiff } from '../lib/dates';
import { dig, fmt, initials, onlyDigits } from '../lib/format';
import { balanceOf, type Account, type Role } from '../lib/model';
import { Bar, changeLabel, divider, roleColor } from '../components/ui';
import { deco, TxnIcon } from '../components/txn';

const checked = (a: Account, today: string) => {
  const n = dayDiff(a.lastRec || today, today);
  return n === 0 ? 'today' : n + 'd ago';
};

export function Accounts() {
  const app = useApp();
  const { d, today } = app;
  const open = (a: Account) => app.go('acct', { acctId: a.id });
  const badge = (role: Role) => ({ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flex: 'none', background: roleColor(role).soft, color: roleColor(role).c }) as const;

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div className="title">Accounts</div>
        <button className="btn-line" onClick={() => app.openSheet({ kind: 'account' })} style={{ borderRadius: 10, height: 36, padding: '0 14px' }}>+ Add account</button>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: 13 }}>
          <span className="eyebrow" style={{ color: 'var(--salary)' }}>Salary</span>
          <span style={{ color: 'var(--ink2)' }}>{fmt(d.salBal)}</span>
        </div>
        <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
          {d.salA.map((a, i) => {
            const b = d.bal(a.id);
            return (
              <div key={a.id} role="button" tabIndex={0} onClick={() => open(a)} onKeyDown={(e) => e.key === 'Enter' && open(a)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderTop: divider(i), cursor: 'pointer' }}>
                <span style={badge('Salary')}>{initials(a.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{a.type} · checked {checked(a, today)}</div></div>
                <div style={{ fontWeight: 600, color: b < 0 ? 'var(--expense)' : 'var(--ink)' }}>{fmt(b)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: 13 }}>
          <span className="eyebrow" style={{ color: 'var(--savings)' }}>Savings</span>
          <span style={{ color: 'var(--ink2)' }}>{fmt(d.savTotal)}</span>
        </div>
        <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
          {d.savA.map((a, i) => {
            const b = d.bal(a.id);
            const pct = targetPct(b, a.target);
            return (
              <div key={a.id} role="button" tabIndex={0} onClick={() => open(a)} onKeyDown={(e) => e.key === 'Enter' && open(a)} style={{ padding: 14, borderTop: divider(i), cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={badge('Savings')}>{initials(a.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{a.type} · checked {checked(a, today)}</div></div>
                  <div style={{ fontWeight: 600 }}>{fmt(b)}</div>
                </div>
                {a.target && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 0 52px' }}>
                    <Bar pct={pct} color="var(--savings)" h={6} style={{ flex: 1 }} />
                    <span style={{ fontSize: 12, color: 'var(--ink3)' }}>{pct}% of {fmt(a.target)}</span>
                  </div>
                )}
              </div>
            );
          })}
          {!d.savA.length && <div style={{ padding: '18px 16px', fontSize: 14, color: 'var(--ink2)', lineHeight: 1.45 }}>No savings accounts yet. Add one to track it separately from your salary.</div>}
        </div>
      </div>
      {d.invA.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: 13 }}>
            <span className="eyebrow" style={{ color: 'var(--invest)' }}>Investments</span>
            <span style={{ color: 'var(--ink2)' }}>{fmt(d.invTotal)}</span>
          </div>
          <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
            {d.invA.map((a, i) => {
              const g = d.growthOf(a.id);
              const ch = changeLabel(g.gain, g.startValue, fmt);
              return (
                <div key={a.id} role="button" tabIndex={0} onClick={() => open(a)} onKeyDown={(e) => e.key === 'Enter' && open(a)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderTop: divider(i), cursor: 'pointer' }}>
                  <span style={badge('Investment')}>{initials(a.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{a.type} · updated {checked(a, today)}</div></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{fmt(d.bal(a.id))}</div>
                    {g.gain !== 0 && <div style={{ fontSize: 12, color: ch.color }}>{ch.text}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AccountDetail() {
  const app = useApp();
  const { data, d, today } = app;
  const [targetDraft, setTargetDraft] = useState('');
  const da = data.accounts.find((a) => a.id === app.acctId);
  if (!da) return null;

  const b = d.bal(da.id);
  const isSav = da.role === 'Savings';
  const isInv = da.role === 'Investment';
  const rc = roleColor(da.role);
  const interest = d.interestOf(da.id);
  const allGain = data.txns.filter((t) => t.type === 'revalue' && t.acct === da.id).reduce((s, t) => s + t.amount, 0);
  const history = isInv
    ? Array.from({ length: 6 }, (_, i) => {
        const c = cycleFor(today, data.settings.payday, -i);
        const gain = data.txns.filter((t) => t.type === 'revalue' && t.acct === da.id && t.date >= c.s && t.date <= c.e).reduce((s, t) => s + t.amount, 0);
        const start = balanceOf(data, da.id, addDays(c.s, -1));
        return { label: c.label, value: balanceOf(data, da.id, c.e), ch: changeLabel(gain, start, fmt), gain };
      })
    : [];
  const pct = targetPct(b, da.target);
  const sp = isSav ? d.savSpentOf(da.id) : 0;
  const items = d.sorted.filter((t) => t.acct === da.id || t.to === da.id).map((t) => deco(data, t, da.id));
  const lr = dayDiff(da.lastRec || today, today);
  const saveTarget = () => {
    const tg = Number(targetDraft);
    if (!tg) return;
    app.commit((x) => ({ ...x, accounts: x.accounts.map((a) => (a.id === da.id ? { ...a, target: tg } : a)) }));
    setTargetDraft('');
  };

  return (
    <div className="screen" style={{ paddingTop: 4 }}>
      <button className="link" onClick={() => app.go('accounts')} style={{ alignSelf: 'flex-start', fontSize: 15, padding: '6px 4px' }}>‹ Accounts</button>
      <div className="card" style={{ borderRadius: 24, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="eyebrow" style={{ color: rc.c }}>{da.role}</span>
          <span style={{ fontSize: 12, color: 'var(--ink3)' }}>· {da.type}</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 6 }}>{da.name}</div>
        <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-.03em', margin: '6px 0 4px' }}>{fmt(b)}</div>
        {isSav && da.target && (
          <>
            <Bar pct={pct} color="var(--savings)" style={{ marginTop: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink3)', marginTop: 6 }}>
              <span>{pct}% of {fmt(da.target)}</span>
              <span>{fmt(Math.max(0, da.target - b))} to go</span>
            </div>
          </>
        )}
        {isSav && !da.target && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <div className="money-field" style={{ flex: 1, background: 'var(--bg)', padding: '0 12px' }}>
              <span style={{ fontSize: 14 }}>Target Rp</span>
              <input value={dig(targetDraft)} onChange={(e) => setTargetDraft(onlyDigits(e.target.value))} inputMode="numeric" placeholder="20.000.000" aria-label="Savings target" style={{ padding: '10px 6px' }} />
            </div>
            <button className="btn" onClick={saveTarget} style={{ borderRadius: 12, padding: '0 14px', background: 'var(--savings)', color: 'var(--on-accent)' }}>Set target</button>
          </div>
        )}
        {sp > 0 && <div style={{ marginTop: 12, fontSize: 14, color: 'var(--expense)' }}>−{fmt(sp)} spent from savings this cycle</div>}
        {isSav && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 14, color: interest.year ? 'var(--income)' : 'var(--ink3)' }}>
              {interest.year ? `+${fmt(interest.year)} interest this year` : 'No interest logged this year'}
              {interest.cycle > 0 && <span style={{ color: 'var(--ink3)' }}> · +{fmt(interest.cycle)} this cycle</span>}
            </span>
            <button className="btn-soft" onClick={() => app.openSheet({ kind: 'qa', preset: { mode: 'income', source: 'Interest', acct: da.id } })} style={{ borderRadius: 10, height: 34, padding: '0 12px', whiteSpace: 'nowrap', fontSize: 13 }}>+ Log interest</button>
          </div>
        )}
        {isInv && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>This cycle</div><div style={{ fontWeight: 600, color: history[0].ch.color }}>{history[0].gain ? history[0].ch.text : 'No change'}</div></div>
            <div><div style={{ fontSize: 12, color: 'var(--ink3)' }}>All-time growth</div><div style={{ fontWeight: 600, color: changeLabel(allGain, 0, fmt).color }}>{(allGain > 0 ? '+' : '') + fmt(allGain)}</div></div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <span style={{ fontSize: 13, color: 'var(--ink3)' }}>Last {isInv ? 'updated' : 'reconciled'} {lr === 0 ? 'today' : lr === 1 ? 'yesterday' : lr + ' days ago'}</span>
          <button className="btn-ink" onClick={() => app.openSheet({ kind: 'recon', acct: da.id })} style={{ borderRadius: 12, height: 42, padding: '0 18px' }}>{isInv ? 'Update value' : 'Reconcile'}</button>
        </div>
      </div>
      {isInv && (
        <>
          <div style={{ fontWeight: 600, padding: '0 4px' }}>Growth by month</div>
          <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
            {history.map((h, i) => (
              <div key={h.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderTop: divider(i), fontSize: 14 }}>
                <span style={{ color: 'var(--ink2)' }}>{h.label}</span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 600 }}>{fmt(h.value)}</span>
                  <span style={{ display: 'block', fontSize: 12, color: h.ch.color }}>{h.gain ? h.ch.text : 'No change'}</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ fontWeight: 600, padding: '0 4px' }}>Transactions</div>
      <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
        {items.map((t, i) => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: divider(i) }}>
            <TxnIcon v={t} size={36} radius={11} font={14} showAuto={false} />
            <div style={{ flex: 1, minWidth: 0 }}><div className="ellipsis" style={{ fontWeight: 500 }}>{t.title}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{t.dateStr}</div></div>
            <div style={{ fontWeight: 600, color: t.amtColor, whiteSpace: 'nowrap' }}>{t.amtStr}</div>
          </div>
        ))}
        {!items.length && <div style={{ padding: '22px 16px', color: 'var(--ink2)', fontSize: 14 }}>No transactions on this account yet.</div>}
      </div>
    </div>
  );
}
