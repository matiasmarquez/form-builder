import type { Field, FormTemplate } from '@form-builder/shared';

// Deep-clones a `FormTemplate` and regenerates every stable id — the template
// id, each field id, and each `FieldOption` id — so the returned template is
// safe to persist as a brand-new row without colliding with the source. The
// source is not mutated.
//
// The `visibility` rule on a field references `sourceFieldId` and an
// `optionId`; we deliberately do NOT rewrite those. Field-id references would
// require a two-pass rewrite with an id map, and no ticket has asked for that
// yet — until then, the duplicated form intentionally drops visibility rules
// so it doesn't ship dangling references to the original's ids.
export function duplicateTemplate(source: FormTemplate): FormTemplate {
  const fields: Field[] = source.fields.map((field) => cloneField(field));
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: `${source.title} (copy)`,
    description: source.description,
    fields,
    createdAt: now,
    updatedAt: now,
  };
}

function cloneField(field: Field): Field {
  const base = {
    id: crypto.randomUUID(),
    label: field.label,
    description: field.description,
    required: field.required,
  };
  switch (field.type) {
    case 'text':
      return { ...base, type: 'text', placeholder: field.placeholder };
    case 'paragraph':
      return { ...base, type: 'paragraph', placeholder: field.placeholder };
    case 'checkbox':
      return {
        ...base,
        type: 'checkbox',
        options: field.options.map((o) => ({ id: crypto.randomUUID(), label: o.label })),
      };
    case 'radio':
      return {
        ...base,
        type: 'radio',
        options: field.options.map((o) => ({ id: crypto.randomUUID(), label: o.label })),
      };
    case 'select':
      return {
        ...base,
        type: 'select',
        options: field.options.map((o) => ({ id: crypto.randomUUID(), label: o.label })),
      };
  }
}
