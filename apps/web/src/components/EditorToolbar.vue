<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Eye, Pencil, Plus, Redo2, Undo2 } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '../stores/editor.ts';
import Button from './ui/Button.vue';
import Drawer from './ui/Drawer.vue';
import SegmentedNav from './ui/SegmentedNav.vue';
import FieldPalette from './FieldPalette.vue';

const route = useRoute();
const editor = useEditorStore();
const { canUndo, canRedo } = storeToRefs(editor);

const formId = computed(() => String(route.params.id));
const isEditorRoute = computed(() => route.name === 'form-edit');

const paletteOpen = ref(false);

const navItems = computed(() => [
  {
    to: `/forms/${formId.value}/edit`,
    label: 'Editor',
    icon: Pencil,
  },
  {
    to: `/forms/${formId.value}/preview`,
    label: 'Preview',
    icon: Eye,
  },
]);

function undo(): void {
  editor.flushCoalesce();
  editor.undo();
}

function redo(): void {
  editor.flushCoalesce();
  editor.redo();
}
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-6"
  >
    <SegmentedNav :items="navItems" />

    <div class="ml-auto flex items-center gap-2">
      <div
        v-if="isEditorRoute"
        class="inline-flex items-center rounded-full border border-border bg-surface-elevated"
      >
        <Button
          variant="ghost"
          icon-only
          size="md"
          :disabled="!canUndo"
          aria-label="Undo"
          class="rounded-full"
          @click="undo"
        >
          <Undo2 class="size-5" aria-hidden="true" />
        </Button>
        <span class="h-5 w-px bg-border" aria-hidden="true" />
        <Button
          variant="ghost"
          icon-only
          size="md"
          :disabled="!canRedo"
          aria-label="Redo"
          class="rounded-full"
          @click="redo"
        >
          <Redo2 class="size-5" aria-hidden="true" />
        </Button>
      </div>

      <Button
        v-if="isEditorRoute"
        variant="secondary"
        icon-only
        size="md"
        class="lg:hidden"
        aria-label="Add field"
        @click="paletteOpen = true"
      >
        <Plus class="size-5" aria-hidden="true" />
      </Button>
    </div>
  </div>

  <Drawer
    v-if="isEditorRoute"
    v-model:open="paletteOpen"
    title="Add field"
  >
    <FieldPalette />
  </Drawer>
</template>
