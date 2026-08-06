<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { FOCUS_RING_CLASSES } from '../../lib/focus-ring.ts';

const props = defineProps<{
  open: boolean;
  title?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
}>();

const panelRef = ref<HTMLElement | null>(null);
const previouslyFocused = ref<HTMLElement | null>(null);

function close(): void {
  emit('update:open', false);
  emit('close');
}

function focusableElements(): HTMLElement[] {
  if (!panelRef.value) return [];
  return Array.from(
    panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && el.tabIndex !== -1);
}

function onKeydown(event: KeyboardEvent): void {
  if (!props.open) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    close();
    return;
  }
  if (event.key !== 'Tab') return;
  const nodes = focusableElements();
  if (nodes.length === 0) return;
  const first = nodes[0]!;
  const last = nodes[nodes.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocused.value = document.activeElement as HTMLElement | null;
      await nextTick();
      const nodes = focusableElements();
      (nodes[0] ?? panelRef.value)?.focus();
      document.addEventListener('keydown', onKeydown);
    } else {
      document.removeEventListener('keydown', onKeydown);
      previouslyFocused.value?.focus?.();
      previouslyFocused.value = null;
    }
  },
);

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-40"
      :class="open ? 'pointer-events-auto' : 'pointer-events-none'"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 bg-neutral-950/40 transition-opacity duration-200"
        :class="open ? 'opacity-100' : 'opacity-0'"
        @click="close"
      />
    </div>
    <aside
      ref="panelRef"
      class="fixed inset-y-0 left-0 z-50 flex w-[min(100%,20rem)] flex-col border-r border-border bg-surface-elevated shadow-sm transition-transform duration-200 ease-out"
      :class="open ? 'translate-x-0' : '-translate-x-full pointer-events-none'"
      role="dialog"
      aria-modal="true"
      :aria-label="title ?? 'Drawer'"
      :aria-hidden="!open"
      :inert="!open"
      tabindex="-1"
    >
      <div class="flex items-center justify-between border-b border-border px-4 py-3">
        <p v-if="title" class="text-sm font-medium text-fg">{{ title }}</p>
        <slot name="header" />
        <button
          type="button"
          class="rounded-md px-2 py-1 text-sm text-muted-fg hover:text-fg"
          :class="FOCUS_RING_CLASSES"
          aria-label="Close drawer"
          @click="close"
        >
          Close
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4">
        <slot />
      </div>
    </aside>
  </Teleport>
</template>
