import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = dirname(fileURLToPath(import.meta.url));

// Default DB location: apps/api/data/form-builder.sqlite (gitignored via *.sqlite).
// Overridable with DATABASE_PATH for tests or alternative deployments.
const DEFAULT_DB_PATH = resolve(HERE, '..', 'data', 'form-builder.sqlite');

export function resolveDbPath(): string {
  return process.env.DATABASE_PATH
    ? resolve(process.env.DATABASE_PATH)
    : DEFAULT_DB_PATH;
}

export function openDatabase(path: string = resolveDbPath()): Database.Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initializeSchema(db);
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS form_templates (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT NOT NULL,
      body        TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    );
  `);
}
