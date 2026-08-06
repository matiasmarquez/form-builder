<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '../stores/editor.ts';
import { useAutosaveStore } from '../stores/autosave.ts';

const props = defineProps<{
  onSave: () => void | Promise<void>;
}>();

const editor = useEditorStore();
const autosave = useAutosaveStore();
const { isPersisted, isDirty, saveStatus, lastSavedAt } = storeToRefs(editor);
const { enabled: autosaveEnabled } = storeToRefs(autosave);

// Re-render the "Saved • Ns ago" label once a second. The tick is a plain ref
// whose value is unused — the getter below just needs a reactive dep to bump.
const now = ref(Date.now());
let tickHandle: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  tickHandle = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onBeforeUnmount(() => {
  if (tickHandle !== null) clearInterval(tickHandle);
});

function formatAgo(ts: number, current: number): string {
  const seconds = Math.max(0, Math.round((current - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}

// Status priority (spec order):
//   1. New form — not saved yet     when !isPersisted
//   2. Saving…                       when saveStatus === 'saving'
//   3. Failed — retry                when saveStatus === 'failed'
//   4. Unsaved changes               when autosave off && isDirty
//   5. Saved • Ns ago                otherwise
const statusLabel = computed<string>(() => {
  if (!isPersisted.value) return 'New form — not saved yet';
  if (saveStatus.value === 'saving') return 'Saving…';
  if (saveStatus.value === 'failed') return 'Failed — retry';
  if (!autosaveEnabled.value && isDirty.value) return 'Unsaved changes';
  if (lastSavedAt.value !== null) return `Saved • ${formatAgo(lastSavedAt.value, now.value)}`;
  return 'Saved';
});

const statusTone = computed(() => {
  if (saveStatus.value === 'failed') return 'text-red-600';
  if (saveStatus.value === 'saving') return 'text-neutral-500';
  if (!isPersisted.value) return 'text-neutral-500';
  if (!autosaveEnabled.value && isDirty.value) return 'text-amber-600';
  return 'text-neutral-500';
});
</script>

<template>
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4"
  >
    <div class="flex items-center gap-3">
      <span
        class="text-sm"
        :class="statusTone"
        role="status"
        aria-live="polite"
        data-testid="save-status"
      >
        {{ statusLabel }}
      </span>
      <button
        v-if="saveStatus === 'failed'"
        type="button"
        class="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
        @click="props.onSave()"
      >
        Retry
      </button>
    </div>

    <div class="flex items-center gap-3">
      <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          :checked="autosaveEnabled"
          @change="autosave.setEnabled(($event.target as HTMLInputElement).checked)"
          aria-label="Autosave"
        />
        Autosave
      </label>
      <button
        type="button"
        class="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!isDirty"
        @click="props.onSave()"
        data-testid="save-button"
      >
        Save
      </button>
    </div>
  </header>
</template>
