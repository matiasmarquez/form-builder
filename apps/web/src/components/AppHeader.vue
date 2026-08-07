<script setup lang="ts">
import AppBreadcrumb from "./AppBreadcrumb.vue";
import ThemeToggle from "./ui/ThemeToggle.vue";
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-30 px-4 pt-3 sm:px-6">
    <div
      class="mx-auto flex h-12 max-w-5xl items-center rounded-full border border-border/60 bg-surface-elevated/70 px-3 shadow-sm backdrop-blur-md sm:h-14 sm:px-5 dark:bg-surface-elevated/60"
    >
      <div
        class="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[1fr_minmax(0,1.5fr)_1fr] sm:gap-4"
      >
        <div class="min-w-0 justify-self-start">
          <RouterLink
            to="/"
            class="block truncate rounded-md text-base font-semibold tracking-tight text-fg focus-ring sm:text-lg"
          >
            Cobre Forms
          </RouterLink>
        </div>

        <div class="flex min-w-0 justify-center">
          <AppBreadcrumb />
        </div>

        <div class="justify-self-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  </header>
</template>
