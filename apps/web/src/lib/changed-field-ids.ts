import type { Field, FormTemplate } from '@form-builder/shared';

/** Field ids that differ between two template snapshots (added, removed, or mutated). */
export function changedFieldIds(
  before: FormTemplate | null | undefined,
  after: FormTemplate | null | undefined,
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
