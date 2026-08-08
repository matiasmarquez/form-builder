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
      class="mx-auto max-w-5xl space-y-6 px-4 pb-8 pt-20 sm:px-0 sm:pb-10 sm:pt-28"
    >
      <EditorToolbar />

      <Alert v-if="loadState === 'loading'" variant="info">
        Cargando vista previa…
      </Alert>

      <Alert v-else-if="loadState === 'not-found'" variant="info">
        <p class="font-medium">Formulario no encontrado.</p>
        <p class="mt-1 text-muted-fg">
          Es posible que este formulario se haya eliminado.
        </p>
      </Alert>

      <Alert v-else-if="loadState === 'error'" variant="danger">
        <p class="font-medium">No se pudo cargar este formulario.</p>
        <p v-if="loadError" class="mt-1">{{ loadError }}</p>
        <Button
          variant="secondary"
          size="sm"
          class="mt-3"
          @click="seedFromRoute"
        >
          Reintentar
        </Button>
      </Alert>

      <Card
        v-else-if="store.isSubmitted && template"
        class="mx-auto max-w-md space-y-4 p-8 text-center"
        role="status"
      >
        <PartyPopper class="mx-auto size-16 text-primary" aria-hidden="true" />
        <h1 class="text-2xl font-semibold leading-tight tracking-tight text-fg">
          Respuesta registrada
        </h1>
        <p class="text-sm leading-relaxed text-muted-fg">
          Esto es una vista previa: no se envió ningún dato.
        </p>
        <Button variant="primary" @click="store.loadTemplate(template)">
          Enviar otra respuesta
        </Button>
        <div>
          <RouterLink
            to="/"
            class="rounded-md text-sm leading-relaxed text-primary hover:underline focus-ring"
          >
            ← Volver a formularios
          </RouterLink>
        </div>
      </Card>

      <form
        v-else-if="template"
        class="space-y-8 mx-auto max-w-3xl border border-border rounded-lg p-4 bg-surface-elevated/80"
        novalidate
        @submit="onSubmit"
      >
        <header class="space-y-2 border-b border-border pb-6">
          <h1
            class="md:text-3xl text-2xl font-semibold leading-tight tracking-tight text-fg"
          >
            {{ template.title || "Formulario sin título" }}
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
          Este formulario todavía no tiene campos.
        </div>

        <div v-else class="space-y-8">
          <PreviewField
            v-for="field in store.visibleFields"
            :key="field.id"
            :field="field"
          />
        </div>

        <div class="pt-2 text-right">
          <Button type="submit" variant="primary" size="md">Enviar</Button>
        </div>
      </form>
    </section>
  </div>
</template>
