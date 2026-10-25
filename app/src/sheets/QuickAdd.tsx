import { useState } from 'react';
import { useApp } from '../ctx';
import { addDays, nice } from '../lib/dates';
import { fmt, short } from '../lib/format';
import { acctOf, catChart, catOf, type IncomeSource, type Txn, type TxnType } from '../lib/model';
import { chip, chipStyle, roleColor, Seg } from '../components/ui';

type Mode = Exclude<TxnType, 'adjust'>;

export function QuickAdd({ edit, preset }: { edit?: Txn; preset?: { mode: 'income'; source: IncomeSource; acct: string } }) {
  const app = useApp();
  const { data, d, today } = app;
  const [q, setQ] = useState(() => {
    if (edit)
      return { mode: edit.type as Mode, digits: String(edit.amount), cat: edit.cat || null, acct: edit.acct, to: edit.to || data.settings.defSav || '', source: (edit.source || 'Salary') as IncomeSource, date: edit.date, note: edit.note || '' };
    const last = data.settings.lastAcct;
    const def = (last && data.accounts.some((a) => a.id === last) ? last : (data.accounts.find((a) => a.role === 'Salary') || data.accounts[0])?.id) || '';
    const to = (data.settings.defSav && data.settings.defSav !== def ? data.settings.defSav : data.accounts.find((a) => a.id !== def)?.id) || '';
    if (preset) return { mode: preset.mode as Mode, digits: '', cat: null as string | null, acct: preset.acct, to, source: preset.source, date: today, note: '' };
    return { mode: 'expense' as Mode, digits: '', cat: null as string | null, acct: def, to, source: 'Salary' as IncomeSource, date: today, note: '' };
  });
  const set = (p: Partial<typeof q>) => setQ({ ...q, ...p });

  const amt = Number(q.digits) || 0;
  const a = acctOf(data, q.acct);
  const ab = d.bal(q.acct);
  const valid = !!amt && (q.mode !== 'expense' || !!q.cat) && (q.mode !== 'transfer' || (!!q.to && q.to !== q.acct));

  const usage: Record<string, number> = {};
  data.txns.forEach((t) => { if (t.cat) usage[t.cat] = (usage[t.cat] || 0) + 1; });
  const cats = d.activeCats.slice().sort((x, y) => (usage[y.id] || 0) - (usage[x.id] || 0));
  // Keep an archived category visible when editing a transaction that uses it.
  if (q.cat && !cats.some((c) => c.id === q.cat)) cats.unshift(catOf(data, q.cat));

  const save = () => {
    if (!valid) return;
    const note = q.note.trim() || (q.mode === 'expense' ? catOf(data, q.cat!).name : q.mode === 'income' ? q.source : 'Transfer');
    const t: Omit<Txn, 'id' | 'seq'> = { type: q.mode, amount: amt, acct: q.acct, date: q.date, note };
    if (q.mode === 'expense') t.cat = q.cat!;
    if (q.mode === 'income') t.source = q.source;
    if (q.mode === 'transfer') t.to = q.to;
    const lastAcct = { lastAcct: q.acct };
    if (edit) {
      app.commit(
        (x) => ({ ...x, settings: { ...x.settings, ...lastAcct }, txns: x.txns.map((y) => (y.id === edit.id ? { ...t, id: y.id, seq: y.seq, auto: y.auto, ruleId: y.ruleId } : y)) }),
        'Changes saved',
      );
    } else {
      app.commit(
        (x) => ({ ...x, settings: { ...x.settings, ...lastAcct }, seq: x.seq + 1, txns: x.txns.concat([{ ...t, id: 'n' + x.seq, seq: x.seq }]) }),
        (q.mode === 'expense' ? 'Expense' : q.mode === 'income' ? 'Income' : 'Transfer') + ' saved · ' + fmt(amt),
      );
    }
    app.closeSheet();
  };

  const acctChips = (sel: string, pick: (id: string) => void, disabled?: string) => (
    <div className="hscroll" style={{ gap: 6, margin: '0 -18px', padding: '0 18px' }}>
      {data.accounts.map((x) => {
        const on = x.id === sel;
        const rc = roleColor(x.role);
        const dis = disabled === x.id;
        return (
          <button key={x.id} aria-pressed={on} disabled={dis} onClick={() => pick(x.id)} style={{ flex: 'none', border: `1.5px solid ${on ? rc.c : 'var(--line)'}`, background: on ? rc.soft : 'var(--surface)', color: 'var(--ink)', borderRadius: 12, padding: '7px 12px', textAlign: 'left', cursor: dis ? 'default' : 'pointer', opacity: dis ? 0.35 : 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>{x.name}</div>
            <div style={{ fontSize: 11, color: rc.c, fontWeight: 600, whiteSpace: 'nowrap' }}>{x.role} · {short(Math.max(0, d.bal(x.id)))}</div>
          </button>
        );
      })}
    </div>
  );

  const yd = addDays(today, -1);
  const y2 = addDays(today, -2);
  const dates: [string, string][] = [['Today', today], ['Yesterday', yd], [nice(y2), y2]];
  if (!dates.some(([, dt]) => dt === q.date)) dates.push([nice(q.date), q.date]);

  const pressKey = (k: string) => {
    let dg = q.digits;
    if (k === '⌫') dg = dg.slice(0, -1);
    else dg = (dg + k).replace(/^0+/, '').slice(0, 12);
    set({ digits: dg });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Seg font={14} value={q.mode} onChange={(m) => set({ mode: m })} opts={[{ label: 'Expense', value: 'expense' }, { label: 'Income', value: 'income' }, { label: 'Transfer', value: 'transfer' }]} />
      <div aria-live="polite" style={{ textAlign: 'center', fontSize: 42, fontWeight: 700, letterSpacing: '-.03em', color: amt ? 'var(--ink)' : 'var(--ink3)', padding: '2px 0' }}>{fmt(amt)}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {([['+10rb', 10000], ['+50rb', 50000], ['+100rb', 100000]] as const).map(([label, n]) => (
          <button key={label} className="btn-soft" onClick={() => set({ digits: String(amt + n) })} style={{ borderRadius: 999, padding: '7px 14px', fontSize: 14 }}>{label}</button>
        ))}
      </div>
      {q.mode === 'expense' && (
        <div className="hscroll" style={{ gap: 6, margin: '0 -18px', padding: '0 18px' }}>
          {cats.map((c) => (
            <button key={c.id} aria-pressed={c.id === q.cat} onClick={() => set({ cat: c.id })} style={chipStyle(c.id === q.cat, { flex: 'none', borderRadius: 999, padding: '9px 14px', fontSize: 14, display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' })}>
              <span className="dot" style={{ width: 8, height: 8, background: catChart(c.id) }} />
              {c.name}
            </button>
          ))}
        </div>
      )}
      {q.mode === 'income' && (
        <div style={{ display: 'flex', gap: 6 }}>
          {(['Salary', 'Bonus', 'Interest', 'Other'] as const).map((s) => (
            <button key={s} onClick={() => set({ source: s })} style={chipStyle(q.source === s, { flex: 1, borderRadius: 999, padding: '9px 0', fontSize: 14 })}>{s}</button>
          ))}
        </div>
      )}
      <div>
        <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 6 }}>{q.mode === 'transfer' ? 'From' : q.mode === 'income' ? 'Into account' : 'Paid from'}</div>
        {acctChips(q.acct, (id) => set({ acct: id, to: id === q.to ? data.accounts.find((x) => x.id !== id)?.id || '' : q.to }))}
      </div>
      {q.mode === 'transfer' && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink3)', marginBottom: 6 }}>To</div>
          {acctChips(q.to, (id) => set({ to: id }), q.acct)}
        </div>
      )}
      {q.mode === 'expense' && a.role !== 'Salary' && amt > 0 && (
        <div style={{ background: roleColor(a.role).soft, borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.4, display: 'flex', gap: 10 }}>
          <span className="dot" style={{ width: 8, height: 8, background: roleColor(a.role).c, marginTop: 5 }} />
          <span>This will reduce your {a.role === 'Investment' ? 'investments' : 'savings'}: <b>{a.name} {fmt(ab)} → {fmt(ab - amt)}</b></span>
        </div>
      )}
      {q.mode !== 'income' && amt > 0 && amt > ab && (
        <div style={{ background: 'var(--warn-soft)', borderRadius: 12, padding: '10px 12px', fontSize: 13, lineHeight: 1.4, display: 'flex', gap: 10 }}>
          <span className="dot" style={{ width: 8, height: 8, background: 'var(--warn)', marginTop: 5 }} />
          <span>This is more than your {a.name} balance ({fmt(ab)}). You can still save it.</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {dates.map(([label, dt]) => {
          const c = chip(q.date === dt);
          return <button key={dt} onClick={() => set({ date: dt })} style={{ flex: 'none', border: `1px solid ${c.border}`, background: c.bg, color: c.fg, borderRadius: 10, padding: '8px 10px', fontSize: 13, cursor: 'pointer' }}>{label}</button>;
        })}
        <input value={q.note} onChange={(e) => set({ note: e.target.value })} placeholder="Note (optional)" aria-label="Note" style={{ flex: 1, minWidth: 0, border: '1px solid var(--line)', background: 'var(--bg)', borderRadius: 10, padding: '8px 10px', fontSize: 13, outline: 'none' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'].map((k) => (
          <button key={k} aria-label={k === '⌫' ? 'Delete digit' : k} onClick={() => pressKey(k)} style={{ height: 50, border: 0, borderRadius: 14, background: 'var(--surface2)', fontSize: 22, fontWeight: 500, cursor: 'pointer' }}>{k}</button>
        ))}
      </div>
      <button className="btn-ink" onClick={save} aria-disabled={!valid} style={{ height: 56, borderRadius: 18, fontWeight: 700, fontSize: 17, opacity: valid ? 1 : 0.4 }}>
        {edit ? 'Save changes' : q.mode === 'expense' ? (q.cat ? 'Save expense' : 'Pick a category') : q.mode === 'income' ? 'Save income' : 'Save transfer'}
      </button>
    </div>
  );
}
