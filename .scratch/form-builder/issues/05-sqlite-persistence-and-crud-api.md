# 05 — SQLite persistence and five CRUD routes on Hono

**What to build:** the real SQLite schema and five HTTP routes for `FormTemplate` persistence, replacing the hardcoded seeded template from ticket 01. Accepts client-assigned UUIDs. See ADR-0002 and ADR-0004.

**Blocked by:** 01.

**Status:** ready-for-human

- [x] SQLite `form_templates` table with columns `id TEXT PRIMARY KEY`, `title TEXT`, `description TEXT`, `body JSON`, `created_at INTEGER`, `updated_at INTEGER`
- [x] A migration or initialisation script creates the table on first API boot; the database file lives in a stable, documented location under the repo
- [x] `GET /templates` returns a list of metadata only (`id`, `title`, `updated_at`) — no `body`
- [x] `GET /templates/:id` returns the full template including its `body`
- [x] `POST /templates` accepts a client-generated `id` in the payload, validates the payload with the shared Zod schema, and returns `409 Conflict` on duplicate primary key
- [x] `PUT /templates/:id` replaces the whole template atomically and is idempotent; validates with the shared Zod schema
- [x] `DELETE /templates/:id` removes the template
- [x] All routes validate their payloads at the boundary using the schemas from `packages/shared`
- [x] The API is manually verifiable with `curl` against a running dev server (a short section in the app README or an ADR-adjacent note is fine)

## Comments

Implemented on `master`. Notes:

- Schema initialisation is inline in `openDatabase()` (`apps/api/src/db.ts`); the table is created via `CREATE TABLE IF NOT EXISTS` on first boot. No separate migration tool — the shape is document-shaped (see ADR-0002) and there is only one table, so a full migration framework would be premature.
- Default DB path: `apps/api/data/form-builder.sqlite` (gitignored via the repo-root `*.sqlite` rule). Overridable via `DATABASE_PATH` for tests and alternative deployments.
- `body` is stored as `TEXT` (`JSON.stringify(fields)`), not as a `JSON` column type — SQLite treats them equivalently and `TEXT` is portable across SQLite versions. The schema is still "hybrid" per ADR-0002.
- `PUT` is implemented as `INSERT ... ON CONFLICT(id) DO UPDATE` — one atomic statement, idempotent, and it lets a client force-flush its state without pre-checking existence.
- `PUT` rejects `path.id !== body.id` with `400` to prevent accidental cross-record writes.
- The hardcoded seeded template (`apps/api/src/seed.ts`) has been removed; the API now serves whatever is in the database.
- `README.md` under `apps/api/` documents storage, routes, and a full `curl` verification script.
