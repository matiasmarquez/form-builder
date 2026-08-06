import { beforeEach, describe, expect, it, vi } from 'vitest';

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

class FakeClassList {
  private classes = new Set<string>();
  add(...tokens: string[]): void {
    for (const t of tokens) this.classes.add(t);
  }
  remove(...tokens: string[]): void {
    for (const t of tokens) this.classes.delete(t);
  }
  contains(token: string): boolean {
    return this.classes.has(token);
  }
  toggle(token: string, force?: boolean): boolean {
    if (force === true) {
      this.classes.add(token);
      return true;
    }
    if (force === false) {
      this.classes.delete(token);
      return false;
    }
    if (this.classes.has(token)) {
      this.classes.delete(token);
      return false;
    }
    this.classes.add(token);
    return true;
  }
}

(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();

const rootClassList = new FakeClassList();

function mockMatchMedia(matchesDark: boolean): void {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('dark') ? matchesDark : !matchesDark,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(globalThis, 'window', {
    writable: true,
    configurable: true,
    value: { matchMedia },
  });
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMedia,
  });
}

// Import vue-backed module BEFORE installing a partial `document` mock —
// Vue's runtime-dom probes document.createElement at load time.
const {
  useTheme,
  THEME_STORAGE_KEY,
  applyThemeClass,
  resolveThemePreference,
  __resetThemeStateForTests,
} = await import('./useTheme.ts');

Object.defineProperty(globalThis, 'document', {
  writable: true,
  configurable: true,
  value: {
    documentElement: { classList: rootClassList },
  },
});

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    rootClassList.remove('dark');
    mockMatchMedia(false);
    __resetThemeStateForTests();
  });

  it('defaults to system when localStorage is empty', () => {
    const theme = useTheme();
    expect(theme.preference.value).toBe('system');
  });

  it('resolves system to light when prefers-color-scheme is light', () => {
    mockMatchMedia(false);
    __resetThemeStateForTests();
    const theme = useTheme();
    expect(theme.effective.value).toBe('light');
    expect(rootClassList.contains('dark')).toBe(false);
  });

  it('resolves system to dark when prefers-color-scheme is dark', () => {
    mockMatchMedia(true);
    __resetThemeStateForTests();
    const theme = useTheme();
    expect(theme.effective.value).toBe('dark');
    expect(rootClassList.contains('dark')).toBe(true);
  });

  it('persists preference to localStorage', () => {
    const theme = useTheme();
    theme.setPreference('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(theme.effective.value).toBe('dark');
    expect(rootClassList.contains('dark')).toBe(true);
  });

  it('reads a stored preference on create', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    mockMatchMedia(true);
    __resetThemeStateForTests();
    const theme = useTheme();
    expect(theme.preference.value).toBe('light');
    expect(theme.effective.value).toBe('light');
    expect(rootClassList.contains('dark')).toBe(false);
  });

  it('toggle flips to the opposite of the effective theme', () => {
    const theme = useTheme();
    theme.setPreference('light');
    theme.toggle();
    expect(theme.preference.value).toBe('dark');
    expect(theme.effective.value).toBe('dark');
    theme.toggle();
    expect(theme.preference.value).toBe('light');
  });

  it('resolveThemePreference ignores unknown storage values', () => {
    expect(resolveThemePreference('nope')).toBe('system');
    expect(resolveThemePreference(null)).toBe('system');
    expect(resolveThemePreference('dark')).toBe('dark');
  });

  it('applyThemeClass toggles .dark on the root element', () => {
    applyThemeClass('dark');
    expect(rootClassList.contains('dark')).toBe(true);
    applyThemeClass('light');
    expect(rootClassList.contains('dark')).toBe(false);
  });
});
