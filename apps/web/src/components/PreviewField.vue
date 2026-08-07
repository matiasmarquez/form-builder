<script setup lang="ts">
import { computed } from 'vue';
import type { Answer, Field, OptionId } from '@form-builder/shared';
import { usePreviewStore } from '../stores/preview.ts';

/** Build an `aria-describedby` value from optional element ids. */
function joinAriaDescribedBy(
  ...ids: Array<string | undefined | false | null>
): string | undefined {
  const present = ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
  return present.length > 0 ? present.join(' ') : undefined;
}

const props = defineProps<{
  field: Field;
}>();

const store = usePreviewStore();

const controlId = computed(() => `field-${props.field.id}`);
const errorId = computed(() => `field-${props.field.id}-error`);
const descriptionId = computed(() => `field-${props.field.id}-description`);

const error = computed(() => store.fieldErrors[props.field.id]);

const describedBy = computed(() =>
  joinAriaDescribedBy(
    props.field.description ? descriptionId.value : undefined,
    error.value ? errorId.value : undefined,
  ),
);

const answer = computed(() => store.answers[props.field.id]);

function onTextInput(event: Event): void {
  store.setAnswer(props.field.id, (event.target as HTMLInputElement | HTMLTextAreaElement).value);
}

function onSelectChange(event: Event): void {
  store.setAnswer(props.field.id, (event.target as HTMLSelectElement).value);
}

function onRadioChange(optionId: OptionId): void {
  store.setAnswer(props.field.id, optionId);
}

function onCheckboxToggle(optionId: OptionId, checked: boolean): void {
  const current = Array.isArray(answer.value) ? [...answer.value] : [];
  const next = checked
    ? current.includes(optionId)
      ? current
      : [...current, optionId]
    : current.filter((id) => id !== optionId);
  store.setAnswer(props.field.id, next as Answer);
}

function onBlur(event?: FocusEvent): void {
  // For radio/checkbox fieldsets, ignore focus moves between options inside
  // the same group so we only re-validate when the respondent leaves the group.
  if (event) {
    const current = event.currentTarget as Node | null;
    const next = event.relatedTarget as Node | null;
    if (current && next && current.contains(next)) return;
  }
  store.blurField(props.field.id);
}

const inputClass = [
  'w-full rounded-md border border-border-strong bg-surface-elevated px-3 py-2 text-sm leading-relaxed text-fg',
  'focus-ring',
].join(' ');

const choiceInputClass = [
  'h-4 w-4 border-border-strong text-primary',
  'focus-ring',
].join(' ');
</script>

<template>
  <div class="space-y-2">
    <template v-if="field.type !== 'radio' && field.type !== 'checkbox'">
      <label
        :for="controlId"
        class="block text-base font-medium leading-snug text-fg"
      >
        {{ field.label || 'Campo sin título' }}
        <span v-if="field.required" class="text-danger" aria-hidden="true"> *</span>
        <span v-if="field.required" class="sr-only"> (obligatorio)</span>
      </label>

      <p
        v-if="field.description"
        :id="descriptionId"
        class="text-sm leading-relaxed text-muted-fg"
      >
        {{ field.description }}
      </p>

      <!-- text -->
      <input
        v-if="field.type === 'text'"
        :id="controlId"
        type="text"
        :value="typeof answer === 'string' ? answer : ''"
        :placeholder="field.placeholder || undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :aria-required="field.required || undefined"
        :class="inputClass"
        @input="onTextInput"
        @blur="onBlur"
      />

      <!-- paragraph -->
      <textarea
        v-else-if="field.type === 'paragraph'"
        :id="controlId"
        rows="4"
        :value="typeof answer === 'string' ? answer : ''"
        :placeholder="field.placeholder || undefined"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :aria-required="field.required || undefined"
        :class="[inputClass, 'resize-y']"
        @input="onTextInput"
        @blur="onBlur"
      />

      <!-- select -->
      <select
        v-else-if="field.type === 'select'"
        :id="controlId"
        :value="typeof answer === 'string' ? answer : ''"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :aria-required="field.required || undefined"
        :class="inputClass"
        @change="onSelectChange"
        @blur="onBlur"
      >
        <option value="" disabled>Selecciona una opción</option>
        <option v-for="opt in field.options" :key="opt.id" :value="opt.id">
          {{ opt.label || 'Opción sin título' }}
        </option>
      </select>
    </template>

    <!-- radio -->
    <fieldset
      v-else-if="field.type === 'radio'"
      :id="controlId"
      class="space-y-2"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      :aria-required="field.required || undefined"
      @focusout="onBlur($event)"
    >
      <legend class="text-base font-medium leading-snug text-fg">
        {{ field.label || 'Campo sin título' }}
        <span v-if="field.required" class="text-danger" aria-hidden="true"> *</span>
        <span v-if="field.required" class="sr-only"> (obligatorio)</span>
      </legend>
      <p
        v-if="field.description"
        :id="descriptionId"
        class="text-sm leading-relaxed text-muted-fg"
      >
        {{ field.description }}
      </p>
      <label
        v-for="opt in field.options"
        :key="opt.id"
        class="flex items-center gap-2 text-sm leading-relaxed text-fg"
      >
        <input
          type="radio"
          :name="controlId"
          :value="opt.id"
          :checked="answer === opt.id"
          :aria-invalid="error ? true : undefined"
          :class="choiceInputClass"
          @change="onRadioChange(opt.id)"
        />
        <span>{{ opt.label || 'Opción sin título' }}</span>
      </label>
    </fieldset>

    <!-- checkbox -->
    <fieldset
      v-else-if="field.type === 'checkbox'"
      :id="controlId"
      class="space-y-2"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      :aria-required="field.required || undefined"
      @focusout="onBlur($event)"
    >
      <legend class="text-base font-medium leading-snug text-fg">
        {{ field.label || 'Campo sin título' }}
        <span v-if="field.required" class="text-danger" aria-hidden="true"> *</span>
        <span v-if="field.required" class="sr-only"> (obligatorio)</span>
      </legend>
      <p
        v-if="field.description"
        :id="descriptionId"
        class="text-sm leading-relaxed text-muted-fg"
      >
        {{ field.description }}
      </p>
      <label
        v-for="opt in field.options"
        :key="opt.id"
        class="flex items-center gap-2 text-sm leading-relaxed text-fg"
      >
        <input
          type="checkbox"
          :value="opt.id"
          :checked="Array.isArray(answer) && answer.includes(opt.id)"
          :aria-invalid="error ? true : undefined"
          :class="[choiceInputClass, 'rounded']"
          @change="
            onCheckboxToggle(opt.id, ($event.target as HTMLInputElement).checked)
          "
        />
        <span>{{ opt.label || 'Opción sin título' }}</span>
      </label>
    </fieldset>

    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm leading-relaxed text-danger-fg"
    >
      {{ error }}
    </p>
  </div>
</template>
