<script setup lang="ts">
// Placeholder for ticket 10. The route exists so the list on `/` can link
// here today; the real fill-in/validate/submit UI ships with ticket 10.
import { useRoute } from 'vue-router';

const route = useRoute();
</script>

<template>
  <section class="space-y-4">
    <h1 class="text-2xl font-semibold tracking-tight">Preview</h1>
    <p class="text-neutral-600">
      Preview for form <code class="rounded bg-neutral-100 px-1">{{ route.params.id }}</code> is
      coming soon.
    </p>
    <router-link
      to="/"
      class="inline-block text-sm text-neutral-700 underline hover:text-neutral-900"
    >
      ← Back to forms
    </router-link>
  </section>
</template>
