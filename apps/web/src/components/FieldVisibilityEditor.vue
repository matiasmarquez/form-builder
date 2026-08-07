<script setup lang="ts">
import { computed } from "vue";
import type { Field, VisibilityRule } from "@form-builder/shared";
import { Eye, EyeOff } from "lucide-vue-next";
import { useEditorStore, isChoiceField } from "../stores/editor.ts";
import { FOCUS_RING_CLASSES } from "../lib/focus-ring.ts";
import Button from "./ui/Button.vue";

const props = defineProps<{
  fieldId: string;
}>();

const store = useEditorStore();

const field = computed<Field | undefined>(() =>
  store.template?.fields.find((f) => f.id === props.fieldId)
);

// Only fields that appear before this one in the list are eligible as
// sources — the runtime engine tolerates any DAG, but forward-only rules
// are the simplest mental model for the editor and prevent trivial cycles.
const sourceCandidates = computed<Field[]>(() => {
  const t = store.template;
  if (!t) return [];
  const idx = t.fields.findIndex((f) => f.id === props.fieldId);
  if (idx <= 0) return [];
  return t.fields
    .slice(0, idx)
    .filter((f) => isChoiceField(f) && f.options.length > 0);
});

const rule = computed<VisibilityRule | undefined>(
  () => field.value?.visibility
);

const sourceField = computed<Field | undefined>(() => {
  if (!rule.value) return undefined;
  return store.template?.fields.find((f) => f.id === rule.value!.sourceFieldId);
});

const hasEligibleSource = computed(() => sourceCandidates.value.length > 0);

const selectId = computed(() => `field-${props.fieldId}-visibility-source`);
const optionSelectId = computed(
  () => `field-${props.fieldId}-visibility-option`
);

function conditionKindFor(source: Field): "equals" | "includes" {
  return source.type === "checkbox" ? "includes" : "equals";
}

function onEnable(): void {
  const first = sourceCandidates.value[0];
  if (!first || !isChoiceField(first)) return;
  const opt = first.options[0];
  if (!opt) return;
  store.setFieldVisibility(props.fieldId, {
    sourceFieldId: first.id,
    condition: { kind: conditionKindFor(first), optionId: opt.id },
  });
}

function onDisable(): void {
  store.clearFieldVisibility(props.fieldId);
}

function onChangeSource(event: Event): void {
  const nextSourceId = (event.target as HTMLSelectElement).value;
  const nextSource = store.template?.fields.find((f) => f.id === nextSourceId);
  if (!nextSource || !isChoiceField(nextSource)) return;
  const opt = nextSource.options[0];
  if (!opt) return;
  store.setFieldVisibility(props.fieldId, {
    sourceFieldId: nextSource.id,
    condition: { kind: conditionKindFor(nextSource), optionId: opt.id },
  });
}

function onChangeOption(event: Event): void {
  const optionId = (event.target as HTMLSelectElement).value;
  const src = sourceField.value;
  if (!src || !isChoiceField(src)) return;
  store.setFieldVisibility(props.fieldId, {
    sourceFieldId: src.id,
    condition: { kind: conditionKindFor(src), optionId },
  });
}

const relationLabel = computed(() => {
  const src = sourceField.value;
  if (!src) return "es";
  return src.type === "checkbox" ? "incluye" : "es";
});

const selectClass = [
  "block w-full rounded-md border border-border-strong bg-surface px-2 py-1.5 text-sm text-fg",
  FOCUS_RING_CLASSES,
].join(" ");
</script>

<template>
  <div class="rounded-md border border-dashed border-border/70 p-3 space-y-2">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 text-sm font-medium text-fg">
        <component
          :is="rule ? Eye : EyeOff"
          class="size-4 text-muted-fg"
          aria-hidden="true"
        />
        <span>Visibilidad condicional</span>
      </div>
      <Button
        v-if="!rule"
        variant="ghost"
        size="sm"
        :disabled="!hasEligibleSource"
        @click="onEnable"
      >
        Agregar regla
      </Button>
      <Button v-else variant="ghost" size="sm" @click="onDisable">
        Quitar regla
      </Button>
    </div>

    <p
      v-if="!rule && !hasEligibleSource"
      class="text-xs leading-relaxed text-muted-fg"
    >
      Agrega antes un campo de opción múltiple, Dropdown o Checkboxes para condicionar este
      campo según su respuesta.
    </p>

    <div
      v-else-if="rule && sourceField && isChoiceField(sourceField)"
      class="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
    >
      <label class="sr-only" :for="selectId">Campo de origen</label>
      <select
        :id="selectId"
        :class="selectClass"
        :value="rule.sourceFieldId"
        @change="onChangeSource"
        class="bg-surface/20"
      >
        <option
          v-for="candidate in sourceCandidates"
          :key="candidate.id"
          :value="candidate.id"
        >
          {{ candidate.label || "Campo sin título" }}
        </option>
      </select>

      <span class="text-xs text-muted-fg text-center">{{ relationLabel }}</span>

      <label class="sr-only" :for="optionSelectId">Opción</label>
      <select
        :id="optionSelectId"
        :class="selectClass"
        :value="rule.condition.optionId"
        @change="onChangeOption"
        class="bg-surface/20"
      >
        <option
          v-for="opt in sourceField.options"
          :key="opt.id"
          :value="opt.id"
        >
          {{ opt.label || "Opción sin título" }}
        </option>
      </select>
    </div>
  </div>
</template>
