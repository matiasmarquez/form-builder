<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEditorStore } from '../stores/editor.ts';
import { useAutosaveStore } from '../stores/autosave.ts';
import { useAutosave } from '../composables/useAutosave.ts';
import { useUnsavedGuards } from '../composables/useUnsavedGuards.ts';
import { fetchTemplate, TemplateNotFoundError } from '../api.ts';
import EditorHeader from '../components/EditorHeader.vue';
import FieldList from '../components/FieldList.vue';

const route = useRoute();
const store = useEditorStore();
const autosave = useAutosaveStore();

const template = computed(() => store.template);

// Load an existing template, or fall through to a fresh unpersisted template.
// A 404 for an unknown id is expected on the New-form path (the id is minted
// client-side, then the first save POSTs it into existence).
async function seedFromRoute(): Promise<void> {
  const id = String(route.params.id);
  try {
    const existing = await fetchTemplate(id);
    store.loadTemplate(existing);
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      store.initializeTemplate(id);
      return;
    }
    throw err;
  }
}

const { flushPending } = useAutosave();
useUnsavedGuards();

async function saveNow(): Promise<void> {
  store.flushCoalesce();
  try {
    if (autosave.enabled) {
      await flushPending();
    } else {
      await store.save();
    }
  } catch {
    // Errors already surface via saveStatus/lastSaveError in the header.
  }
}

// Cmd+Z / Ctrl+Z → undo, Cmd+Shift+Z / Ctrl+Shift+Z → redo.
// Cmd+S / Ctrl+S → save immediately (force-flush any pending debounce when
// autosave is on; direct save when autosave is off).
function onKeydown(event: KeyboardEvent): void {
  const mod = event.metaKey || event.ctrlKey;
  if (!mod) return;
  const key = event.key.toLowerCase();
  if (key === 'z') {
    event.preventDefault();
    store.flushCoalesce();
    if (event.shiftKey) {
      store.redo();
    } else {
      store.undo();
    }
    return;
  }
  if (key === 's') {
    event.preventDefault();
    void saveNow();
  }
}

onMounted(() => {
  void seedFromRoute();
  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
watch(() => route.params.id, () => {
  void seedFromRoute();
});

</script>

<template>
  <section v-if="template" class="space-y-8">
    <EditorHeader :on-save="saveNow" />
    <header class="space-y-3 border-b border-neutral-200 pb-6">
      <label class="block">
        <span class="sr-only">Form title</span>
        <input
          :value="template.title"
          @input="store.setTitle(($event.target as HTMLInputElement).value)"
          @blur="store.flushCoalesce()"
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
          @blur="store.flushCoalesce()"
          class="w-full bg-transparent text-base text-neutral-700 outline-none resize-none placeholder:text-neutral-400"
          rows="2"
          placeholder="Add a description for respondents…"
          aria-label="Form description"
        ></textarea>
      </label>
    </header>

    <FieldList />

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
      <button
        type="button"
        @click="store.addTextField()"
        class="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Short answer
      </button>
      <button
        type="button"
        @click="store.addParagraphField()"
        class="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Paragraph
      </button>
      <button
        type="button"
        @click="store.addCheckboxField()"
        class="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Checkboxes
      </button>
      <button
        type="button"
        @click="store.addRadioField()"
        class="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Multiple choice
      </button>
      <button
        type="button"
        @click="store.addSelectField()"
        class="rounded-md border border-dashed border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
      >
        + Dropdown
      </button>
    </div>
  </section>
</template>
