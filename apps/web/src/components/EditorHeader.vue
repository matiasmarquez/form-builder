<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { AlertCircle, Check, Circle, Loader2 } from "lucide-vue-next";
import { useEditorStore } from "../stores/editor.ts";
import { useAutosaveStore } from "../stores/autosave.ts";
import Button from "./ui/Button.vue";
import { FOCUS_RING_CLASSES } from "../lib/focus-ring.ts";

const props = defineProps<{
  onSave: () => void | Promise<void>;
}>();

const editor = useEditorStore();
const autosave = useAutosaveStore();
const { isPersisted, isDirty, saveStatus } = storeToRefs(editor);
const { enabled: autosaveEnabled } = storeToRefs(autosave);

type StatusKind = "new" | "saving" | "failed" | "unsaved" | "saved";

const MIN_SAVING_MS = 600;
const MIN_SAVED_MS = 1000;

const actualKind = computed<StatusKind>(() => {
  if (!isPersisted.value) return "new";
  if (saveStatus.value === "saving") return "saving";
  if (saveStatus.value === "failed") return "failed";
  if (!autosaveEnabled.value && isDirty.value) return "unsaved";
  if (saveStatus.value === "saved" || isPersisted.value) return "saved";
  return "new";
});

// Displayed status lags behind the store so brief Saving→Saved flashes are
// readable instead of flickering through the icon transition.
const displayKind = ref<StatusKind>(actualKind.value);
let holdUntil = 0;
let pendingKind: StatusKind | null = null;
let settleTimer: ReturnType<typeof setTimeout> | null = null;

function clearSettleTimer(): void {
  if (settleTimer !== null) {
    clearTimeout(settleTimer);
    settleTimer = null;
  }
}

function minHoldMs(kind: StatusKind): number {
  if (kind === "saving") return MIN_SAVING_MS;
  if (kind === "saved") return MIN_SAVED_MS;
  return 0;
}

function applyDisplay(kind: StatusKind): void {
  displayKind.value = kind;
  const hold = minHoldMs(kind);
  holdUntil = hold > 0 ? Date.now() + hold : 0;
}

function flushPending(): void {
  settleTimer = null;
  if (pendingKind === null) return;
  const next = pendingKind;
  pendingKind = null;
  applyDisplay(next);
  // If actual moved again while we were holding, re-check.
  if (actualKind.value !== displayKind.value) {
    scheduleDisplay(actualKind.value);
  }
}

function scheduleDisplay(kind: StatusKind): void {
  // Interruptible states always win immediately.
  if (kind === "saving" || kind === "failed") {
    clearSettleTimer();
    pendingKind = null;
    applyDisplay(kind);
    return;
  }

  const remaining = holdUntil - Date.now();
  if (remaining <= 0) {
    clearSettleTimer();
    pendingKind = null;
    applyDisplay(kind);
    return;
  }

  pendingKind = kind;
  clearSettleTimer();
  settleTimer = setTimeout(flushPending, remaining);
}

watch(
  actualKind,
  (kind) => {
    if (kind === displayKind.value && pendingKind === null) return;
    scheduleDisplay(kind);
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearSettleTimer();
});

const statusLabel = computed(() => {
  switch (displayKind.value) {
    case "new":
      return "Aún no se guardó";
    case "saving":
      return "Guardando…";
    case "failed":
      return "Error — reintentar";
    case "unsaved":
      return "Cambios sin guardar";
    case "saved":
      return "Guardado";
    default: {
      const _exhaustive: never = displayKind.value;
      return _exhaustive;
    }
  }
});
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-3">
      <span
        class="inline-flex items-center gap-2 text-sm"
        role="status"
        aria-live="polite"
        data-testid="save-status"
      >
        <span
          class="relative inline-flex size-4 shrink-0 items-center justify-center"
        >
          <Transition
            enter-active-class="transition-opacity duration-300 ease-out"
            leave-active-class="transition-opacity duration-300 ease-out absolute inset-0"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
            mode="default"
          >
            <Check
              v-if="displayKind === 'saved'"
              key="saved"
              class="size-4 text-primary"
              aria-hidden="true"
            />
            <Loader2
              v-else-if="displayKind === 'saving'"
              key="saving"
              class="size-4 animate-spin text-muted-fg"
              aria-hidden="true"
            />
            <AlertCircle
              v-else-if="displayKind === 'failed'"
              key="failed"
              class="size-4 text-danger"
              aria-hidden="true"
            />
            <Circle
              v-else-if="displayKind === 'unsaved'"
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
            'text-danger-fg': displayKind === 'failed',
            'text-muted-fg': displayKind !== 'failed',
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
        Reintentar
      </Button>
    </div>

    <div class="flex items-center gap-3">
      <label
        class="inline-flex items-center gap-2 text-sm leading-relaxed text-fg"
        for="editor-autosave"
      >
        <input
          id="editor-autosave"
          type="checkbox"
          class="rounded border-border-strong"
          :class="FOCUS_RING_CLASSES"
          :checked="autosaveEnabled"
          @change="
            autosave.setEnabled(($event.target as HTMLInputElement).checked)
          "
        />
        Autoguardado
      </label>
      <Button
        variant="primary"
        size="sm"
        :disabled="!isDirty"
        data-testid="save-button"
        @click="props.onSave()"
      >
        Guardar
      </Button>
    </div>
  </div>
</template>
