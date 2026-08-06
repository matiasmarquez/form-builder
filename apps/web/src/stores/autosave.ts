import { defineStore } from 'pinia';

// Global (not per-form) autosave preference. Persists in localStorage so the
// user's choice sticks across reloads and across forms.
const STORAGE_KEY = 'form-builder.autosave-enabled';

function readInitial(): boolean {
  if (typeof localStorage === 'undefined') return true;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return true;
  return raw === 'true';
}

export const useAutosaveStore = defineStore('autosave', {
  state: () => ({
    enabled: readInitial(),
  }),
  actions: {
    setEnabled(value: boolean): void {
      this.enabled = value;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, value ? 'true' : 'false');
      }
    },
    toggle(): void {
      this.setEnabled(!this.enabled);
    },
  },
});
