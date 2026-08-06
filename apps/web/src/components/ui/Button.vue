<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { Loader2 } from "lucide-vue-next";
import { FOCUS_RING_CLASSES } from "../../lib/focus-ring.ts";

const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md";
    iconOnly?: boolean;
    loading?: boolean;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }>(),
  {
    variant: "primary",
    size: "md",
    iconOnly: false,
    loading: false,
    disabled: false,
    type: "button",
  }
);

const attrs = useAttrs();

const resolvedAriaLabel = computed(() => {
  const fromAttr = attrs["aria-label"];
  return typeof fromAttr === "string" && fromAttr.trim() !== ""
    ? fromAttr
    : undefined;
});

if (import.meta.env.DEV && props.iconOnly && !resolvedAriaLabel.value) {
  console.warn("[Button] iconOnly requires a non-empty aria-label");
}

const variantClass = computed(() => {
  switch (props.variant) {
    case "primary":
      return "bg-primary text-primary-fg hover:bg-primary-hover";
    case "secondary":
      return "border border-border-strong bg-surface-elevated text-fg hover:bg-surface-hover";
    case "ghost":
      return "bg-transparent text-fg hover:bg-surface-hover";
    case "danger":
      return "bg-danger text-white hover:opacity-90";
    default: {
      const _exhaustive: never = props.variant;
      return _exhaustive;
    }
  }
});

const sizeClass = computed(() => {
  if (props.iconOnly) {
    return props.size === "sm" ? "size-8" : "size-11";
  }
  return props.size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm";
});

const isDisabled = computed(() => props.disabled || props.loading);
</script>

<script lang="ts">
export default {
  inheritAttrs: false,
};
</script>

<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    class="inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer disabled:pointer-events-none"
    :class="[FOCUS_RING_CLASSES, variantClass, sizeClass]"
    v-bind="$attrs"
  >
    <Loader2
      v-if="loading"
      class="size-4 animate-spin shrink-0"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
