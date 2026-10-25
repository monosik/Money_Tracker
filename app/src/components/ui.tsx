import type { CSSProperties, ReactNode } from 'react';
import type { Role } from '../lib/model';

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
export function Seg<T extends string>({ opts, value, onChange, font }: { opts: { label: string; value: T }[]; value: T; onChange: (v: T) => void; font?: number }) {
  return (
    <div className="seg" role="tablist">
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={on} onClick={() => onChange(o.value)} style={{ fontSize: font, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--ink)' : 'var(--ink2)' }}>
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

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="eyebrow" style={{ color: 'var(--ink3)', padding: '4px 4px 0' }}>
      {children}
    </div>
  );
}

export const divider = (i: number) => (i ? '1px solid var(--line)' : 'none');
