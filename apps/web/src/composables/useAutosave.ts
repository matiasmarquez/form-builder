import { onBeforeUnmount, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useAutosaveStore } from '../stores/autosave.ts';
import { AUTOSAVE_DEBOUNCE_MS, useEditorStore } from '../stores/editor.ts';

// Wires the editor store to a true debounced-on-every-keystroke autosave loop.
// Returns `flushPending()` which forces the pending timer to fire immediately —
// used by Cmd/Ctrl+S so the shortcut never has to wait AUTOSAVE_DEBOUNCE_MS.
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
    // If the user typed while the request was in flight, `save()` leaves
    // `isDirty` true. Reschedule so the tail of the edit stream still lands.
    if (editor.isDirty && enabled.value) {
      schedule();
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

  // Watch the store's revision counter — it bumps on every user mutation,
  // including inside a coalesce window. That gives us "restart the 800ms
  // timer on every keystroke", which is what a debounced autosave usually
  // means. Watching `isDirty` alone would only fire on the first false→true
  // flip and miss the rest of the keystrokes.
  const stopRevisionWatch = watch(
    () => editor.revision,
    () => {
      if (!editor.isDirty) return;
      if (!enabled.value) return;
      schedule();
    },
  );

  // If the user toggles autosave off mid-window, drop the pending timer.
  // Toggling back on with dirty state kicks a fresh debounce.
  const stopEnabledWatch = watch(enabled, (isOn) => {
    if (!isOn) {
      clearTimer();
      return;
    }
    if (editor.isDirty) schedule();
  });

  onBeforeUnmount(() => {
    stopRevisionWatch();
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
