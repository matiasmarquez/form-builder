<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { Loader2 } from "lucide-vue-next";
import { cn } from "../../lib/cn.ts";
import { buttonVariants, type ButtonVariants } from "./variants.ts";

const props = withDefaults(
  defineProps<{
    variant?: NonNullable<ButtonVariants["variant"]>;
    size?: NonNullable<ButtonVariants["size"]>;
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

const isDisabled = computed(() => props.disabled || props.loading);

const classes = computed(() =>
  cn(
    buttonVariants({
      variant: props.variant,
      size: props.size,
      iconOnly: props.iconOnly,
    }),
    attrs.class as string | undefined,
  ),
);
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
    :class="classes"
    v-bind="{ ...$attrs, class: undefined }"
  >
    <Loader2
      v-if="loading"
      class="size-4 animate-spin shrink-0"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
