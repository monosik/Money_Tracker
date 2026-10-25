import { acctOf, catOf, type Data } from './model';
import { normalize } from './store';

export function download(name: string, text: string, type: string) {
  const b = new Blob([text], { type });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

export function backupJson(d: Data, today: string) {
  const { accounts, cats, txns, recurring, settings, pending, sweeps, seq } = d;
  return JSON.stringify(
    { app: 'money-tracker', version: 1, exportedAt: today, accounts, cats, txns, recurring, settings, pending, sweeps, seq },
    null,
    2,
  );
}

const cell = (x: unknown) => {
  const s = String(x);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};

export function transactionsCsv(d: Data) {
  const sorted = d.txns.slice().sort((a, b) => b.date.localeCompare(a.date) || b.seq - a.seq);
  const header: unknown[][] = [['date', 'type', 'amount', 'account', 'to_account', 'category', 'note']];
  const rows = header.concat(
    sorted.map((t) => [
      t.date,
      t.type === 'adjust' ? 'untracked' : t.type,
      t.type === 'expense' ? -t.amount : t.amount,
      acctOf(d, t.acct).name,
      t.to ? acctOf(d, t.to).name : '',
      t.cat ? catOf(d, t.cat).name : '',
      t.note || '',
    ]),
  );
  return rows.map((r) => r.map(cell).join(',')).join('\n');
}

const isDay = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Parses a backup file. Throws when it isn't a valid Money Tracker backup. */
export function parseBackup(text: string): Data {
  const d = JSON.parse(text);
  const ok =
    d &&
    Array.isArray(d.accounts) &&
    Array.isArray(d.txns) &&
    d.accounts.every((a: any) => a && a.id && a.name && typeof a.start === 'number') &&
    d.txns.every((t: any) => t && t.id && t.type && typeof t.amount === 'number' && t.acct && isDay(t.date));
  if (!ok) throw new Error('invalid');
  return normalize({ ...d, onboarded: true });
}
