import { useRef, useState, type ReactNode } from 'react';
import { useApp } from '../ctx';
import { backupJson, download, parseBackup, transactionsCsv } from '../lib/backup';
import { cycleFor, dayDiff } from '../lib/dates';
import { fmt, uid } from '../lib/format';
import { catChart, type Settings as S, type ThemePref } from '../lib/model';
import { notifState, requestNotif, type NotifState } from '../lib/notify';
import { divider, SectionLabel } from '../components/ui';

export const REMINDER_TIMES = ['19:00', '20:00', '21:00', '21:30', '22:00', '23:00'];

function Row({ label, first, children }: { label: string; first?: boolean; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', borderTop: first ? 'none' : '1px solid var(--line)' }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function lastBackupInfo(lastBackup: string | null, today: string, hasTxns: boolean) {
  const lb = lastBackup ? dayDiff(lastBackup, today) : null;
  return {
    text: lb === null ? 'never' : lb === 0 ? 'today' : lb === 1 ? 'yesterday' : lb + ' days ago',
    stale: lb === null ? hasTxns : lb > 30,
    color: lb === null || lb > 30 ? 'var(--expense)' : 'var(--ink)',
  };
}

export function Settings() {
  const app = useApp();
  const { data, d, today } = app;
  const st = data.settings;
  const [notif, setNotif] = useState<NotifState>(notifState());
  const [newCat, setNewCat] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const setS = (p: Partial<S>) => app.commit((x) => ({ ...x, settings: { ...x.settings, ...p } }));
  const lb = lastBackupInfo(st.lastBackup, today, data.txns.length > 0);

  const exportJSON = () => {
    download('money-tracker-backup-' + today + '.json', backupJson(data, today), 'application/json');
    setS({ lastBackup: today });
    app.toast('Backup exported');
  };
  const exportCSV = () => {
    download('money-tracker-' + today + '.csv', transactionsCsv(data), 'text/csv');
    app.toast('CSV exported');
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const next = parseBackup(String(rd.result));
        setImportError(null);
        app.commit(() => next, 'Backup imported · ' + next.txns.length + ' transactions');
      } catch {
        setImportError(`"${f.name}" isn't a valid Money Tracker backup file.`);
      }
    };
    rd.onerror = () => setImportError('The file could not be read.');
    rd.readAsText(f);
  };
  const askNotif = async () => {
    const s = await requestNotif();
    setNotif(s);
    if (s === 'granted') app.toast('Notifications allowed');
  };
  const addCat = () => {
    const n = newCat.trim();
    if (!n) return;
    app.commit((x) => ({ ...x, cats: x.cats.concat([{ id: uid('c'), name: n, budget: null, archived: false }]) }));
    setNewCat('');
  };

  return (
    <div className="screen">
      <div className="title" style={{ padding: '0 4px' }}>Settings</div>
      {lb.stale && (
        <div style={{ background: 'var(--warn-soft)', border: '1px solid var(--line)', borderRadius: 18, padding: '14px 16px', fontSize: 14, lineHeight: 1.45 }}>
          <b>Last backup: {lb.text}.</b> {st.lastBackup ? "It's been over 30 days." : ''} Export a backup so you don't lose your data.
        </div>
      )}

      <SectionLabel>Cycle</SectionLabel>
      <div className="card" style={{ borderRadius: 18 }}>
        <Row label="Payday" first>
          <select className="select" value={String(st.payday)} onChange={(e) => { const p = Number(e.target.value); setS({ payday: p, lastCycleStart: cycleFor(today, p).s }); }}>
            {Array.from({ length: 28 }, (_, i) => <option key={i} value={i + 1}>Day {i + 1}</option>)}
          </select>
        </Row>
        <Row label="Sweep leftover to">
          <select className="select" value={st.defSav || ''} onChange={(e) => setS({ defSav: e.target.value || null })} style={{ maxWidth: 170 }}>
            {d.savA.length ? d.savA.map((a) => <option key={a.id} value={a.id}>{a.name}</option>) : <option value="">No savings account</option>}
          </select>
        </Row>
        <Row label="Daily reminder">
          <select className="select" value={st.reminder || 'off'} onChange={(e) => setS({ reminder: e.target.value === 'off' ? null : e.target.value })}>
            <option value="off">Off</option>
            {REMINDER_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Row>
        {notif === 'granted' ? (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--income)' }}>
            Notifications on · {st.reminder ? 'reminder at ' + st.reminder : 'reminder off'}
          </div>
        ) : (
          <div style={{ padding: '12px 16px 14px', borderTop: '1px solid var(--line)', fontSize: 13, color: 'var(--ink2)', lineHeight: 1.45 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{notif === 'default' ? 'Notifications are off' : 'Notifications are blocked'}</div>
            {notif === 'default'
              ? 'Allow notifications to get the daily reminder on your lock screen. Until then, reminders appear as a banner inside the app.'
              : notif === 'unsupported'
                ? "This browser can't show notifications. Reminders will appear as a banner inside the app instead. Install the app to your home screen to get them on your lock screen."
                : 'Reminders will appear as a banner inside the app instead. To get them on your lock screen, allow notifications for this site in your browser settings, and install the app to your home screen.'}
            <div>
              <button className="btn-soft" onClick={notif === 'default' ? askNotif : () => setNotif(notifState())} style={{ marginTop: 10, borderRadius: 10, height: 36, padding: '0 12px' }}>
                {notif === 'default' ? 'Allow notifications' : 'Check again'}
              </button>
            </div>
          </div>
        )}
      </div>

      <SectionLabel>Appearance</SectionLabel>
      <div className="card" style={{ borderRadius: 18 }}>
        <Row label="Theme" first>
          <select className="select" value={st.theme} onChange={(e) => setS({ theme: e.target.value as ThemePref })}>
            <option value="system">Match device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Row>
      </div>

      <SectionLabel>Categories</SectionLabel>
      <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
        {data.cats.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px 6px 16px', borderTop: divider(i), opacity: c.archived ? 0.5 : 1 }}>
            <span className="dot" style={{ width: 10, height: 10, background: catChart(c.id) }} />
            <input value={c.name} aria-label="Category name" onChange={(e) => { const name = e.target.value; app.commit((x) => ({ ...x, cats: x.cats.map((y) => (y.id === c.id ? { ...y, name } : y)) })); }} style={{ flex: 1, minWidth: 0, border: 0, background: 'none', padding: '8px 0', outline: 'none' }} />
            <button className="link" onClick={() => app.commit((x) => ({ ...x, cats: x.cats.map((y) => (y.id === c.id ? { ...y, archived: !y.archived } : y)) }))} style={{ fontSize: 13, padding: 8 }}>
              {c.archived ? 'Restore' : 'Archive'}
            </button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, padding: '10px 10px 10px 16px', borderTop: '1px solid var(--line)' }}>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCat()} placeholder="New category" aria-label="New category" style={{ flex: 1, minWidth: 0, border: 0, background: 'none', outline: 'none' }} />
          <button className="btn-soft" onClick={addCat} style={{ borderRadius: 10, height: 34, padding: '0 12px' }}>Add</button>
        </div>
      </div>

      <SectionLabel>Data · stored on this device</SectionLabel>
      <div className="card" style={{ borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 14, color: 'var(--ink2)' }}>Last backup: <b style={{ color: lb.color }}>{lb.text}</b></div>
        <button className="btn-ink" onClick={exportJSON} style={{ height: 48, borderRadius: 14 }}>Export backup (JSON)</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="btn-line" onClick={exportCSV} style={{ height: 46, borderRadius: 14 }}>Export CSV</button>
          <button className="btn-line" onClick={() => { setImportError(null); fileRef.current?.click(); }} style={{ height: 46, borderRadius: 14 }}>Import backup</button>
        </div>
        <input type="file" accept=".json,application/json" ref={fileRef} onChange={onFile} style={{ display: 'none' }} />
        {importError && (
          <div role="alert" style={{ background: 'var(--expense-soft)', borderRadius: 12, padding: '12px 14px', fontSize: 13, lineHeight: 1.45 }}>
            <b>Import failed.</b> {importError} Nothing was changed.
          </div>
        )}
        <button onClick={() => app.openSheet({ kind: 'reset' })} style={{ height: 46, borderRadius: 14, border: '1px solid var(--line)', background: 'none', color: 'var(--expense)', fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
          Reset all data
        </button>
      </div>

      {data.sweeps.length > 0 && (
        <>
          <SectionLabel>Sweep history</SectionLabel>
          <div className="card" style={{ borderRadius: 18, overflow: 'hidden' }}>
            {data.sweeps.slice().reverse().map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: divider(i), fontSize: 14 }}>
                <span>{s.cycle} · <span style={{ color: 'var(--ink3)' }}>{s.status}</span></span>
                <span style={{ fontWeight: 600 }}>{fmt(s.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
