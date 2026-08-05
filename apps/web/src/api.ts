import { formTemplateSchema, type FormTemplate } from '@form-builder/shared';

const API_BASE = '/api';

export async function fetchTemplate(id: string): Promise<FormTemplate> {
  const res = await fetch(`${API_BASE}/templates/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch template ${id}: ${res.status}`);
  }
  const json: unknown = await res.json();
  return formTemplateSchema.parse(json);
}
