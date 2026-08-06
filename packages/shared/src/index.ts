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

export const REQUIRED_FIELD_MESSAGE = 'This field is required';

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
 * Every field in the template is checked (visibility filtering is ticket 12).
 */
export function validateFormResponse(
  template: FormTemplate,
  response: FormResponse,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of template.fields) {
    const answer = response.answers[field.id];
    const empty = isEmptyAnswer(field, answer);
    const badMembership = hasInvalidOptionMembership(field, answer);
    if ((field.required && empty) || badMembership) {
      errors[field.id] = REQUIRED_FIELD_MESSAGE;
    }
  }
  return errors;
}
