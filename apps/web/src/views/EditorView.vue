<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useEditorStore } from "../stores/editor.ts";
import { useAutosaveStore } from "../stores/autosave.ts";
import { useAutosave } from "../composables/useAutosave.ts";
import { useUnsavedGuards } from "../composables/useUnsavedGuards.ts";
import { fetchTemplate, TemplateNotFoundError } from "../api.ts";
import EditorHeader from "../components/EditorHeader.vue";
import EditorToolbar from "../components/EditorToolbar.vue";
import FieldList from "../components/FieldList.vue";
import FieldPalette from "../components/FieldPalette.vue";
import Card from "../components/ui/Card.vue";
import Textarea from "../components/ui/Textarea.vue";
import TextInput from "../components/ui/TextInput.vue";

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
  if (key === "z") {
    event.preventDefault();
    store.flushCoalesce();
    if (event.shiftKey) {
      store.redo();
    } else {
      store.undo();
    }
    return;
  }
  if (key === "s") {
    event.preventDefault();
    void saveNow();
  }
}

onMounted(() => {
  void seedFromRoute();
  window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
watch(
  () => route.params.id,
  () => {
    void seedFromRoute();
  }
);
</script>

<template>
  <div
    class="editor-dot-grid min-h-screen px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-28"
  >
    <section v-if="template" class="mx-auto max-w-5xl space-y-4">
      <EditorToolbar />

      <div class="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card class="w-full shrink-0 p-4 lg:sticky lg:top-24 lg:w-56">
          <FieldPalette />
        </Card>

        <Card class="min-w-0 flex-1 space-y-6 p-5 sm:p-6">
          <div class="bg-surface/20 px-3 py-2 rounded-xl">
            <EditorHeader :on-save="saveNow" />
          </div>
          <div class="space-y-2">
            <TextInput
              variant="inline-borderless"
              class="px-2 py-1 -mx-2 text-2xl md:text-3xl font-semibold leading-tight tracking-tight"
              :model-value="template.title"
              placeholder="Formulario sin título"
              aria-label="Título del formulario"
              @update:model-value="store.setTitle($event)"
              @blur="store.flushCoalesce()"
            />
            <Textarea
              variant="inline-borderless"
              class="resize-none px-2 py-1 -mx-2 md:text-lg text-base"
              :rows="2"
              :model-value="template.description"
              placeholder="Agrega una descripción para quienes responden…"
              aria-label="Descripción del formulario"
              @update:model-value="store.setDescription($event)"
              @blur="store.flushCoalesce()"
            />
          </div>

          <FieldList />
        </Card>
      </div>
    </section>
  </div>
</template>
