<script setup lang="ts">
import { computed } from 'vue';
import { Moon, Sun } from 'lucide-vue-next';
import { useTheme } from '../../composables/useTheme.ts';
import Button from './Button.vue';

const { effective, toggle } = useTheme();

const isDark = computed(() => effective.value === 'dark');
const label = computed(() =>
  isDark.value ? 'Switch to light theme' : 'Switch to dark theme',
);
</script>

<template>
  <Button
    variant="ghost"
    icon-only
    size="md"
    :aria-label="label"
    :aria-pressed="isDark"
    @click="toggle"
  >
    <Sun v-if="isDark" class="size-5" aria-hidden="true" />
    <Moon v-else class="size-5" aria-hidden="true" />
  </Button>
</template>
