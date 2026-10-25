import { useSyncExternalStore } from 'react';
import { DEFAULT_CATS, defaultSettings, emptyData, type Data } from './model';

const KEY = 'money-tracker:v1';

/** Fills in fields missing from older or imported data. */
export function normalize(raw: Partial<Data>): Data {
  const base = emptyData();
  const txns = Array.isArray(raw.txns) ? raw.txns : [];
  const maxSeq = txns.reduce((m, t) => Math.max(m, Number(t.seq) || 0), 0);
  return {
    ...base,
    ...raw,
    version: 1,
    onboarded: raw.onboarded ?? (Array.isArray(raw.accounts) && raw.accounts.length > 0),
    accounts: Array.isArray(raw.accounts) ? raw.accounts : [],
    cats: Array.isArray(raw.cats) && raw.cats.length ? raw.cats : DEFAULT_CATS.map((c) => ({ ...c })),
    txns,
    recurring: Array.isArray(raw.recurring) ? raw.recurring : [],
    pending: raw.pending || null,
    sweeps: Array.isArray(raw.sweeps) ? raw.sweeps : [],
    settings: { ...defaultSettings(), ...(raw.settings || {}) },
    seq: Math.max(Number(raw.seq) || 1, maxSeq + 1),
  };
}

function load(): Data {
  try {
    const s = localStorage.getItem(KEY);
    if (s) return normalize(JSON.parse(s));
  } catch {
    // Unreadable storage falls through to a fresh start.
  }
  return emptyData();
}

let data: Data = load();
let saveError = false;
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    saveError = false;
  } catch {
    saveError = true;
  }
}

export const getData = () => data;
export const hasSaveError = () => saveError;

export function setData(next: Data | ((d: Data) => Data)) {
  const v = typeof next === 'function' ? next(data) : next;
  if (v === data) return;
  data = v;
  save();
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useData = () => useSyncExternalStore(subscribe, getData);

// Another tab changed the data: pick it up.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    data = load();
    listeners.forEach((l) => l());
  });
}
