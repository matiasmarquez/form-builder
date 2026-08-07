import type { Field, FormTemplate } from "@form-builder/shared";
import {
  AlignLeft,
  CircleCheckBig,
  SquareCheck,
  SquareChevronDown,
  Type,
} from "lucide-vue-next";
import type { Component } from "vue";

export function fieldTypeLabel(type: Field["type"]): string {
  switch (type) {
    case "text":
      return "Respuesta corta";
    case "paragraph":
      return "Párrafo";
    case "checkbox":
      return "Checkboxes";
    case "radio":
      return "Opción múltiple";
    case "select":
      return "Dropdown";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function fieldTypeIcon(type: Field["type"]): Component {
  switch (type) {
    case "text":
      return Type;
    case "paragraph":
      return AlignLeft;
    case "checkbox":
      return SquareCheck;
    case "radio":
      return CircleCheckBig;
    case "select":
      return SquareChevronDown;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/** Field ids that differ between two template snapshots (added, removed, or mutated). */
export function changedFieldIds(
  before: FormTemplate | null | undefined,
  after: FormTemplate | null | undefined
): string[] {
  if (!before || !after) return [];

  const beforeById = new Map(before.fields.map((f) => [f.id, f]));
  const afterById = new Map(after.fields.map((f) => [f.id, f]));
  const ids = new Set<string>([...beforeById.keys(), ...afterById.keys()]);
  const changed: string[] = [];

  for (const id of ids) {
    const a = beforeById.get(id);
    const b = afterById.get(id);
    if (!a || !b || !fieldsEqual(a, b)) {
      // Prefer ids that still exist after the history step (expandable in the list).
      if (b) changed.push(id);
      else if (a) {
        // Field was removed — nothing to expand; skip.
      }
    }
  }

  return changed;
}

function fieldsEqual(a: Field, b: Field): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const TEXT_FIELD_TYPES = [
  "text",
  "paragraph",
] as const satisfies ReadonlyArray<Field["type"]>;

export const MULTI_FIELD_TYPES = [
  "checkbox",
  "radio",
  "select",
] as const satisfies ReadonlyArray<Field["type"]>;
