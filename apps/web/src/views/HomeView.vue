<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function newForm(): void {
  const id = crypto.randomUUID();
  void router.push(`/forms/${id}/edit`);
}
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-3xl font-semibold tracking-tight">Form builder</h1>
    <button
      type="button"
      class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
      @click="newForm"
    >
      + New form
    </button>
  </section>
</template>
