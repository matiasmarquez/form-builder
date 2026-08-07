import { z } from 'zod';

export type FieldId = string;
export type OptionId = string;

export const fieldOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type FieldOption = z.infer<typeof fieldOptionSchema>;

export const visibilityRuleSchema = z.object({
  sourceFieldId: z.string(),
  condition: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('equals'), optionId: z.string() }),
    z.object({ kind: z.literal('includes'), optionId: z.string() }),
  ]),
});
export type VisibilityRule = z.infer<typeof visibilityRuleSchema>;

const baseFieldShape = {
  id: z.string(),
  label: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  visibility: visibilityRuleSchema.optional(),
};

export const textFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('text'),
  placeholder: z.string().optional(),
});
export type TextField = z.infer<typeof textFieldSchema>;

export const paragraphFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('paragraph'),
  placeholder: z.string().optional(),
});
export type ParagraphField = z.infer<typeof paragraphFieldSchema>;

export const checkboxFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('checkbox'),
  options: z.array(fieldOptionSchema),
});
export type CheckboxField = z.infer<typeof checkboxFieldSchema>;

export const radioFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('radio'),
  options: z.array(fieldOptionSchema),
});
export type RadioField = z.infer<typeof radioFieldSchema>;

export const selectFieldSchema = z.object({
  ...baseFieldShape,
  type: z.literal('select'),
  options: z.array(fieldOptionSchema),
});
export type SelectField = z.infer<typeof selectFieldSchema>;

export const fieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  paragraphFieldSchema,
  checkboxFieldSchema,
  radioFieldSchema,
  selectFieldSchema,
]);
export type Field = z.infer<typeof fieldSchema>;

export interface BaseField {
  id: FieldId;
  label: string;
  description?: string;
  required: boolean;
  visibility?: VisibilityRule;
}

export const formTemplateSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  fields: z.array(fieldSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});
export type FormTemplate = z.infer<typeof formTemplateSchema>;

// Row shape returned by `GET /templates`. Intentionally narrower than
// `FormTemplate`: the list view only needs the label + timestamp to render
// each entry, so the API doesn't ship the (potentially large) `fields` blob.
export const templateListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.number(),
});
export type TemplateListItem = z.infer<typeof templateListItemSchema>;

export const templateListSchema = z.array(templateListItemSchema);

// --- Runtime: FormResponse / Answer ---

export const REQUIRED_FIELD_MESSAGE = 'Este campo es obligatorio';

/** Free-text answer for `text` / `paragraph` fields. */
export type TextAnswer = string;
/** Single-option answer for `radio` / `select` fields. */
export type SingleOptionAnswer = OptionId;
/** Multi-option answer for `checkbox` fields. */
export type MultiOptionAnswer = OptionId[];

export type Answer = TextAnswer | SingleOptionAnswer | MultiOptionAnswer;

export const formResponseSchema = z.object({
  templateId: z.string(),
  answers: z.record(z.union([z.string(), z.array(z.string())])),
});
export type FormResponse = z.infer<typeof formResponseSchema>;

export type FieldErrors = Record<FieldId, string>;

function isEmptyAnswer(field: Field, answer: Answer | undefined): boolean {
  if (answer === undefined) return true;
  switch (field.type) {
    case 'text':
    case 'paragraph':
      return typeof answer !== 'string' || answer.trim() === '';
    case 'radio':
    case 'select':
      return typeof answer !== 'string' || answer === '';
    case 'checkbox':
      return !Array.isArray(answer) || answer.length === 0;
  }
}

function hasInvalidOptionMembership(field: Field, answer: Answer | undefined): boolean {
  if (field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'select') {
    return false;
  }
  const validIds = new Set(field.options.map((o) => o.id));
  if (field.type === 'checkbox') {
    if (!Array.isArray(answer)) return false;
    return answer.some((id) => !validIds.has(id));
  }
  if (typeof answer !== 'string' || answer === '') return false;
  return !validIds.has(answer);
}

/**
 * Validate a `FormResponse` against its `FormTemplate`.
 *
 * Returns a map of `FieldId` → error message for every invalid field.
 * When `visibleFieldIds` is provided, fields not in the set are skipped —
 * hidden fields are excluded from validation even when `required` is true
 * (ADR-0005).
 */
export function validateFormResponse(
  template: FormTemplate,
  response: FormResponse,
  visibleFieldIds?: ReadonlySet<FieldId>,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of template.fields) {
    if (visibleFieldIds && !visibleFieldIds.has(field.id)) continue;
    const answer = response.answers[field.id];
    const empty = isEmptyAnswer(field, answer);
    const badMembership = hasInvalidOptionMembership(field, answer);
    if ((field.required && empty) || badMembership) {
      errors[field.id] = REQUIRED_FIELD_MESSAGE;
    }
  }
  return errors;
}

// --- Visibility (ADR-0005) ---

/**
 * Evaluate a single `VisibilityRule` against the current answers map.
 * Missing source answers evaluate to false ("not yet matched"), which is
 * what the fixed-point iteration relies on to converge on empty state.
 */
export function evaluateVisibilityRule(
  rule: VisibilityRule,
  answers: FormResponse['answers'],
): boolean {
  const src = answers[rule.sourceFieldId];
  if (src === undefined) return false;
  switch (rule.condition.kind) {
    case 'equals':
      return typeof src === 'string' && src === rule.condition.optionId;
    case 'includes':
      return Array.isArray(src) && src.includes(rule.condition.optionId);
  }
}

/**
 * Compute the set of currently-visible field ids by fixed-point iteration.
 *
 * A field with no rule is always visible. A field with a rule is visible iff
 * (a) the source field is currently visible AND (b) the rule evaluates true
 * against `answers`. Re-evaluated until stable so that cascading rules
 * converge — a hidden gate hides everything downstream.
 *
 * Assumes the rule graph is acyclic. Callers should run
 * `detectVisibilityCycle` at save time to keep this precondition true.
 */
export function computeVisibleFieldIds(
  template: FormTemplate,
  answers: FormResponse['answers'],
): Set<FieldId> {
  const visible = new Set<FieldId>(template.fields.map((f) => f.id));
  // Fixed-point: bounded by fields.length because each pass removes at
  // least one id or terminates. Extra +1 as a safety belt.
  const cap = template.fields.length + 1;
  for (let i = 0; i < cap; i++) {
    let changed = false;
    for (const field of template.fields) {
      if (!visible.has(field.id)) continue;
      const rule = field.visibility;
      if (!rule) continue;
      const sourceVisible = visible.has(rule.sourceFieldId);
      const passes = sourceVisible && evaluateVisibilityRule(rule, answers);
      if (!passes) {
        visible.delete(field.id);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return visible;
}

export interface VisibilityCycle {
  fieldIds: FieldId[];
}

/**
 * Detect a cycle in the visibility rule graph. Returns the first cycle
 * found (as the list of field ids on it) or `null` if the graph is a DAG.
 * Rules that reference an unknown source field are treated as leaves — they
 * cannot participate in a cycle. Save-time cycle detection lives here so
 * the API and the editor share the same rejection semantics.
 */
export function detectVisibilityCycle(template: FormTemplate): VisibilityCycle | null {
  const byId = new Map(template.fields.map((f) => [f.id, f] as const));

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<FieldId, number>();
  for (const f of template.fields) color.set(f.id, WHITE);

  const stack: FieldId[] = [];

  function visit(id: FieldId): VisibilityCycle | null {
    const c = color.get(id);
    if (c === BLACK) return null;
    if (c === GRAY) {
      const cycleStart = stack.indexOf(id);
      return { fieldIds: stack.slice(cycleStart >= 0 ? cycleStart : 0).concat(id) };
    }
    color.set(id, GRAY);
    stack.push(id);
    const field = byId.get(id);
    const source = field?.visibility?.sourceFieldId;
    if (source && byId.has(source)) {
      const c2 = visit(source);
      if (c2) return c2;
    }
    stack.pop();
    color.set(id, BLACK);
    return null;
  }

  for (const f of template.fields) {
    if (color.get(f.id) === WHITE) {
      const cycle = visit(f.id);
      if (cycle) return cycle;
    }
  }
  return null;
}
