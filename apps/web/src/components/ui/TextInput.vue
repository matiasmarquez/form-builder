<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { FOCUS_RING_CLASSES } from '../../lib/focus-ring.ts';

const props = withDefaults(
  defineProps<{
    variant?: 'bordered' | 'inline-borderless';
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

const variantClass = computed(() => {
  if (props.variant === 'inline-borderless') {
    return [
      'border-0 bg-transparent shadow-none cursor-text',
      'hover:bg-surface-hover',
      'focus-visible:bg-surface-hover',
    ].join(' ');
  }
  return 'border border-border-strong bg-surface-elevated';
});

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
    class="w-full rounded-md px-3 py-2 text-sm text-fg placeholder:text-muted-fg disabled:opacity-40"
    :class="[FOCUS_RING_CLASSES, variantClass, attrs.class]"
    v-bind="{ ...attrs, class: undefined }"
    @input="onInput"
    @blur="emit('blur', $event)"
  />
</template>
