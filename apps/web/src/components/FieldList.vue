<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { Field } from "@form-builder/shared";
import {
  Asterisk,
  ChevronUp,
  GripVertical,
  Info,
  List,
  Pencil,
  Trash2,
} from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useEditorStore, isChoiceField } from "../stores/editor.ts";
import { useReorderableList } from "../composables/useReorderableList.ts";
import { fieldTypeIcon, fieldTypeLabel } from "../lib/field-type-meta.ts";
import { FOCUS_RING_CLASSES } from "../lib/focus-ring.ts";
import FieldOptionList from "./FieldOptionList.vue";
import Badge from "./ui/Badge.vue";
import Button from "./ui/Button.vue";
import TextInput from "./ui/TextInput.vue";

const store = useEditorStore();
const { historyFocusFieldIds, historyFocusToken } = storeToRefs(store);

const fieldIds = computed<string[]>(
  () => store.template?.fields.map((f) => f.id) ?? []
);
const expandedIds = ref<Set<string>>(new Set());
// null until the first snapshot for the current template — that snapshot stays collapsed.
const knownIds = ref<Set<string> | null>(null);

watch(
  () => store.template?.id,
  () => {
    knownIds.value = null;
    expandedIds.value = new Set();
  }
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

watch(historyFocusToken, () => {
  if (historyFocusFieldIds.value.length === 0) return;
  const next = new Set(expandedIds.value);
  for (const id of historyFocusFieldIds.value) {
    next.add(id);
  }
  expandedIds.value = next;
  void nextTick(() => {
    const firstId = historyFocusFieldIds.value[0];
    if (!firstId) return;
    document.getElementById(bodyId(firstId))?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  });
});

const { parentRef, ids, moveByKeyboard, onHandleMouseDown } =
  useReorderableList({
    source: () => fieldIds.value,
    commit: (newOrder) => store.reorderFields(newOrder),
    dragHandle: "[data-field-handle]",
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
      `[data-field-handle="${fieldId}"]`
    );
    el?.focus();
  });
}

function onHandleKeydown(event: KeyboardEvent, fieldId: string): void {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    const dir = event.key === "ArrowUp" ? -1 : 1;
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

function labelInputId(fieldId: string): string {
  return `field-${fieldId}-label-input`;
}

function descriptionInputId(fieldId: string): string {
  return `field-${fieldId}-description-input`;
}

function placeholderInputId(fieldId: string): string {
  return `field-${fieldId}-placeholder-input`;
}

function requiredInputId(fieldId: string): string {
  return `field-${fieldId}-required`;
}
</script>

<template>
  <ul ref="parentRef" class="space-y-3" aria-label="Form fields">
    <template v-for="fieldId in ids" :key="fieldId">
      <li v-if="findField(fieldId)" class="relative flex items-stretch gap-2">
        <div
          class="min-w-0 flex-1 overflow-hidden rounded-md border transition-colors"
          :class="
            isExpanded(fieldId)
              ? 'border-border bg-surface/20'
              : 'border-border/80 bg-surface/20'
          "
        >
          <!-- Collapsed -->
          <div
            class="grid transition-[grid-template-rows] duration-200 ease-out"
            :style="{ gridTemplateRows: isExpanded(fieldId) ? '0fr' : '1fr' }"
            :inert="isExpanded(fieldId)"
          >
            <div class="overflow-hidden">
              <div
                class="relative flex items-center gap-2 px-3 py-2.5 pl-10 md:pl-3"
              >
                <button
                  type="button"
                  :data-field-handle="fieldId"
                  class="absolute left-2 top-1/2 inline-flex -translate-y-1/2 cursor-grab rounded text-muted-fg hover:text-fg md:static md:translate-y-0"
                  :class="FOCUS_RING_CLASSES"
                  :aria-label="`Reorder field ${findField(fieldId)!.label || 'untitled'}. Use arrow up and down to move.`"
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  @mousedown="onHandleMouseDown"
                  @keydown="onHandleKeydown($event, fieldId)"
                >
                  <GripVertical class="size-5 opacity-30" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="flex min-w-0 flex-1 items-center cursor-pointer gap-2 rounded-md text-left"
                  :class="FOCUS_RING_CLASSES"
                  :aria-expanded="false"
                  :aria-controls="bodyId(fieldId)"
                  @click="expand(fieldId)"
                >
                  <component
                    :is="fieldTypeIcon(findField(fieldId)!.type)"
                    class="size-4 shrink-0 text-muted-fg"
                    aria-hidden="true"
                  />
                  <span
                    class="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-fg"
                  >
                    {{ findField(fieldId)!.label || "Untitled field" }}
                  </span>
                  <span class="flex shrink-0 items-center gap-2">
                    <span
                      v-if="findField(fieldId)!.description"
                      class="sr-only"
                    >
                      Has description.
                    </span>
                    <Info
                      v-if="findField(fieldId)!.description"
                      class="size-4 text-muted-fg"
                      aria-hidden="true"
                    />
                    <Badge
                      v-if="isChoiceField(findField(fieldId)!)"
                      variant="neutral"
                      class="inline-flex items-center gap-1 normal-case tracking-normal"
                    >
                      <List class="size-3" aria-hidden="true" />
                      <span class="tabular-nums">{{
                        optionCount(findField(fieldId)!)
                      }}</span>
                      <span class="sr-only"> options</span>
                    </Badge>
                    <span v-if="findField(fieldId)!.required" class="sr-only">
                      Required.
                    </span>
                    <Asterisk
                      v-if="findField(fieldId)!.required"
                      class="size-4 text-danger"
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <Button
                  variant="ghost"
                  icon-only
                  size="sm"
                  :aria-label="`Edit field ${findField(fieldId)!.label || 'untitled'}`"
                  class="text-muted-fg/80 hover:text-fg"
                  @click.stop="expand(fieldId)"
                >
                  <Pencil class="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  icon-only
                  size="sm"
                  class="text-muted-fg/80 hover:text-danger"
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
            :inert="!isExpanded(fieldId)"
          >
            <div class="overflow-hidden">
              <div class="space-y-3 px-3 py-3 pl-10 md:p-4">
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
                    <label
                      class="inline-flex items-center gap-2 text-sm leading-relaxed text-fg"
                      :for="requiredInputId(fieldId)"
                    >
                      <input
                        :id="requiredInputId(fieldId)"
                        type="checkbox"
                        class="rounded border-border-strong"
                        :class="FOCUS_RING_CLASSES"
                        :checked="findField(fieldId)!.required"
                        @change="
                          store.setFieldRequired(
                            fieldId,
                            ($event.target as HTMLInputElement).checked
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

                <div class="block space-y-1.5">
                  <label
                    class="block text-sm font-medium leading-snug text-fg"
                    :for="labelInputId(fieldId)"
                  >
                    Question
                  </label>
                  <TextInput
                    :id="labelInputId(fieldId)"
                    variant="bordered"
                    class="text-base font-medium"
                    :model-value="findField(fieldId)!.label"
                    placeholder="Untitled field"
                    @update:model-value="store.setFieldLabel(fieldId, $event)"
                    @blur="store.flushCoalesce()"
                  />
                </div>

                <div class="block space-y-1.5">
                  <label
                    class="block text-sm font-medium leading-snug text-fg"
                    :for="descriptionInputId(fieldId)"
                  >
                    Helper text
                  </label>
                  <TextInput
                    :id="descriptionInputId(fieldId)"
                    variant="bordered"
                    :model-value="findField(fieldId)!.description ?? ''"
                    placeholder="Optional"
                    @update:model-value="
                      store.setFieldDescription(fieldId, $event)
                    "
                    @blur="store.flushCoalesce()"
                  />
                </div>

                <template
                  v-if="
                    findField(fieldId)!.type === 'text' ||
                    findField(fieldId)!.type === 'paragraph'
                  "
                >
                  <div class="block space-y-1.5">
                    <label
                      class="block text-sm font-medium leading-snug text-fg"
                      :for="placeholderInputId(fieldId)"
                    >
                      Placeholder
                    </label>
                    <TextInput
                      :id="placeholderInputId(fieldId)"
                      variant="bordered"
                      :model-value="
                        (
                          findField(fieldId) as Extract<
                            Field,
                            { type: 'text' | 'paragraph' }
                          >
                        ).placeholder ?? ''
                      "
                      placeholder="Shown to respondents"
                      @update:model-value="
                        store.setTextFieldPlaceholder(fieldId, $event)
                      "
                      @blur="store.flushCoalesce()"
                    />
                  </div>
                </template>

                <template
                  v-else-if="
                    findField(fieldId)!.type === 'checkbox' ||
                    findField(fieldId)!.type === 'radio' ||
                    findField(fieldId)!.type === 'select'
                  "
                >
                  <div class="space-y-2">
                    <span class="block text-sm font-medium leading-snug text-fg"
                      >Options</span
                    >
                    <FieldOptionList
                      :field-id="fieldId"
                      :field-label="findField(fieldId)!.label"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      @click="store.addFieldOption(fieldId)"
                    >
                      + Add option
                    </Button>
                  </div>
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
