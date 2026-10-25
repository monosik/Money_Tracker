import type { CSSProperties } from 'react';
import { nice } from '../lib/dates';
import { fmt } from '../lib/format';
import { roleColor } from './ui';
import { acctOf, catBg, catFg, catOf, type Data, type Txn } from '../lib/model';

export interface TxnView {
  id: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  iconBorder: string;
  title: string;
  sub: string;
  amtStr: string;
  amtColor: string;
  /** Tag shown when an expense was paid from savings or investments. */
  tag: { label: string; c: string; soft: string } | null;
  auto: boolean;
  dateStr: string;
}

/** First visible character, so emoji category names like "🍜 Food" give "🍜" rather than half a character. */
const firstGlyph = (s: string) => {
  const Seg = (Intl as unknown as { Segmenter?: new () => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) for (const g of new Seg().segment(s.trim())) return g.segment;
  return Array.from(s.trim())[0] || '?';
};

/** How a transaction looks: expense (−), income (+), transfer (⇄), untracked (dashed ?). */
export function deco(d: Data, t: Txn, viewAcct?: string): TxnView {
  const a = acctOf(d, t.acct);
  const r = { id: t.id, auto: !!t.auto, iconBorder: 'none', tag: null, dateStr: nice(t.date) };
  if (t.type === 'expense') {
    const c = catOf(d, t.cat);
    return { ...r, icon: firstGlyph(c.name), iconBg: catBg(c.id), iconFg: catFg(c.id), title: t.note || c.name, sub: c.name + ' · ' + a.name, amtStr: '−' + fmt(t.amount), amtColor: 'var(--expense)', tag: a.role === 'Salary' ? null : { label: a.role, ...roleColor(a.role) } };
  }
  if (t.type === 'income' && t.source === 'Interest')
    return { ...r, icon: '%', iconBg: 'var(--income-soft)', iconFg: 'var(--income)', title: t.note || 'Interest', sub: 'Interest · ' + a.name, amtStr: '+' + fmt(t.amount), amtColor: 'var(--income)' };
  if (t.type === 'revalue')
    return { ...r, icon: t.amount < 0 ? '↘' : '↗', iconBg: 'var(--invest-soft)', iconFg: 'var(--invest)', title: t.note || 'Value update', sub: 'Market change · ' + a.name, amtStr: (t.amount < 0 ? '' : '+') + fmt(t.amount), amtColor: t.amount < 0 ? 'var(--expense)' : 'var(--income)' };
  if (t.type === 'income')
    return { ...r, icon: '+', iconBg: 'var(--income-soft)', iconFg: 'var(--income)', title: t.note || t.source || 'Income', sub: (t.source || 'Income') + ' · ' + a.name, amtStr: '+' + fmt(t.amount), amtColor: 'var(--income)' };
  if (t.type === 'transfer') {
    const incoming = viewAcct != null && t.to === viewAcct;
    return { ...r, icon: '⇄', iconBg: 'var(--surface2)', iconFg: 'var(--ink2)', title: t.note || 'Transfer', sub: a.name + ' → ' + acctOf(d, t.to).name, amtStr: (incoming ? '+' : '') + fmt(t.amount), amtColor: incoming ? 'var(--income)' : 'var(--ink2)' };
  }
  return { ...r, icon: '?', iconBg: 'transparent', iconFg: 'var(--ink2)', iconBorder: '1.5px dashed var(--ink3)', title: 'Untracked', sub: 'Reconciled · ' + a.name, amtStr: (t.amount < 0 ? '' : '+') + fmt(t.amount), amtColor: 'var(--ink2)' };
}

export function TxnIcon({ v, size = 38, radius = 12, font = 15, showAuto = true }: { v: TxnView; size?: number; radius?: number; font?: number; showAuto?: boolean }) {
  const st: CSSProperties = { width: size, height: size, borderRadius: radius, fontSize: font, background: v.iconBg, color: v.iconFg, border: v.iconBorder };
  return (
    <span className="ticon" style={st}>
      {v.icon}
      {showAuto && v.auto && <span className="auto" title="Auto-logged">↻</span>}
    </span>
  );
}

/** Row used on Home and in the Transactions list. */
export function TxnBody({ v }: { v: TxnView }) {
  return (
    <>
      <TxnIcon v={v} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ellipsis" style={{ fontWeight: 500 }}>{v.title}</div>
        <div style={{ fontSize: 13, color: 'var(--ink3)', display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
          <span className="ellipsis">{v.sub}</span>
          {v.tag && <span className="sav-tag" style={{ color: v.tag.c, background: v.tag.soft }}>{v.tag.label}</span>}
        </div>
      </div>
      <div style={{ fontWeight: 600, color: v.amtColor, whiteSpace: 'nowrap' }}>{v.amtStr}</div>
    </>
  );
}
