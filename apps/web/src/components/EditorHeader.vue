<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { AlertCircle, Check, Circle, Loader2 } from 'lucide-vue-next';
import { useEditorStore } from '../stores/editor.ts';
import { useAutosaveStore } from '../stores/autosave.ts';
import Button from './ui/Button.vue';

const props = defineProps<{
  onSave: () => void | Promise<void>;
}>();

const editor = useEditorStore();
const autosave = useAutosaveStore();
const { isPersisted, isDirty, saveStatus } = storeToRefs(editor);
const { enabled: autosaveEnabled } = storeToRefs(autosave);

type StatusKind = 'new' | 'saving' | 'failed' | 'unsaved' | 'saved';

const statusKind = computed<StatusKind>(() => {
  if (!isPersisted.value) return 'new';
  if (saveStatus.value === 'saving') return 'saving';
  if (saveStatus.value === 'failed') return 'failed';
  if (!autosaveEnabled.value && isDirty.value) return 'unsaved';
  return 'saved';
});

const statusLabel = computed(() => {
  switch (statusKind.value) {
    case 'new':
      return 'Not saved yet';
    case 'saving':
      return 'Saving…';
    case 'failed':
      return 'Failed — retry';
    case 'unsaved':
      return 'Unsaved changes';
    case 'saved':
      return 'Saved';
    default: {
      const _exhaustive: never = statusKind.value;
      return _exhaustive;
    }
  }
});
</script>

<template>
  <header
    class="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"
  >
    <div class="flex items-center gap-3">
      <span
        class="inline-flex items-center gap-2 text-sm"
        role="status"
        aria-live="polite"
        data-testid="save-status"
      >
        <span class="relative size-4 shrink-0">
          <Transition
            enter-active-class="transition-opacity duration-150"
            leave-active-class="transition-opacity duration-150 absolute inset-0"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
            mode="out-in"
          >
            <Check
              v-if="statusKind === 'saved'"
              key="saved"
              class="size-4 text-primary"
              aria-hidden="true"
            />
            <Loader2
              v-else-if="statusKind === 'saving'"
              key="saving"
              class="size-4 animate-spin text-muted-fg"
              aria-hidden="true"
            />
            <AlertCircle
              v-else-if="statusKind === 'failed'"
              key="failed"
              class="size-4 text-danger"
              aria-hidden="true"
            />
            <Circle
              v-else-if="statusKind === 'unsaved'"
              key="unsaved"
              class="size-4 text-warning"
              aria-hidden="true"
            />
            <Circle
              v-else
              key="new"
              class="size-4 text-muted-fg"
              aria-hidden="true"
            />
          </Transition>
        </span>
        <span
          :class="{
            'text-danger-fg': statusKind === 'failed',
            'text-muted-fg': statusKind !== 'failed',
          }"
        >
          {{ statusLabel }}
        </span>
      </span>
      <Button
        v-if="saveStatus === 'failed'"
        variant="secondary"
        size="sm"
        @click="props.onSave()"
      >
        Retry
      </Button>
    </div>

    <div class="flex items-center gap-3">
      <label class="inline-flex items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          :checked="autosaveEnabled"
          @change="autosave.setEnabled(($event.target as HTMLInputElement).checked)"
          aria-label="Autosave"
        />
        Autosave
      </label>
      <Button
        variant="primary"
        size="sm"
        :disabled="!isDirty"
        data-testid="save-button"
        @click="props.onSave()"
      >
        Save
      </Button>
    </div>
  </header>
</template>
