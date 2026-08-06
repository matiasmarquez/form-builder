<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { cn } from '../../lib/cn.ts';
import {
  textControlVariants,
  type TextControlVariants,
} from './variants.ts';

const props = withDefaults(
  defineProps<{
    variant?: NonNullable<TextControlVariants['variant']>;
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
    rows?: number;
  }>(),
  {
    variant: 'bordered',
    disabled: false,
    rows: 3,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  input: [event: Event];
}>();

const attrs = useAttrs();

const classes = computed(() =>
  cn(
    textControlVariants({ variant: props.variant }),
    'resize-y',
    attrs.class as string | undefined,
  ),
);

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value);
  emit('input', event);
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <textarea
    :id="id"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :class="classes"
    v-bind="{ ...attrs, class: undefined }"
    @input="onInput"
    @blur="emit('blur', $event)"
  />
</template>
