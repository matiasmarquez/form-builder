<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Field } from '@form-builder/shared';
import {
  Asterisk,
  ChevronUp,
  GripVertical,
  Info,
  List,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import { useEditorStore, isChoiceField } from '../stores/editor.ts';
import { useReorderableList } from '../composables/useReorderableList.ts';
import { fieldTypeIcon, fieldTypeLabel } from '../lib/field-type-meta.ts';
import FieldOptionList from './FieldOptionList.vue';
import Badge from './ui/Badge.vue';
import Button from './ui/Button.vue';
import TextInput from './ui/TextInput.vue';

const store = useEditorStore();

const fieldIds = computed<string[]>(() => store.template?.fields.map((f) => f.id) ?? []);
const expandedIds = ref<Set<string>>(new Set());
// null until the first snapshot for the current template — that snapshot stays collapsed.
const knownIds = ref<Set<string> | null>(null);

watch(
  () => store.template?.id,
  () => {
    knownIds.value = null;
    expandedIds.value = new Set();
  },
);

watch(fieldIds, (ids) => {
  if (knownIds.value === null) {
    knownIds.value = new Set(ids);
    return;
  }
  const next = new Set(expandedIds.value);
  for (const id of ids) {
    if (!knownIds.value.has(id)) next.add(id);
  }
  for (const id of [...next]) {
    if (!ids.includes(id)) next.delete(id);
  }
  expandedIds.value = next;
  knownIds.value = new Set(ids);
});

const { parentRef, ids, moveByKeyboard, onHandleMouseDown } = useReorderableList({
  source: () => fieldIds.value,
  commit: (newOrder) => store.reorderFields(newOrder),
  dragHandle: '[data-field-handle]',
});

function findField(id: string): Field | undefined {
  return store.template?.fields.find((f) => f.id === id);
}

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id);
}

function expand(id: string): void {
  const next = new Set(expandedIds.value);
  next.add(id);
  expandedIds.value = next;
}

function collapse(id: string): void {
  const next = new Set(expandedIds.value);
  next.delete(id);
  expandedIds.value = next;
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

function optionCount(field: Field): number {
  if (!isChoiceField(field)) return 0;
  return field.options.length;
}

function bodyId(fieldId: string): string {
  return `field-body-${fieldId}`;
}
</script>

<template>
  <ul ref="parentRef" class="space-y-4" aria-label="Form fields">
    <template v-for="fieldId in ids" :key="fieldId">
      <li
        v-if="findField(fieldId)"
        class="relative flex items-stretch gap-2 md:pl-0"
      >
        <!--
          One handle node for both breakpoints: absolute inside the card at <md,
          static outside the card at ≥md.
        -->
        <button
          type="button"
          :data-field-handle="fieldId"
          class="absolute left-2 top-3 z-10 inline-flex cursor-grab rounded px-1 text-muted-fg hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface md:static md:mt-4 md:self-start"
          :aria-label="`Reorder field ${findField(fieldId)!.label || 'untitled'}. Use arrow up and down to move.`"
          aria-keyshortcuts="ArrowUp ArrowDown"
          @mousedown="onHandleMouseDown"
          @keydown="onHandleKeydown($event, fieldId)"
        >
          <GripVertical class="size-5" aria-hidden="true" />
        </button>

        <div
          class="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-sm"
        >
          <!-- Collapsed -->
          <div
            class="grid transition-[grid-template-rows] duration-200 ease-out"
            :style="{ gridTemplateRows: isExpanded(fieldId) ? '0fr' : '1fr' }"
          >
            <div class="overflow-hidden">
              <div class="flex items-center gap-2 p-3 pl-10 md:pl-3">
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                  :aria-expanded="false"
                  :aria-controls="bodyId(fieldId)"
                  @click="expand(fieldId)"
                >
                  <component
                    :is="fieldTypeIcon(findField(fieldId)!.type)"
                    class="size-4 shrink-0 text-muted-fg"
                    aria-hidden="true"
                  />
                  <span class="min-w-0 flex-1 truncate text-base font-medium text-fg">
                    {{ findField(fieldId)!.label || 'Untitled field' }}
                  </span>
                  <span class="flex shrink-0 items-center gap-1.5">
                    <Info
                      v-if="findField(fieldId)!.description"
                      class="size-4 text-muted-fg"
                      aria-label="Has description"
                    />
                    <span
                      v-if="isChoiceField(findField(fieldId)!)"
                      class="relative inline-flex"
                      :aria-label="`${optionCount(findField(fieldId)!)} options`"
                    >
                      <List class="size-4 text-muted-fg" aria-hidden="true" />
                      <Badge
                        variant="primary"
                        class="absolute -right-2 -top-2 min-w-4 justify-center px-1 py-0 text-[10px] leading-4"
                      >
                        {{ optionCount(findField(fieldId)!) }}
                      </Badge>
                    </span>
                    <Asterisk
                      v-if="findField(fieldId)!.required"
                      class="size-4 text-danger"
                      aria-label="Required"
                    />
                  </span>
                </button>

                <Button
                  variant="ghost"
                  icon-only
                  size="sm"
                  :aria-label="`Edit field ${findField(fieldId)!.label || 'untitled'}`"
                  @click.stop="expand(fieldId)"
                >
                  <Pencil class="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  icon-only
                  size="sm"
                  class="text-danger hover:text-danger"
                  :aria-label="`Delete field ${findField(fieldId)!.label || 'untitled'}`"
                  @click.stop="store.deleteField(fieldId)"
                >
                  <Trash2 class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Expanded -->
          <div
            :id="bodyId(fieldId)"
            class="grid transition-[grid-template-rows] duration-200 ease-out"
            :style="{ gridTemplateRows: isExpanded(fieldId) ? '1fr' : '0fr' }"
          >
            <div class="overflow-hidden">
              <div class="space-y-3 p-4 pl-10 md:pl-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <component
                      :is="fieldTypeIcon(findField(fieldId)!.type)"
                      class="size-4 shrink-0 text-muted-fg"
                      aria-hidden="true"
                    />
                    <Badge variant="neutral" class="uppercase tracking-wide">
                      {{ fieldTypeLabel(findField(fieldId)!.type) }}
                    </Badge>
                  </div>
                  <div class="flex items-center gap-2">
                    <label class="inline-flex items-center gap-2 text-sm text-fg">
                      <input
                        type="checkbox"
                        :checked="findField(fieldId)!.required"
                        @change="
                          store.setFieldRequired(
                            fieldId,
                            ($event.target as HTMLInputElement).checked,
                          )
                        "
                      />
                      Required
                    </label>
                    <Button
                      variant="ghost"
                      icon-only
                      size="sm"
                      :aria-label="`Collapse field ${findField(fieldId)!.label || 'untitled'}`"
                      :aria-expanded="true"
                      :aria-controls="bodyId(fieldId)"
                      @click="collapse(fieldId)"
                    >
                      <ChevronUp class="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <TextInput
                  variant="inline-borderless"
                  class="text-base font-medium"
                  :model-value="findField(fieldId)!.label"
                  placeholder="Question"
                  :aria-label="`Label for field ${fieldId}`"
                  @update:model-value="store.setFieldLabel(fieldId, $event)"
                  @blur="store.flushCoalesce()"
                />

                <TextInput
                  variant="inline-borderless"
                  class="text-sm"
                  :model-value="findField(fieldId)!.description ?? ''"
                  placeholder="Helper text (optional)"
                  :aria-label="`Description for field ${fieldId}`"
                  @update:model-value="store.setFieldDescription(fieldId, $event)"
                  @blur="store.flushCoalesce()"
                />

                <template
                  v-if="
                    findField(fieldId)!.type === 'text' ||
                    findField(fieldId)!.type === 'paragraph'
                  "
                >
                  <TextInput
                    variant="inline-borderless"
                    :model-value="
                      (
                        findField(fieldId) as Extract<
                          Field,
                          { type: 'text' | 'paragraph' }
                        >
                      ).placeholder ?? ''
                    "
                    placeholder="Placeholder shown to respondents"
                    @update:model-value="store.setTextFieldPlaceholder(fieldId, $event)"
                    @blur="store.flushCoalesce()"
                  />
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
                  <Button variant="ghost" size="sm" @click="store.addFieldOption(fieldId)">
                    + Add option
                  </Button>
                </template>

                <div class="flex justify-end">
                  <Button
                    variant="ghost"
                    icon-only
                    size="sm"
                    class="text-danger hover:text-danger"
                    :aria-label="`Delete field ${findField(fieldId)!.label || 'untitled'}`"
                    @click="store.deleteField(fieldId)"
                  >
                    <Trash2 class="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
    </template>
  </ul>
</template>
