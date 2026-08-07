<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import type { Component } from 'vue';

export interface SegmentedNavItem {
  to: string;
  label: string;
  icon?: Component;
}

const props = defineProps<{
  items: SegmentedNavItem[];
}>();

const route = useRoute();
const navRef = ref<HTMLElement | null>(null);
const indicatorStyle = ref({ width: '0px', transform: 'translateX(0px)' });

function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(to + '/');
}

async function updateIndicator(): Promise<void> {
  await nextTick();
  const root = navRef.value;
  if (!root) return;
  const active = root.querySelector<HTMLElement>('[aria-current="page"]');
  if (!active) {
    indicatorStyle.value = { width: '0px', transform: 'translateX(0px)' };
    return;
  }
  indicatorStyle.value = {
    width: `${active.offsetWidth}px`,
    transform: `translateX(${active.offsetLeft}px)`,
  };
}

onMounted(() => {
  void updateIndicator();
});

watch(
  () => route.path,
  () => {
    void updateIndicator();
  },
);

watch(
  () => props.items,
  () => {
    void updateIndicator();
  },
  { deep: true },
);
</script>

<template>
  <nav
    ref="navRef"
    class="relative inline-flex items-center rounded-full border border-border bg-surface-elevated p-1"
    aria-label="Secciones del editor"
  >
    <span
      class="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-primary transition-[transform,width] duration-200 ease-out"
      :style="indicatorStyle"
      aria-hidden="true"
    />
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium leading-snug transition-colors"
      :class="[
        'focus-ring',
        isActive(item.to) ? 'text-primary-fg' : 'text-muted-fg hover:text-fg',
      ]"
      :aria-current="isActive(item.to) ? 'page' : undefined"
    >
      <component
        :is="item.icon"
        v-if="item.icon"
        class="size-4 shrink-0"
        aria-hidden="true"
      />
      <span class="hidden sm:inline">{{ item.label }}</span>
      <span class="sr-only sm:hidden">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
