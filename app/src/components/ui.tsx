import type { CSSProperties, ReactNode } from 'react';
import type { AcctType, Category, Role } from '../lib/model';
import { Icon, type IconName } from './Icon';

export const SEL = { bg: 'var(--ink)', fg: 'var(--surface)', border: 'var(--ink)' };
export const UNSEL = { bg: 'var(--surface)', fg: 'var(--ink)', border: 'var(--line)' };
export const chip = (on: boolean) => (on ? SEL : UNSEL);

/** Inline style for a selectable chip/button. */
export const chipStyle = (on: boolean, extra?: CSSProperties): CSSProperties => {
  const c = chip(on);
  return { border: `1px solid ${c.border}`, background: c.bg, color: c.fg, cursor: 'pointer', ...extra };
};

/** Accent for each account role: Salary, Savings, Investment. */
export const roleColor = (role: Role) =>
  role === 'Savings'
    ? { c: 'var(--savings)', soft: 'var(--savings-soft)' }
    : role === 'Investment'
      ? { c: 'var(--invest)', soft: 'var(--invest-soft)' }
      : { c: 'var(--salary)', soft: 'var(--salary-soft)' };

export const roleIcon = (role: Role): IconName => (role === 'Savings' ? 'piggy' : role === 'Investment' ? 'invest' : 'briefcase');
export const typeIcon = (t: AcctType): IconName => (t === 'E-wallet' ? 'wallet' : t === 'Cash' ? 'banknote' : 'bank');
/** Investment accounts use the investment icon; others show what kind of account they are. */
export const acctIcon = (a: { role: Role; type: AcctType }): IconName => (a.role === 'Investment' ? 'invest' : typeIcon(a.type));

const CAT_ICON: Record<string, IconName> = { food: 'food', transport: 'bus', bills: 'receipt', shopping: 'bag', entertainment: 'ticket', health: 'heart', other: 'tag' };
/** Splits a leading emoji (with skin tones, variation selectors and joiners) off a category name. */
const EMOJI_PREFIX = /^\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)*(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)*)*\s*/u;
const splitEmoji = (name: string) => {
  const m = name.trim().match(EMOJI_PREFIX);
  return m ? { emoji: m[0].trim(), rest: name.trim().slice(m[0].length) } : { emoji: '', rest: name.trim() };
};

/** A category's icon: its own emoji when the name starts with one (e.g. "🍜 Food"), else a line icon. */
export function CatGlyph({ cat, size = 20 }: { cat: Pick<Category, 'id' | 'name'>; size?: number }) {
  const { emoji } = splitEmoji(cat.name);
  if (emoji) return <span style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}>{emoji}</span>;
  return <Icon name={CAT_ICON[cat.id] || 'tag'} size={size} />;
}
/** Display name without a leading emoji, for places that already show the emoji. */
export const catLabel = (name: string) => splitEmoji(name).rest || name;

/** Section heading: icon + semibold text. */
export function Label({ icon, color, size = 14, children }: { icon: IconName; color?: string; size?: number; children: ReactNode }) {
  return (
    <div className="label" style={{ color, fontSize: size }}>
      <Icon name={icon} size={size + 6} />
      {children}
    </div>
  );
}

/** Role-colored selection. */
export const roleStyle = (on: boolean, role: Role) => {
  const r = roleColor(role);
  return { bg: on ? r.soft : 'var(--surface)', fg: on ? r.c : 'var(--ink2)', border: on ? r.c : 'var(--line)' };
};

/** "+Rp120.000 (+1,2%)" style change label with its color. */
export const changeLabel = (amount: number, base: number, fmtFn: (n: number) => string) => {
  const pct = base > 0 ? (amount / base) * 100 : 0;
  const pctStr = base > 0 ? ` (${amount >= 0 ? '+' : '−'}${Math.abs(pct).toFixed(1).replace('.', ',')}%)` : '';
  return {
    text: (amount > 0 ? '+' : '') + fmtFn(amount) + pctStr,
    color: amount > 0 ? 'var(--income)' : amount < 0 ? 'var(--expense)' : 'var(--ink3)',
  };
};

/** Segmented control inside a sheet (selected = raised surface). */
export function Seg<T extends string>({ opts, value, onChange, font }: { opts: { label: string; value: T; icon?: IconName }[]; value: T; onChange: (v: T) => void; font?: number }) {
  return (
    <div className="seg" role="tablist">
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)} style={{ fontSize: font, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink2)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {o.icon && <Icon name={o.icon} size={17} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Bar({ pct, color, h = 8, style }: { pct: number; color: string; h?: number; style?: CSSProperties }) {
  return (
    <div className="track" style={{ height: h, borderRadius: h / 2, ...style }}>
      <div style={{ width: pct + '%', background: color, borderRadius: h / 2 }} />
    </div>
  );
}

export function SectionLabel({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="label" style={{ color: 'var(--ink2)', fontWeight: 700, padding: '4px 4px 0' }}>
      <Icon name={icon} size={18} />
      {children}
    </div>
  );
}

export const divider = (i: number) => (i ? '1px solid var(--line)' : 'none');
