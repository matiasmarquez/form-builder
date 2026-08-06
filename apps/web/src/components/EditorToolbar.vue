<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { Eye, Pencil, Redo2, Undo2 } from "lucide-vue-next";
import { storeToRefs } from "pinia";
import { useEditorStore } from "../stores/editor.ts";
import Button from "./ui/Button.vue";
import SegmentedNav from "./ui/SegmentedNav.vue";

const route = useRoute();
const editor = useEditorStore();
const { canUndo, canRedo } = storeToRefs(editor);

const formId = computed(() => String(route.params.id));
const isEditorRoute = computed(() => route.name === "form-edit");

const navItems = computed(() => [
  {
    to: `/forms/${formId.value}/edit`,
    label: "Editor",
    icon: Pencil,
  },
  {
    to: `/forms/${formId.value}/preview`,
    label: "Preview",
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
  <div class="flex flex-wrap items-center gap-3">
    <SegmentedNav :items="navItems" />

    <div
      v-if="isEditorRoute"
      class="ml-auto inline-flex items-center rounded-full border border-border h-10 bg-surface-elevated shadow-sm"
    >
      <Button
        variant="ghost"
        icon-only
        size="md"
        :disabled="!canUndo"
        aria-label="Undo"
        class="rounded-l-full rounded-r-none"
        @click="undo"
      >
        <Undo2 class="size-4" aria-hidden="true" />
      </Button>
      <span class="h-5 w-px bg-border" aria-hidden="true" />
      <Button
        variant="ghost"
        icon-only
        size="md"
        :disabled="!canRedo"
        aria-label="Redo"
        class="rounded-r-full rounded-l-none"
        @click="redo"
      >
        <Redo2 class="size-4" aria-hidden="true" />
      </Button>
    </div>
  </div>
</template>
