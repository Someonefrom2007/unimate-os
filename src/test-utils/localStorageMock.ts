/**
 * Minimal localStorage polyfill for vitest (node environment).
 * Provides just enough API for engines that persist to localStorage.
 */
import { vi } from 'vitest';

const store = new Map<string, string>();

export const mockLocalStorage: Storage = {
  get length() { return store.size; },
  getItem(key: string) { return store.get(key) ?? null; },
  setItem(key: string, value: string) { store.set(key, String(value)); },
  removeItem(key: string) { store.delete(key); },
  clear() { store.clear(); },
  key(index: number) { return [...store.keys()][index] ?? null; },
};

/** Install mock localStorage on globalThis. Call in beforeEach. */
export function installLocalStorageMock(): void {
  store.clear();
  vi.stubGlobal('localStorage', mockLocalStorage);
}

/** Remove mock localStorage. Call in afterEach. */
export function uninstallLocalStorageMock(): void {
  vi.unstubAllGlobals();
  store.clear();
}
