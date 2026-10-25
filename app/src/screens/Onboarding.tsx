import { useState } from 'react';
import { useApp } from '../ctx';
import { cycleFor, firstDueAfter } from '../lib/dates';
import { dig, fmt, initials, onlyDigits, uid } from '../lib/format';
import { emptyData, type AcctType, type Data, type Role } from '../lib/model';
import { requestNotif } from '../lib/notify';
import { chipStyle, roleColor, roleStyle } from '../components/ui';
import { REMINDER_TIMES } from './Settings';

interface ObAcct {
  id: string;
  name: string;
  type: AcctType;
  role: Role;
  bal: number;
}

export function AccountForm({ onAdd, defaultRole, withTarget }: { onAdd: (a: ObAcct & { target: number | null }) => void; defaultRole: Role; withTarget?: boolean }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<AcctType>('Bank');
  const [role, setRole] = useState<Role>(defaultRole);
  const [bal, setBal] = useState('');
  const [target, setTarget] = useState('');
  const add = () => {
    const n = name.trim();
    if (!n) return;
    onAdd({ id: uid('a'), name: n, type, role, bal: Number(bal) || 0, target: role === 'Savings' && Number(target) ? Number(target) : null });
    setName('');
    setBal('');
    setTarget('');
    setRole('Savings');
  };
  return (
    <div className="card" style={{ borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input className="text-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Account name, e.g. BCA Salary" aria-label="Account name" style={{ fontSize: 15 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {(['Bank', 'E-wallet', 'Cash'] as const).map((x) => (
          <button key={x} onClick={() => setType(x)} style={chipStyle(type === x, { flex: 1, borderRadius: 10, padding: '9px 0', fontSize: 14 })}>{x}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {(['Salary', 'Savings', 'Investment'] as const).map((x) => {
          const c = roleStyle(role === x, x);
          return (
            <button key={x} onClick={() => setRole(x)} style={{ flex: 1, border: `1px solid ${c.border}`, background: c.bg, color: c.fg, borderRadius: 10, padding: '9px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{x}</button>
          );
        })}
      </div>
      <div className="money-field" style={{ background: 'var(--bg)' }}>
        <span>Rp</span>
        <input value={dig(bal)} onChange={(e) => setBal(onlyDigits(e.target.value, 13))} inputMode="numeric" placeholder="Starting balance" aria-label="Starting balance" style={{ padding: '12px 6px', fontSize: 15 }} />
      </div>
      {withTarget && role === 'Savings' && (
        <div className="money-field" style={{ background: 'var(--bg)' }}>
          <span>Target Rp</span>
          <input value={dig(target)} onChange={(e) => setTarget(onlyDigits(e.target.value))} inputMode="numeric" placeholder="Optional" aria-label="Savings target" style={{ padding: '12px 6px', fontSize: 15 }} />
        </div>
      )}
      <button onClick={add} style={{ border: '1px dashed var(--ink3)', background: 'none', borderRadius: 12, padding: 11, fontWeight: 600, cursor: 'pointer' }}>+ Add account</button>
    </div>
  );
}

export function Onboarding() {
  const app = useApp();
  const { today } = app;
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<ObAcct[]>([]);
  const [payday, setPayday] = useState(25);
  const [salary, setSalary] = useState('');
  const [defSav, setDefSav] = useState<string | null>(null);
  const [reminder, setReminder] = useState('21:00');

  const hasSal = accounts.some((a) => a.role === 'Salary');
  const sav = accounts.filter((a) => a.role === 'Savings');
  const canNext = step !== 2 || hasSal;

  const finish = (rem: string | null) => {
    const base = emptyData();
    const sal = accounts.find((a) => a.role === 'Salary')!;
    const pay = Number(salary) || 0;
    const next: Data = {
      ...base,
      onboarded: true,
      accounts: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type, role: a.role, start: a.bal, target: null, lastRec: today })),
      // The monthly salary becomes a recurring income rule on payday.
      recurring: pay ? [{ id: uid('r'), name: 'Salary', type: 'income', amount: pay, acct: sal.id, cat: null, day: payday, paused: false, nextDue: firstDueAfter(today, payday) }] : [],
      settings: { ...base.settings, payday, salary: pay, defSav: defSav || sav[0]?.id || null, reminder: rem, lastCycleStart: cycleFor(today, payday).s },
    };
    app.commit(() => next);
    app.go('home');
    app.toast('All set. Log your first expense with +');
    if (rem) void requestNotif();
  };
  const next = () => {
    if (!canNext) return;
    if (step === 4) return finish(reminder);
    if (step === 2 && !defSav) setDefSav(sav[0]?.id || null);
    setStep(step + 1);
  };

  const h1 = { fontSize: 28, lineHeight: 1.15, margin: 0, fontWeight: 700, letterSpacing: '-.02em' } as const;
  const lead = { margin: 0, color: 'var(--ink2)', fontSize: 15, lineHeight: 1.45 } as const;

  return (
    <div style={{ minHeight: 'calc(100dvh - env(safe-area-inset-top) - 20px)', display: 'flex', flexDirection: 'column', padding: '12px 24px calc(28px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
        {[1, 2, 3, 4].map((i) => <span key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i <= step ? 'var(--ink)' : 'var(--line)', display: 'block' }} />)}
      </div>
      <div className="eyebrow" style={{ color: 'var(--ink3)', marginBottom: 10 }}>Step {step} of 4</div>

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.1, margin: 0, fontWeight: 700, letterSpacing: '-.02em', textWrap: 'pretty' } as React.CSSProperties}>Track your salary and your savings, separately.</h1>
          <p style={{ margin: 0, color: 'var(--ink2)', fontSize: 16, lineHeight: 1.5 }}>See what's left of this month's pay, and know exactly how much savings you have after spending from it.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <div className="card" style={{ borderRadius: 18, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Your data stays on this device</div>
              <div style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.45 }}>No login, no cloud. Everything is stored in this browser only.</div>
            </div>
            <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--line)', borderRadius: 18, padding: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Back up regularly</div>
              <div style={{ color: 'var(--ink2)', fontSize: 14, lineHeight: 1.45 }}>If you clear browser data, anything without a backup is gone. Export a backup file from Settings at least once a month.</div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          <h1 style={h1}>Add your accounts</h1>
          <p style={lead}>Banks, e-wallets, cash or investment apps. Mark one as Salary — that's where your pay lands.</p>
          {accounts.map((a) => {
            const rc = roleColor(a.role);
            return (
              <div key={a.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 14, padding: '12px 14px' }}>
                <span style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flex: 'none', background: rc.soft, color: rc.c }}>{initials(a.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{a.name}</div><div style={{ fontSize: 13, color: 'var(--ink3)' }}>{a.type} · {a.role}</div></div>
                <div style={{ fontWeight: 600 }}>{fmt(a.bal)}</div>
                <button aria-label={'Remove ' + a.name} onClick={() => setAccounts(accounts.filter((x) => x.id !== a.id))} style={{ border: 0, background: 'none', color: 'var(--ink3)', cursor: 'pointer', fontSize: 18, padding: '4px 6px' }}>×</button>
              </div>
            );
          })}
          <AccountForm key={hasSal ? 'more' : 'first'} defaultRole={hasSal ? 'Savings' : 'Salary'} onAdd={(a) => setAccounts(accounts.concat([a]))} />
          {!hasSal && <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Add at least one Salary account to continue.</div>}
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <h1 style={h1}>Your pay cycle</h1>
          <p style={lead}>Months run payday to payday. Leftover salary is swept to savings at the end of each cycle.</p>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Payday</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {Array.from({ length: 28 }, (_, i) => (
              <button key={i} onClick={() => setPayday(i + 1)} style={chipStyle(payday === i + 1, { height: 38, borderRadius: 10, fontSize: 14 })}>{i + 1}</button>
            ))}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Monthly salary</div>
          <div className="money-field" style={{ background: 'var(--surface)' }}>
            <span>Rp</span>
            <input value={dig(salary)} onChange={(e) => setSalary(onlyDigits(e.target.value))} inputMode="numeric" placeholder="9.000.000" aria-label="Monthly salary" style={{ padding: '13px 6px', fontSize: 16 }} />
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Sweep leftover salary to</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sav.map((a) => (
              <button key={a.id} onClick={() => setDefSav(a.id)} style={chipStyle(defSav === a.id, { borderRadius: 999, padding: '9px 14px', fontSize: 14 })}>{a.name}</button>
            ))}
          </div>
          {!sav.length && <div style={{ fontSize: 13, color: 'var(--ink2)' }}>Add a Savings account in the previous step to turn on the month-end sweep.</div>}
        </div>
      )}

      {step === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <h1 style={h1}>Daily reminder</h1>
          <p style={lead}>A nudge each evening to log anything you forgot. Works best when the app is installed to your home screen.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {REMINDER_TIMES.map((t) => (
              <button key={t} onClick={() => setReminder(t)} style={chipStyle(reminder === t, { height: 48, borderRadius: 12, fontSize: 16 })}>{t}</button>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        {step > 1 && <button className="btn-line" onClick={() => setStep(step - 1)} style={{ height: 54, padding: '0 20px', borderRadius: 16 }}>Back</button>}
        {step === 4 && <button className="btn-line" onClick={() => finish(null)} style={{ height: 54, padding: '0 20px', borderRadius: 16 }}>Skip</button>}
        <button className="btn-ink" onClick={next} aria-disabled={!canNext} style={{ flex: 1, height: 54, borderRadius: 16, fontSize: 16, opacity: canNext ? 1 : 0.4 }}>
          {step === 1 ? 'Get started' : step === 4 ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
