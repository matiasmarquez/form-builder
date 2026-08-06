import { formTemplateSchema, type FormTemplate } from '@form-builder/shared';

const API_BASE = '/api';

export class TemplateNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Template ${id} not found`);
    this.name = 'TemplateNotFoundError';
  }
}

export async function fetchTemplate(id: string): Promise<FormTemplate> {
  const res = await fetch(`${API_BASE}/templates/${id}`);
  if (res.status === 404) {
    throw new TemplateNotFoundError(id);
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch template ${id}: ${res.status}`);
  }
  const json: unknown = await res.json();
  return formTemplateSchema.parse(json);
}

export async function createTemplate(template: FormTemplate): Promise<void> {
  const res = await fetch(`${API_BASE}/templates`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    throw new Error(`Failed to create template ${template.id}: ${res.status}`);
  }
}

export async function updateTemplate(template: FormTemplate): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${template.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    throw new Error(`Failed to update template ${template.id}: ${res.status}`);
  }
}
