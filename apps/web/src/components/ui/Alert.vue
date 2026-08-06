<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'info' | 'warning' | 'danger' | 'success';
  }>(),
  {
    variant: 'info',
  },
);

const role = computed(() => (props.variant === 'info' ? undefined : 'alert'));

const variantClass = computed(() => {
  switch (props.variant) {
    case 'info':
      return 'border-border bg-surface-elevated text-fg';
    case 'warning':
      return 'border-warning/40 bg-warning/10 text-fg';
    case 'danger':
      return 'border-danger/30 bg-danger/10 text-danger-fg';
    case 'success':
      return 'border-primary/30 bg-primary/10 text-fg';
    default: {
      const _exhaustive: never = props.variant;
      return _exhaustive;
    }
  }
});
</script>

<template>
  <div
    class="rounded-lg border p-4 text-sm shadow-sm"
    :class="variantClass"
    :role="role"
  >
    <slot />
  </div>
</template>
