<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { PartyPopper } from "lucide-vue-next";
import { fetchTemplate, TemplateNotFoundError } from "../api.ts";
import PreviewField from "../components/PreviewField.vue";
import EditorToolbar from "../components/EditorToolbar.vue";
import Alert from "../components/ui/Alert.vue";
import Button from "../components/ui/Button.vue";
import Card from "../components/ui/Card.vue";
import { usePreviewStore } from "../stores/preview.ts";
import { FOCUS_RING_CLASSES } from "../lib/focus-ring.ts";

const route = useRoute();
const store = usePreviewStore();

type LoadState = "loading" | "ready" | "not-found" | "error";

const loadState = ref<LoadState>("loading");
const loadError = ref<string | null>(null);

const template = computed(() => store.template);

async function seedFromRoute(): Promise<void> {
  const id = String(route.params.id);
  loadState.value = "loading";
  loadError.value = null;
  try {
    const existing = await fetchTemplate(id);
    store.loadTemplate(existing);
    loadState.value = "ready";
  } catch (err) {
    if (err instanceof TemplateNotFoundError) {
      loadState.value = "not-found";
      return;
    }
    loadState.value = "error";
    loadError.value = err instanceof Error ? err.message : String(err);
  }
}

function focusFirstInvalid(): void {
  const fieldId = store.firstInvalidFieldId();
  if (!fieldId) return;
  void nextTick(() => {
    const root = document.getElementById(`field-${fieldId}`);
    if (!root) return;
    root.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = root.matches("input, textarea, select")
      ? root
      : root.querySelector<HTMLElement>("input, textarea, select");
    focusable?.focus();
  });
}

function onSubmit(event: Event): void {
  event.preventDefault();
  const ok = store.submit();
  if (!ok) {
    focusFirstInvalid();
  }
}

onMounted(() => {
  void seedFromRoute();
});

watch(
  () => route.params.id,
  () => {
    void seedFromRoute();
  }
);
</script>

<template>
  <div>
    <section
      class="mx-auto max-w-5xl space-y-6 px-4 pb-8 pt-20 sm:px-0 sm:pb-10 sm:pt-24"
    >
      <EditorToolbar />

      <Alert v-if="loadState === 'loading'" variant="info">
        Loading preview…
      </Alert>

      <Alert v-else-if="loadState === 'not-found'" variant="info">
        <p class="font-medium">Form not found.</p>
        <p class="mt-1 text-muted-fg">This form may have been deleted.</p>
      </Alert>

      <Alert v-else-if="loadState === 'error'" variant="danger">
        <p class="font-medium">Couldn't load this form.</p>
        <p v-if="loadError" class="mt-1">{{ loadError }}</p>
        <Button
          variant="secondary"
          size="sm"
          class="mt-3"
          @click="seedFromRoute"
        >
          Retry
        </Button>
      </Alert>

      <Card
        v-else-if="store.isSubmitted && template"
        class="mx-auto max-w-md space-y-4 p-8 text-center"
        role="status"
      >
        <PartyPopper class="mx-auto size-16 text-primary" aria-hidden="true" />
        <h1 class="text-2xl font-semibold leading-tight tracking-tight text-fg">
          Response recorded
        </h1>
        <p class="text-sm leading-relaxed text-muted-fg">
          This is a preview — no data was actually submitted.
        </p>
        <Button variant="primary" @click="store.loadTemplate(template)">
          Submit another response
        </Button>
        <div>
          <RouterLink
            to="/"
            class="rounded-md text-sm leading-relaxed text-primary hover:underline"
            :class="FOCUS_RING_CLASSES"
          >
            ← Back to forms
          </RouterLink>
        </div>
      </Card>

      <form
        v-else-if="template"
        class="space-y-8 mx-auto max-w-3xl"
        novalidate
        @submit="onSubmit"
      >
        <header class="space-y-2 border-b border-border pb-6">
          <h1 class="text-3xl font-semibold leading-tight tracking-tight text-fg">
            {{ template.title || "Untitled Form" }}
          </h1>
          <p
            v-if="template.description"
            class="whitespace-pre-wrap text-sm leading-relaxed text-muted-fg"
          >
            {{ template.description }}
          </p>
        </header>

        <div
          v-if="template.fields.length === 0"
          class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-fg"
        >
          This form has no fields yet.
        </div>

        <div v-else class="space-y-8">
          <PreviewField
            v-for="field in template.fields"
            :key="field.id"
            :field="field"
          />
        </div>

        <div class="pt-2">
          <Button type="submit" variant="primary" size="md">Submit</Button>
        </div>
      </form>
    </section>
  </div>
</template>
