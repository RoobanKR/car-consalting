'use client';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'carwise-compare';
const CHANGE_EVENT = 'carwise:compare-changed';
export const COMPARE_MAX = 3;

export function readCompare(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string').slice(0, COMPARE_MAX) : [];
  } catch { return []; }
}

export function writeCompare(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(list)).slice(0, COMPARE_MAX);
    if (unique.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCompareIds(readCompare());
    setReady(true);
    const refresh = () => setCompareIds(readCompare());
    window.addEventListener('storage', refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
    };
  }, []);

  const toggle = useCallback((id: string): { ok: boolean; reason?: 'full' } => {
    const current = readCompare();
    if (current.includes(id)) { writeCompare(current.filter(item => item !== id)); return { ok: true }; }
    if (current.length >= COMPARE_MAX) return { ok: false, reason: 'full' };
    writeCompare([...current, id]);
    return { ok: true };
  }, []);

  const remove = useCallback((id: string) => writeCompare(readCompare().filter(item => item !== id)), []);
  const clear = useCallback(() => writeCompare([]), []);
  const inCompare = useCallback((id: string) => compareIds.includes(id), [compareIds]);
  const isFull = compareIds.length >= COMPARE_MAX;

  return { compareIds, ready, toggle, remove, clear, inCompare, isFull, max: COMPARE_MAX };
}
