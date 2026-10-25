// IDR formatting: Rp1.250.000 — dot thousands separator, no decimals.
export const dots = (n: number) =>
  Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export const fmt = (n: number) => (n < 0 ? '−' : '') + 'Rp' + dots(n);

/** Formats a raw digit string for an input ("1250000" → "1.250.000"). */
export const dig = (s: string) => (s ? dots(Number(s)) : '');

/** Compact amount: Rp1,2jt / Rp450rb. */
export const short = (n: number) =>
  n >= 1e6
    ? 'Rp' + (Math.round(n / 1e5) / 10).toString().replace('.', ',') + 'jt'
    : 'Rp' + Math.round(n / 1e3) + 'rb';

export const onlyDigits = (s: string, max = 12) => s.replace(/\D/g, '').slice(0, max);

export const initials = (n: string) =>
  n
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const ordinal = (n: number) => {
  const s = n % 100;
  if (s >= 11 && s <= 13) return n + 'th';
  return n + (n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th');
};

export const uid = (prefix: string) =>
  prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
