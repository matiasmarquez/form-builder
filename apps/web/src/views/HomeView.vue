<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { FormTemplate } from '@form-builder/shared';
import { fetchTemplate } from '../api.ts';

const SEED_ID = 'seed-template-0001';

const template = ref<FormTemplate | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    template.value = await fetchTemplate(SEED_ID);
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
});
</script>

<template>
  <section>
    <p v-if="error" class="text-red-600" role="alert">{{ error }}</p>
    <p v-else-if="!template" class="text-neutral-500">Loading…</p>
    <h1 v-else class="text-3xl font-semibold tracking-tight">{{ template.title }}</h1>
  </section>
</template>
