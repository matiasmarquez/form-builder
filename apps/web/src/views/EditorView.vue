<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEditorStore } from '../stores/editor.ts';
import { useAutosaveStore } from '../stores/autosave.ts';
import { useAutosave } from '../composables/useAutosave.ts';
import { useUnsavedGuards } from '../composables/useUnsavedGuards.ts';
import { fetchTemplate, TemplateNotFoundError } from '../api.ts';
import EditorHeader from '../components/EditorHeader.vue';
import EditorToolbar from '../components/EditorToolbar.vue';
import FieldList from '../components/FieldList.vue';
import FieldPalette from '../components/FieldPalette.vue';
import Textarea from '../components/ui/Textarea.vue';
import TextInput from '../components/ui/TextInput.vue';

const route = useRoute();
const store = useEditorStore();
const autosave = useAutosaveStore();

const template = computed(() => store.template);

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
watch(
  () => route.params.id,
  () => {
    void seedFromRoute();
  },
);
</script>

<template>
  <div>
    <EditorToolbar />

    <div class="flex min-h-[calc(100vh-7.5rem)]">
      <aside
        class="hidden w-60 shrink-0 border-r border-border bg-surface-elevated p-4 lg:block"
      >
        <FieldPalette />
      </aside>

      <div class="min-w-0 flex-1 px-4 py-8 sm:px-6">
        <section v-if="template" class="mx-auto max-w-3xl space-y-6">
          <EditorHeader :on-save="saveNow" />

          <header class="space-y-3 border-b border-border pb-6">
            <label class="block">
              <span class="sr-only">Form title</span>
              <TextInput
                variant="inline-borderless"
                class="text-3xl font-semibold tracking-tight"
                :model-value="template.title"
                placeholder="Untitled Form"
                aria-label="Form title"
                @update:model-value="store.setTitle($event)"
                @blur="store.flushCoalesce()"
              />
            </label>
            <label class="block">
              <span class="sr-only">Form description</span>
              <Textarea
                variant="inline-borderless"
                class="resize-none text-sm"
                :rows="2"
                :model-value="template.description"
                placeholder="Add a description for respondents…"
                aria-label="Form description"
                @update:model-value="store.setDescription($event)"
                @blur="store.flushCoalesce()"
              />
            </label>
          </header>

          <FieldList />
        </section>
      </div>
    </div>
  </div>
</template>
