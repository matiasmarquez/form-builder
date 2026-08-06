<script setup lang="ts">
import { computed } from 'vue';
import type { FieldOption } from '@form-builder/shared';
import { useEditorStore, isChoiceField } from '../stores/editor.ts';
import { useReorderableList } from '../composables/useReorderableList.ts';

const props = defineProps<{
  fieldId: string;
  fieldLabel: string;
}>();

const store = useEditorStore();

const optionIds = computed<string[]>(() => {
  const field = store.findField(props.fieldId);
  if (!field || !isChoiceField(field)) return [];
  return field.options.map((o) => o.id);
});

const { parentRef, ids, moveByKeyboard, onHandleMouseDown } = useReorderableList({
  source: () => optionIds.value,
  commit: (newOrder) => store.reorderFieldOptions(props.fieldId, newOrder),
  dragHandle: '[data-option-handle]',
});

function findOption(id: string): FieldOption | undefined {
  const field = store.findField(props.fieldId);
  if (!field || !isChoiceField(field)) return undefined;
  return field.options.find((o) => o.id === id);
}

function optionIndex(id: string): number {
  return ids.value.indexOf(id);
}

function fieldType(): 'checkbox' | 'radio' | 'select' | null {
  const field = store.findField(props.fieldId);
  if (!field || !isChoiceField(field)) return null;
  return field.type;
}

// Move focus to the drag handle inside the item with the given option id.
// Called after a keyboard reorder so the user's focus tracks the moved item.
function refocusHandle(optionId: string): void {
  requestAnimationFrame(() => {
    const el = parentRef.value?.querySelector<HTMLButtonElement>(
      `[data-option-handle="${optionId}"]`,
    );
    el?.focus();
  });
}

function onHandleKeydown(event: KeyboardEvent, optionId: string): void {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    const dir = event.key === 'ArrowUp' ? -1 : 1;
    const to = moveByKeyboard(optionId, dir);
    if (to !== null) refocusHandle(optionId);
  }
}

const canDeleteMore = computed(() => ids.value.length > 1);
</script>

<template>
  <ul
    ref="parentRef"
    class="space-y-2"
    :aria-label="`Options for ${fieldLabel || 'untitled field'}`"
  >
    <li
      v-for="(optionId, index) in ids"
      :key="optionId"
      class="flex items-center gap-2"
    >
      <button
        type="button"
        :data-option-handle="optionId"
        @mousedown="onHandleMouseDown"
        @keydown="onHandleKeydown($event, optionId)"
        class="cursor-grab text-neutral-400 hover:text-neutral-700 focus:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded px-1"
        :aria-label="`Reorder option ${optionIndex(optionId) + 1}. Use arrow up and down to move.`"
        aria-keyshortcuts="ArrowUp ArrowDown"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
      <span
        v-if="fieldType() === 'radio'"
        class="h-4 w-4 rounded-full border border-neutral-300 shrink-0"
        aria-hidden="true"
      ></span>
      <span
        v-else-if="fieldType() === 'checkbox'"
        class="h-4 w-4 rounded border border-neutral-300 shrink-0"
        aria-hidden="true"
      ></span>
      <span
        v-else
        class="w-6 text-right text-xs text-neutral-500 shrink-0"
        aria-hidden="true"
        >{{ index + 1 }}.</span
      >
      <input
        :value="findOption(optionId)?.label ?? ''"
        @input="
          store.setFieldOptionLabel(
            fieldId,
            optionId,
            ($event.target as HTMLInputElement).value,
          )
        "
        @blur="store.flushCoalesce()"
        class="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 border-b border-transparent focus:border-neutral-300 py-1"
        :placeholder="`Option ${index + 1}`"
        :aria-label="`Option ${index + 1} label`"
      />
      <button
        type="button"
        @click="store.deleteFieldOption(fieldId, optionId)"
        :disabled="!canDeleteMore"
        class="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-neutral-400"
        :aria-label="`Delete option ${findOption(optionId)?.label || index + 1}`"
      >
        Remove
      </button>
    </li>
  </ul>
</template>
