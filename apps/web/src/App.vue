<script setup lang="ts">
import AppHeader from './components/AppHeader.vue';
import { useTheme } from './composables/useTheme.ts';

// Ensure theme class stays synced after the pre-paint boot script.
useTheme();
</script>

<template>
  <div class="min-h-full bg-surface text-fg">
    <AppHeader />
    <RouterView />
  </div>
</template>
