import { computed, ref, watch, type Ref, type ComputedRef } from 'vue';

export const THEME_STORAGE_KEY = 'form-builder:theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export function resolveThemePreference(raw: string | null): ThemePreference {
  if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  return 'system';
}

export function applyThemeClass(effective: EffectiveTheme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', effective === 'dark');
}

function readStoredPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system';
  return resolveThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
}

function systemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveEffective(preference: ThemePreference, dark: boolean): EffectiveTheme {
  if (preference === 'system') return dark ? 'dark' : 'light';
  return preference;
}

const preference = ref<ThemePreference>(readStoredPreference());
const systemDark = ref(systemPrefersDark());

const effective = computed<EffectiveTheme>(() =>
  resolveEffective(preference.value, systemDark.value),
);

let themeTransitionReady = false;

watch(
  effective,
  (value) => {
    if (themeTransitionReady && typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
      globalThis.setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 200);
    }
    applyThemeClass(value);
    themeTransitionReady = true;
  },
  { immediate: true, flush: 'sync' },
);

let mediaBound = false;

function ensureMediaListener(): void {
  if (mediaBound) return;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
  mediaBound = true;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  systemDark.value = media.matches;
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches;
  });
}

export interface UseThemeResult {
  preference: Ref<ThemePreference>;
  effective: ComputedRef<EffectiveTheme>;
  setPreference: (value: ThemePreference) => void;
  toggle: () => void;
}

export function useTheme(): UseThemeResult {
  ensureMediaListener();

  function setPreference(value: ThemePreference): void {
    preference.value = value;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    }
  }

  function toggle(): void {
    setPreference(effective.value === 'dark' ? 'light' : 'dark');
  }

  return { preference, effective, setPreference, toggle };
}

/** Pure helpers shared with the pre-paint boot script semantics. */
export function bootThemeFromStorage(): EffectiveTheme {
  const stored = readStoredPreference();
  const next = resolveEffective(stored, systemPrefersDark());
  applyThemeClass(next);
  return next;
}

/** Test-only: re-sync module state from storage / matchMedia. */
export function __resetThemeStateForTests(): void {
  preference.value = readStoredPreference();
  systemDark.value = systemPrefersDark();
  applyThemeClass(effective.value);
}
