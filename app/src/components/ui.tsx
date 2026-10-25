import type { CSSProperties, ReactNode } from 'react';

export const SEL = { bg: 'var(--ink)', fg: 'var(--surface)', border: 'var(--ink)' };
export const UNSEL = { bg: 'var(--surface)', fg: 'var(--ink)', border: 'var(--line)' };
export const chip = (on: boolean) => (on ? SEL : UNSEL);

/** Inline style for a selectable chip/button. */
export const chipStyle = (on: boolean, extra?: CSSProperties): CSSProperties => {
  const c = chip(on);
  return { border: `1px solid ${c.border}`, background: c.bg, color: c.fg, cursor: 'pointer', ...extra };
};

/** Role-colored selection (Salary / Savings accent). */
export const roleStyle = (on: boolean, savings: boolean) => ({
  bg: on ? (savings ? 'var(--savings-soft)' : 'var(--salary-soft)') : 'var(--surface)',
  fg: on ? (savings ? 'var(--savings)' : 'var(--salary)') : 'var(--ink2)',
  border: on ? (savings ? 'var(--savings)' : 'var(--salary)') : 'var(--line)',
});

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
