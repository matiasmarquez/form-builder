<script setup lang="ts">
import { computed } from "vue";
import type { FieldOption } from "@form-builder/shared";
import { useEditorStore, isChoiceField } from "../stores/editor.ts";
import { useReorderableList } from "../composables/useReorderableList.ts";
import Button from "./ui/Button.vue";

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

const { parentRef, ids, moveByKeyboard, onHandleMouseDown } =
  useReorderableList({
    source: () => optionIds.value,
    commit: (newOrder) => store.reorderFieldOptions(props.fieldId, newOrder),
    dragHandle: "[data-option-handle]",
  });

function findOption(id: string): FieldOption | undefined {
  const field = store.findField(props.fieldId);
  if (!field || !isChoiceField(field)) return undefined;
  return field.options.find((o) => o.id === id);
}

function optionIndex(id: string): number {
  return ids.value.indexOf(id);
}

function fieldType(): "checkbox" | "radio" | "select" | null {
  const field = store.findField(props.fieldId);
  if (!field || !isChoiceField(field)) return null;
  return field.type;
}

function optionLabelId(optionId: string): string {
  return `option-${props.fieldId}-${optionId}-label`;
}

// Move focus to the drag handle inside the item with the given option id.
// Called after a keyboard reorder so the user's focus tracks the moved item.
function refocusHandle(optionId: string): void {
  requestAnimationFrame(() => {
    const el = parentRef.value?.querySelector<HTMLButtonElement>(
      `[data-option-handle="${optionId}"]`
    );
    el?.focus();
  });
}

function onHandleKeydown(event: KeyboardEvent, optionId: string): void {
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
    const dir = event.key === "ArrowUp" ? -1 : 1;
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
    :aria-label="`Opciones de ${fieldLabel || 'campo sin título'}`"
  >
    <li
      v-for="(optionId, index) in ids"
      :key="optionId"
      class="flex items-center gap-2 border border-border px-2 py-1 rounded-md"
    >
      <button
        type="button"
        :data-option-handle="optionId"
        class="cursor-grab rounded px-1 text-muted-fg hover:text-fg focus-ring"
        :aria-label="`Reordenar opción ${
          optionIndex(optionId) + 1
        }. Usa flecha arriba y abajo para mover.`"
        aria-keyshortcuts="ArrowUp ArrowDown"
        @mousedown="onHandleMouseDown"
        @keydown="onHandleKeydown($event, optionId)"
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
      <span
        v-if="fieldType() === 'radio'"
        class="h-4 w-4 rounded-full border border-border-strong shrink-0"
        aria-hidden="true"
      ></span>
      <span
        v-else-if="fieldType() === 'checkbox'"
        class="h-4 w-4 rounded border border-border-strong shrink-0"
        aria-hidden="true"
      ></span>
      <span
        v-else
        class="w-6 shrink-0 text-right text-xs leading-relaxed text-muted-fg"
        aria-hidden="true"
        >{{ index + 1 }}.</span
      >
      <label :for="optionLabelId(optionId)" class="sr-only">
        Etiqueta de la opción {{ index + 1 }}
      </label>
      <input
        :id="optionLabelId(optionId)"
        :value="findOption(optionId)?.label ?? ''"
        class="flex-1 rounded-md border-b border-transparent bg-transparent py-1 text-sm leading-relaxed text-fg placeholder:text-muted-fg focus:border-border focus-ring"
        :placeholder="`Opción ${index + 1}`"
        @input="
          store.setFieldOptionLabel(
            fieldId,
            optionId,
            ($event.target as HTMLInputElement).value
          )
        "
        @blur="store.flushCoalesce()"
      />
      <Button
        variant="ghost"
        size="sm"
        class="text-xs text-muted-fg hover:text-danger"
        :disabled="!canDeleteMore"
        :aria-label="`Eliminar opción ${
          findOption(optionId)?.label || index + 1
        }`"
        @click="store.deleteFieldOption(fieldId, optionId)"
      >
        Quitar
      </Button>
    </li>
  </ul>
</template>
