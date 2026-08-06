<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTemplate, TemplateNotFoundError } from '../api.ts';
import PreviewField from '../components/PreviewField.vue';
import { usePreviewStore } from '../stores/preview.ts';

const route = useRoute();
const store = usePreviewStore();

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const loadState = ref<LoadState>('loading');
const loadError = ref<string | null>(null);

const template = computed(() => store.template);

async function seedFromRoute(): Promise<void> {
  const id = String(route.params.id);
  loadState.value = 'loading';
  loadError.value = null;
  try {
    const existing = await fetchTemplate(id);
    store.loadTemplate(existing);
    loadState.value = 'ready';
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      loadState.value = 'not-found';
      return;
    }
    loadState.value = 'error';
    loadError.value = err instanceof Error ? err.message : String(err);
  }
}

function focusFirstInvalid(): void {
  const fieldId = store.firstInvalidFieldId();
  if (!fieldId) return;
  void nextTick(() => {
    const root = document.getElementById(`field-${fieldId}`);
    if (!root) return;
    root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Prefer a focusable control inside fieldsets (radio/checkbox); otherwise
    // the root itself (input/textarea/select).
    const focusable = root.matches('input, textarea, select')
      ? root
      : root.querySelector<HTMLElement>('input, textarea, select');
    focusable?.focus();
  });
}

function onSubmit(event: Event): void {
  event.preventDefault();
  const ok = store.submit();
  if (!ok) {
    focusFirstInvalid();
  }
}

onMounted(() => {
  void seedFromRoute();
});

watch(
  () => route.params.id,
  () => {
    void seedFromRoute();
  },
);
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <router-link
        to="/"
        class="text-sm text-neutral-700 underline hover:text-neutral-900"
      >
        ← Back to forms
      </router-link>
      <router-link
        v-if="template"
        :to="`/forms/${template.id}/edit`"
        class="text-sm text-neutral-700 underline hover:text-neutral-900"
      >
        Edit form
      </router-link>
    </div>

    <p v-if="loadState === 'loading'" class="text-sm text-neutral-500">Loading preview…</p>

    <div
      v-else-if="loadState === 'not-found'"
      class="rounded-md border border-neutral-200 bg-white p-6 text-sm text-neutral-700"
    >
      <p class="font-medium">Form not found.</p>
      <p class="mt-1 text-neutral-500">This form may have been deleted.</p>
    </div>

    <div
      v-else-if="loadState === 'error'"
      class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p class="font-medium">Couldn't load this form.</p>
      <p v-if="loadError" class="mt-1 text-red-700">{{ loadError }}</p>
      <button
        type="button"
        class="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-sm text-red-800 hover:bg-red-100"
        @click="seedFromRoute"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="store.isSubmitted && template"
      class="rounded-lg border border-neutral-200 bg-white p-8 text-center space-y-3"
      role="status"
    >
      <h1 class="text-2xl font-semibold tracking-tight">Response recorded</h1>
      <p class="text-neutral-600">
        Thanks — your answers for “{{ template.title || 'Untitled Form' }}” were accepted.
        Nothing was sent to a server (preview only).
      </p>
      <button
        type="button"
        class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        @click="store.loadTemplate(template)"
      >
        Submit another response
      </button>
    </div>

    <form
      v-else-if="template"
      class="space-y-8"
      novalidate
      @submit="onSubmit"
    >
      <header class="space-y-2 border-b border-neutral-200 pb-6">
        <h1 class="text-3xl font-semibold tracking-tight">
          {{ template.title || 'Untitled Form' }}
        </h1>
        <p v-if="template.description" class="text-base text-neutral-600 whitespace-pre-wrap">
          {{ template.description }}
        </p>
      </header>

      <div
        v-if="template.fields.length === 0"
        class="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500"
      >
        This form has no fields yet.
      </div>

      <div v-else class="space-y-8">
        <PreviewField
          v-for="field in template.fields"
          :key="field.id"
          :field="field"
        />
      </div>

      <div class="pt-2">
        <button
          type="submit"
          class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Submit
        </button>
      </div>
    </form>
  </section>
</template>
