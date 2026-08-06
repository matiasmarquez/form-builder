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
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    id?: string;
  }>(),
  {
    variant: 'bordered',
    type: 'text',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  blur: [event: FocusEvent];
  input: [event: Event];
}>();

const attrs = useAttrs();

const classes = computed(() =>
  cn(textControlVariants({ variant: props.variant }), attrs.class as string | undefined),
);

function onInput(event: Event): void {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
  emit('input', event);
}
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <input
    :id="id"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :class="classes"
    v-bind="{ ...attrs, class: undefined }"
    @input="onInput"
    @blur="emit('blur', $event)"
  />
</template>
