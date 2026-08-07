import { describe, expect, it } from 'vitest';
import {
  validateFormResponse,
  type FormResponse,
  type FormTemplate,
} from './index';

const REQUIRED_MSG = 'Este campo es obligatorio';

function template(fields: FormTemplate['fields']): FormTemplate {
  return {
    id: 't1',
    title: 'Test',
    description: '',
    fields,
    createdAt: 0,
    updatedAt: 0,
  };
}

function response(answers: FormResponse['answers']): FormResponse {
  return { templateId: 't1', answers };
}

describe('validateFormResponse', () => {
  it('marks a required empty text field invalid', () => {
    const t = template([
      { id: 'f1', type: 'text', label: 'Name', required: true },
    ]);

    const errors = validateFormResponse(t, response({ f1: '' }));

    expect(errors).toEqual({ f1: REQUIRED_MSG });
  });

  it('accepts a filled required text field', () => {
    const t = template([
      { id: 'f1', type: 'text', label: 'Name', required: true },
    ]);

    const errors = validateFormResponse(t, response({ f1: 'Ada' }));

    expect(errors).toEqual({});
  });

  it('accepts an empty optional field', () => {
    const t = template([
      { id: 'f1', type: 'text', label: 'Nickname', required: false },
    ]);

    const errors = validateFormResponse(t, response({ f1: '' }));

    expect(errors).toEqual({});
  });

  it('marks a required empty paragraph field invalid', () => {
    const t = template([
      { id: 'f1', type: 'paragraph', label: 'Bio', required: true },
    ]);

    expect(validateFormResponse(t, response({ f1: '  ' }))).toEqual({
      f1: REQUIRED_MSG,
    });
  });

  it('marks a required empty radio field invalid', () => {
    const t = template([
      {
        id: 'f1',
        type: 'radio',
        label: 'Color',
        required: true,
        options: [
          { id: 'o1', label: 'Red' },
          { id: 'o2', label: 'Blue' },
        ],
      },
    ]);

    expect(validateFormResponse(t, response({ f1: '' }))).toEqual({
      f1: REQUIRED_MSG,
    });
  });

  it('marks a required empty checkbox field invalid', () => {
    const t = template([
      {
        id: 'f1',
        type: 'checkbox',
        label: 'Tags',
        required: true,
        options: [
          { id: 'o1', label: 'A' },
          { id: 'o2', label: 'B' },
        ],
      },
    ]);

    expect(validateFormResponse(t, response({ f1: [] }))).toEqual({
      f1: REQUIRED_MSG,
    });
  });

  it('rejects a radio OptionId that is not in the field options', () => {
    const t = template([
      {
        id: 'f1',
        type: 'radio',
        label: 'Color',
        required: false,
        options: [{ id: 'o1', label: 'Red' }],
      },
    ]);

    expect(validateFormResponse(t, response({ f1: 'ghost' }))).toEqual({
      f1: REQUIRED_MSG,
    });
  });

  it('rejects a checkbox OptionId that is not in the field options', () => {
    const t = template([
      {
        id: 'f1',
        type: 'checkbox',
        label: 'Tags',
        required: false,
        options: [{ id: 'o1', label: 'A' }],
      },
    ]);

    expect(validateFormResponse(t, response({ f1: ['o1', 'ghost'] }))).toEqual({
      f1: REQUIRED_MSG,
    });
  });

  it('accepts valid select and checkbox answers', () => {
    const t = template([
      {
        id: 'f1',
        type: 'select',
        label: 'Size',
        required: true,
        options: [
          { id: 's', label: 'S' },
          { id: 'l', label: 'L' },
        ],
      },
      {
        id: 'f2',
        type: 'checkbox',
        label: 'Extras',
        required: true,
        options: [
          { id: 'x', label: 'X' },
          { id: 'y', label: 'Y' },
        ],
      },
    ]);

    expect(
      validateFormResponse(
        t,
        response({ f1: 'l', f2: ['x', 'y'] }),
      ),
    ).toEqual({});
  });
});
