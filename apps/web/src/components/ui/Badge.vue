<script setup lang="ts">
import { badgeVariants, type BadgeVariants } from './variants.ts';

withDefaults(
  defineProps<{
    variant?: NonNullable<BadgeVariants['variant']>;
  }>(),
  {
    variant: 'neutral',
  },
);
</script>

<template>
  <span :class="badgeVariants({ variant })">
    <slot />
  </span>
</template>
