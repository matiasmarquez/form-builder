import {
  formTemplateSchema,
  templateListSchema,
  type FormTemplate,
  type TemplateListItem,
} from '@form-builder/shared';

const API_BASE = '/api';

export async function fetchTemplateList(): Promise<TemplateListItem[]> {
  const res = await fetch(`${API_BASE}/templates`);
  if (!res.ok) {
    throw new Error(`No se pudieron obtener los formularios: ${res.status}`);
  }
  const json: unknown = await res.json();
  return templateListSchema.parse(json);
}

export async function deleteTemplate(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${id}`, { method: 'DELETE' });
  // 404 is treated as success — the row is already gone, which is what the
  // caller wanted. Any other non-2xx is a real failure.
  if (!res.ok && res.status !== 404) {
    throw new Error(`No se pudo eliminar el formulario ${id}: ${res.status}`);
  }
}

export class TemplateNotFoundError extends Error {
  constructor(public readonly id: string) {
    super(`Formulario ${id} no encontrado`);
    this.name = 'TemplateNotFoundError';
  }
}

export async function fetchTemplate(id: string): Promise<FormTemplate> {
  const res = await fetch(`${API_BASE}/templates/${id}`);
  if (res.status === 404) {
    throw new TemplateNotFoundError(id);
  }
  if (!res.ok) {
    throw new Error(`No se pudo obtener el formulario ${id}: ${res.status}`);
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
    throw new Error(`No se pudo crear el formulario ${template.id}: ${res.status}`);
  }
}

export async function updateTemplate(template: FormTemplate): Promise<void> {
  const res = await fetch(`${API_BASE}/templates/${template.id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(template),
  });
  if (!res.ok) {
    throw new Error(`No se pudo actualizar el formulario ${template.id}: ${res.status}`);
  }
}
