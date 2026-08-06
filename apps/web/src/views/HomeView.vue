<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { TemplateListItem } from '@form-builder/shared';
import { Copy, Eye, Pencil, Plus, Trash2 } from 'lucide-vue-next';
import { createTemplate, deleteTemplate, fetchTemplate, fetchTemplateList } from '../api.ts';
import { duplicateTemplate } from '../lib/duplicate.ts';
import Alert from '../components/ui/Alert.vue';
import Button from '../components/ui/Button.vue';
import Card from '../components/ui/Card.vue';

const router = useRouter();

type LoadState = 'loading' | 'ready' | 'error';

const state = ref<LoadState>('loading');
const errorMessage = ref<string | null>(null);
const templates = ref<TemplateListItem[]>([]);
const deleteErrorMessage = ref<string | null>(null);
const deleteErrorId = ref<string | null>(null);
const confirmingId = ref<string | null>(null);
const deletingIds = ref<Set<string>>(new Set());
const duplicatingIds = ref<Set<string>>(new Set());
const duplicateErrorMessage = ref<string | null>(null);
const duplicateErrorId = ref<string | null>(null);

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
  <section class="mx-auto max-w-5xl space-y-6 px-4 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24">
    <div class="flex items-center justify-end gap-4">
      <Button variant="primary" @click="newForm">
        <Plus class="size-4" aria-hidden="true" />
        New form
      </Button>
    </div>

    <p v-if="state === 'loading'" class="text-sm text-muted-fg">Loading forms…</p>

    <Alert v-else-if="state === 'error'" variant="danger">
      <p class="font-medium">Couldn't load forms.</p>
      <p v-if="errorMessage" class="mt-1">{{ errorMessage }}</p>
      <Button variant="secondary" size="sm" class="mt-3" @click="loadTemplates">
        Retry
      </Button>
    </Alert>

    <Card
      v-else-if="isEmpty"
      class="border-dashed p-8 text-center"
    >
      <p class="text-fg">No forms yet.</p>
      <p class="mt-1 text-sm text-muted-fg">
        Click <span class="font-medium">+ New form</span> to start building one.
      </p>
      <Button variant="primary" class="mt-4" @click="newForm">
        <Plus class="size-4" aria-hidden="true" />
        New form
      </Button>
    </Card>

    <ul
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      <li v-for="t in sortedTemplates" :key="t.id">
        <Card class="flex h-full flex-col gap-4 p-4">
          <div class="min-w-0 flex-1">
            <h2 class="line-clamp-2 text-base font-medium text-fg">
              {{ displayTitle(t) }}
            </h2>
            <p class="mt-1 text-xs uppercase tracking-wide text-muted-fg">
              Updated {{ formatUpdatedAt(t.updatedAt) }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <template v-if="confirmingId === t.id">
              <span class="mr-1 text-sm text-fg">Delete this form?</span>
              <Button
                variant="danger"
                size="sm"
                :disabled="deletingIds.has(t.id)"
                @click="confirmDelete(t.id)"
              >
                {{ deletingIds.has(t.id) ? 'Deleting…' : 'Confirm' }}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                :disabled="deletingIds.has(t.id)"
                @click="cancelDelete"
              >
                Cancel
              </Button>
            </template>
            <template v-else>
              <Button
                variant="ghost"
                icon-only
                size="md"
                :aria-label="`Edit ${displayTitle(t)}`"
                @click="router.push(`/forms/${t.id}/edit`)"
              >
                <Pencil class="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                icon-only
                size="md"
                :aria-label="`Preview ${displayTitle(t)}`"
                @click="router.push(`/forms/${t.id}/preview`)"
              >
                <Eye class="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                icon-only
                size="md"
                :disabled="duplicatingIds.has(t.id)"
                :loading="duplicatingIds.has(t.id)"
                :aria-label="`Duplicate ${displayTitle(t)}`"
                @click="duplicate(t.id)"
              >
                <Copy class="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                icon-only
                size="md"
                class="text-danger hover:text-danger"
                :aria-label="`Delete ${displayTitle(t)}`"
                @click="askDelete(t.id)"
              >
                <Trash2 class="size-5" aria-hidden="true" />
              </Button>
            </template>
          </div>

          <p
            v-if="deleteErrorId === t.id && deleteErrorMessage"
            role="alert"
            class="text-xs text-danger-fg"
          >
            Couldn't delete this form: {{ deleteErrorMessage }}
          </p>
          <p
            v-if="duplicateErrorId === t.id && duplicateErrorMessage"
            role="alert"
            class="text-xs text-danger-fg"
          >
            Couldn't duplicate this form: {{ duplicateErrorMessage }}
          </p>
        </Card>
      </li>
    </ul>
  </section>
</template>
