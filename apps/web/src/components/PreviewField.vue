<script setup lang="ts">
import { computed } from 'vue';
import type { Answer, Field, OptionId } from '@form-builder/shared';
import { usePreviewStore } from '../stores/preview.ts';

const props = defineProps<{
  field: Field;
}>();

const store = usePreviewStore();

const controlId = computed(() => `field-${props.field.id}`);
const errorId = computed(() => `field-${props.field.id}-error`);
const descriptionId = computed(() => `field-${props.field.id}-description`);

const error = computed(() => store.fieldErrors[props.field.id]);

const describedBy = computed(() => {
  const ids: string[] = [];
  if (props.field.description) ids.push(descriptionId.value);
  if (error.value) ids.push(errorId.value);
  return ids.length > 0 ? ids.join(' ') : undefined;
});

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

const inputClass =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500';
</script>

<template>
  <div class="space-y-2">
    <div class="block">
      <label
        v-if="field.type !== 'radio' && field.type !== 'checkbox'"
        :for="controlId"
        class="text-base font-medium text-neutral-900"
      >
        {{ field.label || 'Untitled field' }}
        <span v-if="field.required" class="text-red-600" aria-hidden="true"> *</span>
        <span v-if="field.required" class="sr-only"> (required)</span>
      </label>
      <p
        v-else
        class="text-base font-medium text-neutral-900"
      >
        {{ field.label || 'Untitled field' }}
        <span v-if="field.required" class="text-red-600" aria-hidden="true"> *</span>
        <span v-if="field.required" class="sr-only"> (required)</span>
      </p>
    </div>

    <p
      v-if="field.description"
      :id="descriptionId"
      class="text-sm text-neutral-600"
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
      <option value="" disabled>Select an option</option>
      <option v-for="opt in field.options" :key="opt.id" :value="opt.id">
        {{ opt.label || 'Untitled option' }}
      </option>
    </select>

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
      <legend class="sr-only">{{ field.label || 'Untitled field' }}</legend>
      <label
        v-for="opt in field.options"
        :key="opt.id"
        class="flex items-center gap-2 text-sm text-neutral-800"
      >
        <input
          type="radio"
          :name="controlId"
          :value="opt.id"
          :checked="answer === opt.id"
          :aria-describedby="describedBy"
          :aria-invalid="error ? true : undefined"
          class="h-4 w-4 border-neutral-300"
          @change="onRadioChange(opt.id)"
        />
        <span>{{ opt.label || 'Untitled option' }}</span>
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
      <legend class="sr-only">{{ field.label || 'Untitled field' }}</legend>
      <label
        v-for="opt in field.options"
        :key="opt.id"
        class="flex items-center gap-2 text-sm text-neutral-800"
      >
        <input
          type="checkbox"
          :value="opt.id"
          :checked="Array.isArray(answer) && answer.includes(opt.id)"
          :aria-describedby="describedBy"
          :aria-invalid="error ? true : undefined"
          class="h-4 w-4 rounded border-neutral-300"
          @change="
            onCheckboxToggle(opt.id, ($event.target as HTMLInputElement).checked)
          "
        />
        <span>{{ opt.label || 'Untitled option' }}</span>
      </label>
    </fieldset>

    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="text-sm text-red-700"
    >
      {{ error }}
    </p>
  </div>
</template>
