<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronRight } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '../stores/editor.ts';
import { usePreviewStore } from '../stores/preview.ts';
import { FOCUS_RING_CLASSES } from '../lib/focus-ring.ts';

const route = useRoute();
const editor = useEditorStore();
const preview = usePreviewStore();
const { template: editorTemplate } = storeToRefs(editor);
const { template: previewTemplate } = storeToRefs(preview);

const isHome = computed(() => route.name === 'home');
const isFormRoute = computed(
  () => route.name === 'form-edit' || route.name === 'form-preview',
);

const formId = computed(() => String(route.params.id ?? ''));

const formTitle = computed(() => {
  const fromEditor = editorTemplate.value;
  const fromPreview = previewTemplate.value;
  const template =
    fromEditor?.id === formId.value
      ? fromEditor
      : fromPreview?.id === formId.value
        ? fromPreview
        : (fromEditor ?? fromPreview);
  const title = template?.title?.trim();
  return title && title.length > 0 ? title : 'Formulario sin título';
});

const sectionLabel = computed(() =>
  route.name === 'form-preview' ? 'Vista previa' : 'Editor',
);

const formEditTo = computed(() => `/forms/${formId.value}/edit`);
</script>

<template>
  <nav class="min-w-0 text-sm" aria-label="Ruta de navegación">
    <!-- Home: current location only -->
    <span v-if="isHome" class="font-medium text-fg" aria-current="page">
      Formularios
    </span>

    <!-- Form routes: Forms / title / section -->
    <ol v-else-if="isFormRoute" class="flex min-w-0 items-center gap-1">
      <li class="hidden shrink-0 sm:block">
        <RouterLink
          to="/"
          class="rounded-md text-muted-fg hover:text-fg"
          :class="FOCUS_RING_CLASSES"
        >
          Formularios
        </RouterLink>
      </li>
      <li class="hidden shrink-0 sm:flex sm:items-center" aria-hidden="true">
        <ChevronRight class="size-3.5 text-muted-fg" />
      </li>
      <li class="min-w-0">
        <RouterLink
          :to="formEditTo"
          class="block truncate rounded-md text-muted-fg hover:text-fg"
          :class="FOCUS_RING_CLASSES"
          :title="formTitle"
        >
          {{ formTitle }}
        </RouterLink>
      </li>
      <li class="flex shrink-0 items-center" aria-hidden="true">
        <ChevronRight class="size-3.5 text-muted-fg" />
      </li>
      <li class="shrink-0">
        <span class="font-medium text-fg" aria-current="page">{{
          sectionLabel
        }}</span>
      </li>
    </ol>
  </nav>
</template>
