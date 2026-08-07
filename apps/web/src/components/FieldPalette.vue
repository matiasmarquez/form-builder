<script setup lang="ts">
import type { Field } from "@form-builder/shared";
import { Plus } from "lucide-vue-next";
import { useEditorStore } from "../stores/editor.ts";
import {
  MULTI_FIELD_TYPES,
  TEXT_FIELD_TYPES,
  fieldTypeIcon,
  fieldTypeLabel,
} from "../lib/field-type-meta.ts";
import Button from "./ui/Button.vue";

const store = useEditorStore();

function addField(type: Field["type"]): void {
  switch (type) {
    case "text":
      store.addTextField();
      break;
    case "paragraph":
      store.addParagraphField();
      break;
    case "checkbox":
      store.addCheckboxField();
      break;
    case "radio":
      store.addRadioField();
      break;
    case "select":
      store.addSelectField();
      break;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
</script>

<template>
  <div class="space-y-5">
    <h2
      class="text-base font-medium text-fg border-b border-border pb-4 -mx-4 px-4"
    >
      Add elements
    </h2>

    <div class="space-y-2">
      <h3 class="text-xs uppercase tracking-wide text-muted-fg">
        Text elements
      </h3>
      <div class="grid gap-1 grid-cols-1">
        <Button
          v-for="type in TEXT_FIELD_TYPES"
          :key="type"
          variant="ghost"
          class="group w-full justify-start text-sm font-medium"
          @click="addField(type)"
        >
          <component
            :is="fieldTypeIcon(type)"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate text-left">{{
            fieldTypeLabel(type)
          }}</span>
          <Plus
            class="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>

    <div class="space-y-2">
      <h3 class="text-xs uppercase tracking-wide text-muted-fg">
        Multi elements
      </h3>
      <div class="grid gap-1 sm:grid-cols-3 grid-cols-1">
        <Button
          v-for="type in MULTI_FIELD_TYPES"
          :key="type"
          variant="ghost"
          class="group w-full justify-start text-sm font-medium"
          @click="addField(type)"
        >
          <component
            :is="fieldTypeIcon(type)"
            class="size-4 shrink-0"
            aria-hidden="true"
          />
          <span class="min-w-0 flex-1 truncate text-left">{{
            fieldTypeLabel(type)
          }}</span>
          <Plus
            class="size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden="true"
          />
        </Button>
      </div>
    </div>
  </div>
</template>
