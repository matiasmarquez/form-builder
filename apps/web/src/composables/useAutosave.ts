import { onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAutosaveStore } from '../stores/autosave.ts';
import { AUTOSAVE_DEBOUNCE_MS, useEditorStore } from '../stores/editor.ts';

// Wires the editor store to the debounced autosave loop. Returns
// `flushPending()` which forces any in-flight debounce to fire immediately —
// used by Cmd/Ctrl+S so the shortcut never has to wait 800ms.
export function useAutosave(): { flushPending: () => Promise<void> } {
  const editor = useEditorStore();
  const autosave = useAutosaveStore();
  const { enabled } = storeToRefs(autosave);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let scheduled = false;

  function clearTimer(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    scheduled = false;
  }

  async function runSave(): Promise<void> {
    scheduled = false;
    if (!editor.isDirty) return;
    try {
      await editor.save();
    } catch {
      // Store already surfaces the failure via saveStatus/lastSaveError.
      // Swallow here so a rejected debounce doesn't become an unhandled
      // promise rejection.
    }
  }

  function schedule(): void {
    clearTimer();
    scheduled = true;
    timer = setTimeout(() => {
      timer = null;
      void runSave();
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  async function flushPending(): Promise<void> {
    clearTimer();
    await runSave();
  }

  // Any dirty-flip while autosave is on schedules a save. If the user toggles
  // autosave off mid-window we cancel the pending timer immediately.
  const stopDirtyWatch = watch(
    () => editor.isDirty,
    (dirty) => {
      if (!dirty) {
        clearTimer();
        return;
      }
      if (enabled.value) schedule();
    },
  );

  const stopEnabledWatch = watch(enabled, (isOn) => {
    if (!isOn) {
      clearTimer();
      return;
    }
    if (editor.isDirty) schedule();
  });

  onBeforeUnmount(() => {
    stopDirtyWatch();
    stopEnabledWatch();
    // Fire-and-forget: if we're leaving the editor with a queued autosave,
    // let it drain so the user's last edit isn't lost.
    if (scheduled) {
      clearTimer();
      void runSave();
    }
  });

  return { flushPending };
}
