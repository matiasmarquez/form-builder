<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { TextField } from '@form-builder/shared';
import { useEditorStore } from '../stores/editor.ts';

const route = useRoute();
const store = useEditorStore();

const template = computed(() => store.template);
const textFields = computed<TextField[]>(() =>
  (store.template?.fields ?? []).filter((f): f is TextField => f.type === 'text'),
);

function seedFromRoute(): void {
  const id = String(route.params.id);
  store.initializeTemplate(id);
}

onMounted(seedFromRoute);
watch(() => route.params.id, seedFromRoute);
</script>

<template>
  <section v-if="template" class="space-y-8">
    <header class="space-y-3 border-b border-neutral-200 pb-6">
      <label class="block">
        <span class="sr-only">Form title</span>
        <input
          :value="template.title"
          @input="store.setTitle(($event.target as HTMLInputElement).value)"
          class="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none focus:ring-0 placeholder:text-neutral-400"
          placeholder="Untitled Form"
          aria-label="Form title"
        />
      </label>
      <label class="block">
        <span class="sr-only">Form description</span>
        <textarea
          :value="template.description"
          @input="store.setDescription(($event.target as HTMLTextAreaElement).value)"
          class="w-full bg-transparent text-base text-neutral-700 outline-none resize-none placeholder:text-neutral-400"
          rows="2"
          placeholder="Add a description for respondents…"
          aria-label="Form description"
        ></textarea>
      </label>
    </header>

    <ul class="space-y-4">
      <li
        v-for="field in textFields"
        :key="field.id"
        class="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <label class="flex-1">
            <span class="sr-only">Field label</span>
            <input
              :value="field.label"
              @input="store.setFieldLabel(field.id, ($event.target as HTMLInputElement).value)"
              class="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-400"
              placeholder="Question"
              :aria-label="`Label for field ${field.id}`"
            />
          </label>
          <button
            type="button"
            @click="store.deleteField(field.id)"
            class="text-sm text-neutral-500 hover:text-red-600"
            :aria-label="`Delete field ${field.label || 'untitled'}`"
          >
            Delete
          </button>
        </div>

        <label class="block">
          <span class="sr-only">Helper description</span>
          <input
            :value="field.description ?? ''"
            @input="store.setFieldDescription(field.id, ($event.target as HTMLInputElement).value)"
            class="w-full bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400"
            placeholder="Helper description (optional)"
          />
        </label>

        <input
          :value="field.placeholder ?? ''"
          @input="store.setTextFieldPlaceholder(field.id, ($event.target as HTMLInputElement).value)"
          class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
          placeholder="Placeholder shown to respondents"
        />

        <label class="inline-flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            :checked="field.required"
            @change="store.setFieldRequired(field.id, ($event.target as HTMLInputElement).checked)"
          />
          Required
        </label>
      </li>
    </ul>

    <button
      type="button"
      @click="store.addTextField()"
      class="rounded-md border border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 w-full"
    >
      + Add text field
    </button>
  </section>
</template>
