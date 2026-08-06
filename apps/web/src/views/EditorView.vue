<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { Field } from '@form-builder/shared';
import { useEditorStore } from '../stores/editor.ts';
import { useAutosaveStore } from '../stores/autosave.ts';
import { useAutosave } from '../composables/useAutosave.ts';
import { useUnsavedGuards } from '../composables/useUnsavedGuards.ts';
import { fetchTemplate, TemplateNotFoundError } from '../api.ts';
import EditorHeader from '../components/EditorHeader.vue';

const route = useRoute();
const store = useEditorStore();
const autosave = useAutosaveStore();

const template = computed(() => store.template);
const fields = computed<Field[]>(() => store.template?.fields ?? []);

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

// Exhaustive human label — the `never` fallthrough forces this to be updated
// whenever a new variant is added to the Field discriminated union.
function fieldTypeLabel(type: Field['type']): string {
  switch (type) {
    case 'text':
      return 'Short answer';
    case 'paragraph':
      return 'Paragraph';
    case 'checkbox':
      return 'Checkboxes';
    case 'radio':
      return 'Multiple choice';
    case 'select':
      return 'Dropdown';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
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

    <ul class="space-y-4">
      <li
        v-for="field in fields"
        :key="field.id"
        class="rounded-lg border border-neutral-200 bg-white p-5 space-y-3 shadow-sm"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 space-y-1">
            <div class="text-xs uppercase tracking-wide text-neutral-500">
              {{ fieldTypeLabel(field.type) }}
            </div>
            <label class="block">
              <span class="sr-only">Field label</span>
              <input
                :value="field.label"
                @input="store.setFieldLabel(field.id, ($event.target as HTMLInputElement).value)"
                @blur="store.flushCoalesce()"
                class="w-full bg-transparent text-lg font-medium outline-none placeholder:text-neutral-400"
                placeholder="Question"
                :aria-label="`Label for field ${field.id}`"
              />
            </label>
          </div>
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
            @blur="store.flushCoalesce()"
            class="w-full bg-transparent text-sm text-neutral-600 outline-none placeholder:text-neutral-400"
            placeholder="Helper description (optional)"
          />
        </label>

        <!-- Variant-specific body. The `field.type === '…'` guards drive TS to
             narrow `field` to the correct variant, giving us exhaustive strict
             typing at each branch. -->
        <template v-if="field.type === 'text'">
          <input
            :value="field.placeholder ?? ''"
            @input="store.setTextFieldPlaceholder(field.id, ($event.target as HTMLInputElement).value)"
            @blur="store.flushCoalesce()"
            class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none placeholder:text-neutral-400"
            placeholder="Placeholder shown to respondents"
          />
        </template>

        <template v-else-if="field.type === 'paragraph'">
          <textarea
            :value="field.placeholder ?? ''"
            @input="store.setTextFieldPlaceholder(field.id, ($event.target as HTMLTextAreaElement).value)"
            @blur="store.flushCoalesce()"
            class="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 resize-none"
            rows="3"
            placeholder="Placeholder shown to respondents"
          ></textarea>
        </template>

        <template v-else-if="field.type === 'checkbox' || field.type === 'radio' || field.type === 'select'">
          <ul class="space-y-2" :aria-label="`Options for ${field.label || 'untitled field'}`">
            <li
              v-for="(option, index) in field.options"
              :key="option.id"
              class="flex items-center gap-2"
            >
              <span
                v-if="field.type === 'radio'"
                class="h-4 w-4 rounded-full border border-neutral-300 shrink-0"
                aria-hidden="true"
              ></span>
              <span
                v-else-if="field.type === 'checkbox'"
                class="h-4 w-4 rounded border border-neutral-300 shrink-0"
                aria-hidden="true"
              ></span>
              <span
                v-else
                class="w-6 text-right text-xs text-neutral-500 shrink-0"
                aria-hidden="true"
                >{{ index + 1 }}.</span
              >
              <input
                :value="option.label"
                @input="
                  store.setFieldOptionLabel(
                    field.id,
                    option.id,
                    ($event.target as HTMLInputElement).value,
                  )
                "
                @blur="store.flushCoalesce()"
                class="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 border-b border-transparent focus:border-neutral-300 py-1"
                :placeholder="`Option ${index + 1}`"
                :aria-label="`Option ${index + 1} label`"
              />
              <button
                type="button"
                @click="store.deleteFieldOption(field.id, option.id)"
                :disabled="field.options.length <= 1"
                class="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-40 disabled:hover:text-neutral-400"
                :aria-label="`Delete option ${option.label || index + 1}`"
              >
                Remove
              </button>
            </li>
          </ul>
          <button
            type="button"
            @click="store.addFieldOption(field.id)"
            class="text-sm text-neutral-600 hover:text-neutral-900"
          >
            + Add option
          </button>
        </template>

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
