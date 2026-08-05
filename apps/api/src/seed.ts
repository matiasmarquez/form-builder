import type { FormTemplate } from '@form-builder/shared';

export const SEEDED_TEMPLATE_ID = 'seed-template-0001';

export const seededTemplate: FormTemplate = {
  id: SEEDED_TEMPLATE_ID,
  title: 'Seeded Form Template',
  description: 'A hardcoded template used to verify the end-to-end wiring.',
  fields: [
    {
      id: 'seed-field-name',
      type: 'text',
      label: 'Your name',
      required: true,
      placeholder: 'Ada Lovelace',
    },
    {
      id: 'seed-field-color',
      type: 'radio',
      label: 'Favorite color',
      required: false,
      options: [
        { id: 'seed-opt-red', label: 'Red' },
        { id: 'seed-opt-blue', label: 'Blue' },
      ],
    },
  ],
  createdAt: 0,
  updatedAt: 0,
};
