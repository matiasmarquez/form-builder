import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Tiny in-memory shim — the node test environment has no localStorage, and
// the autosave store only needs get/set/clear.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

// Import AFTER the shim so the module's `readInitial()` sees a real storage.
const { useAutosaveStore } = await import('./autosave.ts');

describe('autosave store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('defaults to enabled when localStorage is empty', () => {
    const store = useAutosaveStore();
    expect(store.enabled).toBe(true);
  });

  it('persists the toggle to localStorage', () => {
    const store = useAutosaveStore();
    store.setEnabled(false);
    expect(localStorage.getItem('form-builder.autosave-enabled')).toBe('false');
  });

  it('toggle flips the current value', () => {
    const store = useAutosaveStore();
    expect(store.enabled).toBe(true);
    store.toggle();
    expect(store.enabled).toBe(false);
    store.toggle();
    expect(store.enabled).toBe(true);
  });
});
