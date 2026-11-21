import type { CSSProperties } from 'react';
import { nice } from '../lib/dates';
import { fmt } from '../lib/format';
import { acctOf, catBg, catFg, catOf, type Category, type Data, type Txn } from '../lib/model';
import { Icon, type IconName } from './Icon';
import { CatGlyph, catLabel, roleColor } from './ui';

export interface TxnView {
  id: string;
  /** A line icon, or the category (which may show its own emoji). */
  icon: IconName | Category;
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

/** How a transaction looks: expense (category), income, transfer, interest, value update, untracked (dashed ?). */
export function deco(d: Data, t: Txn, viewAcct?: string): TxnView {
  const a = acctOf(d, t.acct);
  const r = { id: t.id, auto: !!t.auto, iconBorder: 'none', tag: null, dateStr: nice(t.date) };
  if (t.type === 'expense') {
    const c = catOf(d, t.cat);
    return { ...r, icon: c, iconBg: catBg(c.id), iconFg: catFg(c.id), title: t.note || catLabel(c.name), sub: catLabel(c.name) + ' · ' + a.name, amtStr: '−' + fmt(t.amount), amtColor: 'var(--expense)', tag: a.role === 'Salary' ? null : { label: a.role, ...roleColor(a.role) } };
  }
  if (t.type === 'income' && t.source === 'Interest')
    return { ...r, icon: 'percent', iconBg: 'var(--income-soft)', iconFg: 'var(--income)', title: t.note || 'Interest', sub: 'Interest · ' + a.name, amtStr: '+' + fmt(t.amount), amtColor: 'var(--income)' };
  if (t.type === 'revalue')
    return { ...r, icon: t.amount < 0 ? 'trend-down' : 'trend-up', iconBg: 'var(--invest-soft)', iconFg: 'var(--invest)', title: t.note || 'Value update', sub: 'Market change · ' + a.name, amtStr: (t.amount < 0 ? '' : '+') + fmt(t.amount), amtColor: t.amount < 0 ? 'var(--expense)' : 'var(--income)' };
  if (t.type === 'income')
    return { ...r, icon: 'income', iconBg: 'var(--income-soft)', iconFg: 'var(--income)', title: t.note || t.source || 'Income', sub: (t.source || 'Income') + ' · ' + a.name, amtStr: '+' + fmt(t.amount), amtColor: 'var(--income)' };
  if (t.type === 'transfer') {
    const incoming = viewAcct != null && t.to === viewAcct;
    return { ...r, icon: 'transfer', iconBg: 'var(--surface2)', iconFg: 'var(--ink2)', title: t.note || 'Transfer', sub: a.name + ' → ' + acctOf(d, t.to).name, amtStr: (incoming ? '+' : '') + fmt(t.amount), amtColor: incoming ? 'var(--income)' : 'var(--ink2)' };
  }
  return { ...r, icon: 'help', iconBg: 'transparent', iconFg: 'var(--ink2)', iconBorder: '1.5px dashed var(--ink3)', title: 'Untracked', sub: 'Reconciled · ' + a.name, amtStr: (t.amount < 0 ? '' : '+') + fmt(t.amount), amtColor: 'var(--ink2)' };
}

export function TxnIcon({ v, size = 38, radius = 12, glyph = 20, showAuto = true }: { v: TxnView; size?: number; radius?: number; glyph?: number; showAuto?: boolean }) {
  const st: CSSProperties = { width: size, height: size, borderRadius: radius, background: v.iconBg, color: v.iconFg, border: v.iconBorder };
  return (
    <span className="ticon" style={st}>
      {typeof v.icon === 'string' ? <Icon name={v.icon} size={glyph} /> : <CatGlyph cat={v.icon} size={glyph} />}
      {showAuto && v.auto && (
        <span className="auto" title="Auto-logged">
          <Icon name="repeat" size={11} style={{ strokeWidth: 2.2 }} />
        </span>
      )}
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
