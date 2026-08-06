<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    variant?: 'neutral' | 'primary' | 'danger';
  }>(),
  {
    variant: 'neutral',
  },
);

const variantClass = computed(() => {
  switch (props.variant) {
    case 'neutral':
      return 'bg-surface text-muted-fg';
    case 'primary':
      return 'bg-primary/15 text-primary';
    case 'danger':
      return 'bg-danger/15 text-danger';
    default: {
      const _exhaustive: never = props.variant;
      return _exhaustive;
    }
  }
});
</script>

<template>
  <span
    class="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
    :class="variantClass"
  >
    <slot />
  </span>
</template>
