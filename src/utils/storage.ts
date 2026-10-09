import { APP_PREFIX, DEFAULT_TTL, STORAGE_KEYS } from '@/constants/storage';
import type { StorageLike } from '@/types/notes';
interface CachedItem<T> {
  data: T;
  timestamp: number;
}
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}
export function getFromStorage<T>(key: string, storage = browserStorage()): T | null {
  try {
    const item = storage?.getItem(APP_PREFIX + key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}
export function saveToStorage(key: string, data: unknown, storage = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(APP_PREFIX + key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
export function removeFromStorage(key: string, storage = browserStorage()): boolean {
  if (!storage?.removeItem) return false;
  try {
    storage.removeItem(APP_PREFIX + key);
    return true;
  } catch {
    return false;
  }
}
export function setCachedItem<T>(
  key: string,
  data: T,
  ttlMs = DEFAULT_TTL,
  storage = browserStorage(),
): boolean {
  if (!Number.isFinite(ttlMs) || ttlMs < 0)
    throw new TypeError('TTL must be a non-negative number');
  return saveToStorage(key, { data, timestamp: Date.now() + ttlMs }, storage);
}
export function getCachedItem<T>(key: string, storage = browserStorage()): T | null {
  const item = getFromStorage<CachedItem<T>>(key, storage);
  if (
    !item ||
    typeof item.timestamp !== 'number' ||
    !Number.isFinite(item.timestamp) ||
    Date.now() >= item.timestamp
  ) {
    if (item) removeFromStorage(key, storage);
    return null;
  }
  return item.data;
}
export { STORAGE_KEYS };
