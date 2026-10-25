import { useApp } from '../ctx';
import { dayDiff, nice } from '../lib/dates';
import { fmt } from '../lib/format';
import { acctOf } from '../lib/model';
import { divider } from '../components/ui';
import { deco } from '../components/txn';

export function Recurring() {
  const app = useApp();
  const { data, d, today } = app;
  const toggle = (id: string) =>
    app.commit((x) => ({ ...x, recurring: x.recurring.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)) }));
  const autoLogged = d.cycTx.filter((t) => t.auto).sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq);

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <div className="title">Recurring</div>
        <button className="btn-line" onClick={() => app.openSheet({ kind: 'rule', rule: null })} style={{ borderRadius: 10, height: 36, padding: '0 14px' }}>+ New rule</button>
      </div>
      <div className="card" style={{ borderRadius: 20, overflow: 'hidden' }}>
        {data.recurring.map((r, i) => {
          const acct = acctOf(data, r.acct).name;
          const meta = r.paused ? 'Paused · ' + acct : `Day ${r.day} · next ${nice(r.nextDue)} (in ${dayDiff(today, r.nextDue)}d) · ${acct}`;
          const edit = () => app.openSheet({ kind: 'rule', rule: r });
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderTop: divider(i), opacity: r.paused ? 0.55 : 1 }}>
              <div role="button" tabIndex={0} onClick={edit} onKeyDown={(e) => e.key === 'Enter' && edit()} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{r.name}</span>
                  <span style={{ fontWeight: 600, color: r.type === 'income' ? 'var(--income)' : 'var(--ink)' }}>{(r.type === 'income' ? '+' : '−') + fmt(r.amount)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink3)', marginTop: 2 }}>{meta}</div>
              </div>
              <button role="switch" aria-checked={!r.paused} aria-label={(r.paused ? 'Resume ' : 'Pause ') + r.name} onClick={() => toggle(r.id)} style={{ flex: 'none', width: 46, height: 28, borderRadius: 14, border: 0, background: r.paused ? 'var(--line)' : 'var(--income)', position: 'relative', cursor: 'pointer', padding: 0 }}>
                <span style={{ position: 'absolute', top: 3, left: r.paused ? 3 : 21, width: 22, height: 22, borderRadius: '50%', background: 'var(--surface)', boxShadow: '0 1px 2px oklch(0 0 0 / .25)', display: 'block', transition: 'left .2s' }} />
              </button>
            </div>
          );
        })}
        {!data.recurring.length && (
          <div style={{ padding: '22px 16px', color: 'var(--ink2)', fontSize: 14, lineHeight: 1.45 }}>
            No recurring rules. Add bills and subscriptions so they log themselves and count against this month's available money.
          </div>
        )}
      </div>
      <div style={{ fontWeight: 600, padding: '4px 4px 0' }}>Auto-logged this cycle</div>
      <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
        {autoLogged.map((t, i) => {
          const v = deco(data, t);
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: divider(i) }}>
              <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, background: 'var(--surface2)', color: 'var(--ink2)' }}>↻</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{v.title}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{v.dateStr} · {acctOf(data, t.acct).name}</div></div>
              <div style={{ fontWeight: 600, color: v.amtColor }}>{v.amtStr}</div>
            </div>
          );
        })}
        {!autoLogged.length && <div style={{ padding: '18px 16px', color: 'var(--ink2)', fontSize: 14 }}>Nothing auto-logged yet this cycle.</div>}
      </div>
    </div>
  );
}
