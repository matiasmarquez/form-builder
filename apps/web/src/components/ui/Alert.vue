<script setup lang="ts">
import { computed } from 'vue';
import { alertVariants, type AlertVariants } from './variants.ts';

const props = withDefaults(
  defineProps<{
    variant?: NonNullable<AlertVariants['variant']>;
  }>(),
  {
    variant: 'info',
  },
);

const role = computed(() => (props.variant === 'info' ? undefined : 'alert'));
</script>

<template>
  <div :class="alertVariants({ variant })" :role="role">
    <slot />
  </div>
</template>
