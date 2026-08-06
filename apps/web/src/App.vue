<script setup lang="ts">
import AppHeader from "./components/AppHeader.vue";
import { useTheme } from "./composables/useTheme.ts";

// Ensure theme class stays synced after the pre-paint boot script.
useTheme();
</script>

<template>
  <div class="flex min-h-full flex-col bg-surface text-fg">
    <AppHeader />
    <div class="flex-1">
      <RouterView />
    </div>
    <footer class="px-4 pb-4 pt-2 text-center sm:px-6 fixed bottom-0 w-full">
      <p class="text-xs tracking-wide text-muted-fg/60">crafted by mati</p>
    </footer>
  </div>
</template>
