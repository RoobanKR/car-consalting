'use client';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'carwise-favorites';
const CHANGE_EVENT = 'carwise:favorites-changed';

export function readFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch { return []; }
}

export function writeFavorites(list: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const unique = Array.from(new Set(list));
    if (unique.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavoritesState(readFavorites());
    setReady(true);
    const refresh = () => setFavoritesState(readFavorites());
    window.addEventListener('storage', refresh);
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener(CHANGE_EVENT, refresh);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readFavorites();
    writeFavorites(current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  }, []);

  const clear = useCallback(() => writeFavorites([]), []);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);

  return { favorites, ready, toggle, clear, isFavorite };
}
