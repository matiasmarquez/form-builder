<script setup lang="ts">
import ThemeToggle from './ui/ThemeToggle.vue';
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-border bg-surface-elevated"
  >
    <div class="flex h-14 items-center justify-between px-4 sm:px-6">
      <RouterLink
        to="/"
        class="text-lg font-semibold tracking-tight text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface rounded-md"
      >
        Form builder
      </RouterLink>
      <ThemeToggle />
    </div>
  </header>
</template>
