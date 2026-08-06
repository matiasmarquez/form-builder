<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TemplateListItem } from '@form-builder/shared';
import { createTemplate, deleteTemplate, fetchTemplate, fetchTemplateList } from '../api.ts';
import { duplicateTemplate } from '../lib/duplicate.ts';

const router = useRouter();

type LoadState = 'loading' | 'ready' | 'error';

const state = ref<LoadState>('loading');
const errorMessage = ref<string | null>(null);
const templates = ref<TemplateListItem[]>([]);
// Separate from `errorMessage` (which is scoped to the initial load) so a
// failed delete surfaces inline on the row it belongs to and doesn't get
// mistaken for a load failure.
const deleteErrorMessage = ref<string | null>(null);
const deleteErrorId = ref<string | null>(null);
// Which row is currently in "confirm delete" mode. At most one at a time —
// clicking Delete on another row cancels the previous confirmation.
const confirmingId = ref<string | null>(null);
// Rows whose DELETE request is in flight; the button is disabled to prevent
// double-fires and the row stays visible until the request settles.
const deletingIds = ref<Set<string>>(new Set());
// Rows whose Duplicate request is in flight. Symmetrical with `deletingIds`
// — same reason (disable the trigger and surface a spinner label).
const duplicatingIds = ref<Set<string>>(new Set());
const duplicateErrorMessage = ref<string | null>(null);
const duplicateErrorId = ref<string | null>(null);

// Sort by updatedAt desc. The API already returns rows in that order, but
// sorting client-side too keeps the list stable if a delete or a future
// optimistic insert perturbs it.
const sortedTemplates = computed(() =>
  [...templates.value].sort((a, b) => b.updatedAt - a.updatedAt),
);

const isEmpty = computed(() => state.value === 'ready' && sortedTemplates.value.length === 0);

async function loadTemplates(): Promise<void> {
  state.value = 'loading';
  errorMessage.value = null;
  try {
    templates.value = await fetchTemplateList();
    state.value = 'ready';
  } catch (err) {
    state.value = 'error';
    errorMessage.value = err instanceof Error ? err.message : String(err);
  }
}

function newForm(): void {
  // Client-generated UUID per ADR-0004. Navigation happens immediately; the
  // editor treats the missing GET as "fresh unpersisted template" and lets
  // autosave create the row on the first mutation.
  const id = crypto.randomUUID();
  void router.push(`/forms/${id}/edit`);
}

function askDelete(id: string): void {
  confirmingId.value = id;
  if (deleteErrorId.value !== id) {
    deleteErrorMessage.value = null;
    deleteErrorId.value = null;
  }
}

function cancelDelete(): void {
  confirmingId.value = null;
  deleteErrorMessage.value = null;
  deleteErrorId.value = null;
}

async function confirmDelete(id: string): Promise<void> {
  deletingIds.value.add(id);
  deleteErrorMessage.value = null;
  deleteErrorId.value = null;
  try {
    await deleteTemplate(id);
    templates.value = templates.value.filter((t) => t.id !== id);
    confirmingId.value = null;
  } catch (err) {
    deleteErrorMessage.value = err instanceof Error ? err.message : String(err);
    deleteErrorId.value = id;
  } finally {
    deletingIds.value.delete(id);
  }
}

async function duplicate(id: string): Promise<void> {
  duplicatingIds.value.add(id);
  duplicateErrorMessage.value = null;
  duplicateErrorId.value = null;
  try {
    const source = await fetchTemplate(id);
    const copy = duplicateTemplate(source);
    await createTemplate(copy);
    templates.value = [
      ...templates.value,
      { id: copy.id, title: copy.title, updatedAt: copy.updatedAt },
    ];
  } catch (err) {
    duplicateErrorMessage.value = err instanceof Error ? err.message : String(err);
    duplicateErrorId.value = id;
  } finally {
    duplicatingIds.value.delete(id);
  }
}

function displayTitle(t: TemplateListItem): string {
  return t.title.trim() === '' ? 'Untitled Form' : t.title;
}

// Human-friendly relative timestamp for the list. Intentionally coarse — a
// row that says "Updated 3 minutes ago" is more useful in a list than a
// wall-clock time, and doesn't need to be exact.
function formatUpdatedAt(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.max(0, Math.round(diff / 1000));
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(ts).toLocaleDateString();
}

onMounted(() => {
  void loadTemplates();
});
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-3xl font-semibold tracking-tight">Form builder</h1>
      <button
        type="button"
        class="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        @click="newForm"
      >
        + New form
      </button>
    </div>

    <p v-if="state === 'loading'" class="text-sm text-neutral-500">Loading forms…</p>

    <div
      v-else-if="state === 'error'"
      class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
    >
      <p class="font-medium">Couldn't load forms.</p>
      <p v-if="errorMessage" class="mt-1 text-red-700">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-2 rounded-md border border-red-300 bg-white px-3 py-1 text-sm text-red-800 hover:bg-red-100"
        @click="loadTemplates"
      >
        Retry
      </button>
    </div>

    <div
      v-else-if="isEmpty"
      class="rounded-lg border border-dashed border-neutral-300 p-8 text-center"
    >
      <p class="text-neutral-700">No forms yet.</p>
      <p class="mt-1 text-sm text-neutral-500">
        Click <span class="font-medium">+ New form</span> to start building one.
      </p>
    </div>

    <ul v-else class="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
      <li
        v-for="t in sortedTemplates"
        :key="t.id"
        class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0 flex-1">
          <router-link
            :to="`/forms/${t.id}/edit`"
            class="block truncate text-base font-medium text-neutral-900 hover:underline"
          >
            {{ displayTitle(t) }}
          </router-link>
          <p class="mt-0.5 text-xs text-neutral-500">
            Updated {{ formatUpdatedAt(t.updatedAt) }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2 sm:justify-end">
          <router-link
            :to="`/forms/${t.id}/edit`"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50"
          >
            Edit
          </router-link>
          <router-link
            :to="`/forms/${t.id}/preview`"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50"
          >
            Preview
          </router-link>
          <button
            type="button"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
            :disabled="duplicatingIds.has(t.id)"
            :aria-label="`Duplicate ${displayTitle(t)}`"
            @click="duplicate(t.id)"
          >
            {{ duplicatingIds.has(t.id) ? 'Duplicating…' : 'Duplicate' }}
          </button>

          <template v-if="confirmingId === t.id">
            <span class="text-sm text-neutral-700">Delete this form?</span>
            <button
              type="button"
              class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              :disabled="deletingIds.has(t.id)"
              @click="confirmDelete(t.id)"
            >
              {{ deletingIds.has(t.id) ? 'Deleting…' : 'Confirm delete' }}
            </button>
            <button
              type="button"
              class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-800 hover:bg-neutral-50"
              :disabled="deletingIds.has(t.id)"
              @click="cancelDelete"
            >
              Cancel
            </button>
          </template>
          <button
            v-else
            type="button"
            class="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-red-300 hover:text-red-700"
            :aria-label="`Delete ${displayTitle(t)}`"
            @click="askDelete(t.id)"
          >
            Delete
          </button>
        </div>

        <p
          v-if="deleteErrorId === t.id && deleteErrorMessage"
          role="alert"
          class="text-xs text-red-700 sm:col-span-2"
        >
          Couldn't delete this form: {{ deleteErrorMessage }}
        </p>
        <p
          v-if="duplicateErrorId === t.id && duplicateErrorMessage"
          role="alert"
          class="text-xs text-red-700 sm:col-span-2"
        >
          Couldn't duplicate this form: {{ duplicateErrorMessage }}
        </p>
      </li>
    </ul>
  </section>
</template>
