<script setup lang="ts">
import { computed } from 'vue';
import type { Field } from '@form-builder/shared';
import { useEditorStore } from '../stores/editor.ts';
import { useReorderableList } from '../composables/useReorderableList.ts';
import FieldOptionList from './FieldOptionList.vue';

const store = useEditorStore();

const fieldIds = computed<string[]>(() => store.template?.fields.map((f) => f.id) ?? []);

const { parentRef, ids, moveByKeyboard, onHandleMouseDown } = useReorderableList({
  source: () => fieldIds.value,
  commit: (newOrder) => store.reorderFields(newOrder),
  dragHandle: '[data-field-handle]',
});

function findField(id: string): Field | undefined {
  return store.template?.fields.find((f) => f.id === id);
}

function refocusHandle(fieldId: string): void {
  requestAnimationFrame(() => {
    const el = parentRef.value?.querySelector<HTMLButtonElement>(
      `[data-field-handle="${fieldId}"]`,
    );
    el?.focus();
  });
}

function onHandleKeydown(event: KeyboardEvent, fieldId: string): void {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    const dir = event.key === 'ArrowUp' ? -1 : 1;
    const to = moveByKeyboard(fieldId, dir);
    if (to !== null) refocusHandle(fieldId);
  }
}

function fieldTypeLabel(type: Field['type']): string {
  switch (type) {
    case 'text':
      return 'Short answer';
    case 'paragraph':
      return 'Paragraph';
    case 'checkbox':
      return 'Checkboxes';
    case 'radio':
      return 'Multiple choice';
    case 'select':
      return 'Dropdown';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
</script>

<template>
  <ul ref="parentRef" class="space-y-4" aria-label="Form fields">
    <template v-for="fieldId in ids" :key="fieldId">
      <li
        v-if="findField(fieldId)"
        class="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 shadow-sm"
      >
        <template v-if="findField(fieldId) as Field | undefined">
          <div class="flex items-start justify-between gap-4">
            <button
              type="button"
              :data-field-handle="fieldId"
              @mousedown="onHandleMouseDown"
              @keydown="onHandleKeydown($event, fieldId)"
              class="cursor-grab text-neutral-400 hover:text-neutral-700 focus:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 rounded px-1 mt-1"
              :aria-label="`Reorder field ${findField(fieldId)!.label || 'untitled'}. Use arrow up and down to move.`"
              aria-keyshortcuts="ArrowUp ArrowDown"
            >
              <span aria-hidden="true">⋮⋮</span>
            </button>
            <div class="flex-1 space-y-1">
              <div class="text-xs uppercase tracking-wide text-neutral-500">
                {{ fieldTypeLabel(findField(fieldId)!.type) }}
              </div>
              <label class="block">
                <span class="sr-only">Field label</span>
                <input
                  :value="findField(fieldId)!.label"
                  @input="store.setFieldLabel(fieldId, ($event.target as HTMLInputElement).value)"
                  @blur="store.flushCoalesce()"
                  class="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-400"
                  placeholder="Question"
                  :aria-label="`Label for field ${fieldId}`"
                />
              </label>
            </div>
            <button
              type="button"
              @click="store.deleteField(fieldId)"
              class="text-sm text-neutral-500 hover:text-red-600"
              :aria-label="`Delete field ${findField(fieldId)!.label || 'untitled'}`"
            >
              Delete
            </button>
          </div>

          <label class="block">
            <span class="sr-only">Helper description</span>
            <input
              :value="findField(fieldId)!.description ?? ''"
              @input="store.setFieldDescription(fieldId, ($event.target as HTMLInputElement).value)"
              @blur="store.flushCoalesce()"
              class="w-full bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400"
              placeholder="Helper description (optional)"
            />
          </label>

          <template v-if="findField(fieldId)!.type === 'text'">
            <input
              :value="(findField(fieldId) as Extract<Field, { type: 'text' }>).placeholder ?? ''"
              @input="store.setTextFieldPlaceholder(fieldId, ($event.target as HTMLInputElement).value)"
              @blur="store.flushCoalesce()"
              class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
              placeholder="Placeholder shown to respondents"
            />
          </template>

          <template v-else-if="findField(fieldId)!.type === 'paragraph'">
            <textarea
              :value="(findField(fieldId) as Extract<Field, { type: 'paragraph' }>).placeholder ?? ''"
              @input="store.setTextFieldPlaceholder(fieldId, ($event.target as HTMLTextAreaElement).value)"
              @blur="store.flushCoalesce()"
              class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 resize-none"
              rows="3"
              placeholder="Placeholder shown to respondents"
            ></textarea>
          </template>

          <template
            v-else-if="
              findField(fieldId)!.type === 'checkbox' ||
              findField(fieldId)!.type === 'radio' ||
              findField(fieldId)!.type === 'select'
            "
          >
            <FieldOptionList
              :field-id="fieldId"
              :field-label="findField(fieldId)!.label"
            />
            <button
              type="button"
              @click="store.addFieldOption(fieldId)"
              class="text-sm text-neutral-600 hover:text-neutral-900"
            >
              + Add option
            </button>
          </template>

          <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              :checked="findField(fieldId)!.required"
              @change="store.setFieldRequired(fieldId, ($event.target as HTMLInputElement).checked)"
            />
            Required
          </label>
        </template>
      </li>
    </template>
  </ul>
</template>
