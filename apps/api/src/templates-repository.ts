import type Database from 'better-sqlite3';
import type { Field, FormTemplate, TemplateListItem } from '@form-builder/shared';

interface TemplateRow {
  id: string;
  title: string;
  description: string;
  body: string;
  created_at: number;
  updated_at: number;
}

function rowToTemplate(row: TemplateRow): FormTemplate {
  const fields = JSON.parse(row.body) as Field[];
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    fields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DuplicateTemplateIdError extends Error {
  constructor(public readonly id: string) {
    super(`Template with id ${id} already exists`);
    this.name = 'DuplicateTemplateIdError';
  }
}

export class TemplatesRepository {
  constructor(private readonly db: Database.Database) {}

  list(): TemplateListItem[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, updated_at FROM form_templates ORDER BY updated_at DESC`,
      )
      .all() as Array<Pick<TemplateRow, 'id' | 'title' | 'updated_at'>>;
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
    }));
  }

  get(id: string): FormTemplate | null {
    const row = this.db
      .prepare(`SELECT * FROM form_templates WHERE id = ?`)
      .get(id) as TemplateRow | undefined;
    return row ? rowToTemplate(row) : null;
  }

  // Inserts a new template. Throws DuplicateTemplateIdError if `id` is taken.
  create(template: FormTemplate): FormTemplate {
    const existing = this.db
      .prepare(`SELECT 1 FROM form_templates WHERE id = ?`)
      .get(template.id);
    if (existing) {
      throw new DuplicateTemplateIdError(template.id);
    }
    this.db
      .prepare(
        `INSERT INTO form_templates (id, title, description, body, created_at, updated_at)
         VALUES (@id, @title, @description, @body, @created_at, @updated_at)`,
      )
      .run({
        id: template.id,
        title: template.title,
        description: template.description,
        body: JSON.stringify(template.fields),
        created_at: template.createdAt,
        updated_at: template.updatedAt,
      });
    return template;
  }

  // Replaces the whole template atomically. Idempotent: repeated calls with the
  // same input produce the same stored state.
  replace(template: FormTemplate): FormTemplate {
    this.db
      .prepare(
        `INSERT INTO form_templates (id, title, description, body, created_at, updated_at)
         VALUES (@id, @title, @description, @body, @created_at, @updated_at)
         ON CONFLICT(id) DO UPDATE SET
           title       = excluded.title,
           description = excluded.description,
           body        = excluded.body,
           created_at  = excluded.created_at,
           updated_at  = excluded.updated_at`,
      )
      .run({
        id: template.id,
        title: template.title,
        description: template.description,
        body: JSON.stringify(template.fields),
        created_at: template.createdAt,
        updated_at: template.updatedAt,
      });
    return template;
  }

  delete(id: string): boolean {
    const info = this.db
      .prepare(`DELETE FROM form_templates WHERE id = ?`)
      .run(id);
    return info.changes > 0;
  }
}
