<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>

<template>
  <div
    class="rounded-lg border border-border bg-surface-elevated shadow-sm"
    v-bind="$attrs"
  >
    <slot />
  </div>
</template>
