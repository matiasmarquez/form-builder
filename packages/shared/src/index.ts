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
