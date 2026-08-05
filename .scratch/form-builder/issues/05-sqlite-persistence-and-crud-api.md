# 05 — SQLite persistence and five CRUD routes on Hono

**What to build:** the real SQLite schema and five HTTP routes for `FormTemplate` persistence, replacing the hardcoded seeded template from ticket 01. Accepts client-assigned UUIDs. See ADR-0002 and ADR-0004.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] SQLite `form_templates` table with columns `id TEXT PRIMARY KEY`, `title TEXT`, `description TEXT`, `body JSON`, `created_at INTEGER`, `updated_at INTEGER`
- [ ] A migration or initialisation script creates the table on first API boot; the database file lives in a stable, documented location under the repo
- [ ] `GET /templates` returns a list of metadata only (`id`, `title`, `updated_at`) — no `body`
- [ ] `GET /templates/:id` returns the full template including its `body`
- [ ] `POST /templates` accepts a client-generated `id` in the payload, validates the payload with the shared Zod schema, and returns `409 Conflict` on duplicate primary key
- [ ] `PUT /templates/:id` replaces the whole template atomically and is idempotent; validates with the shared Zod schema
- [ ] `DELETE /templates/:id` removes the template
- [ ] All routes validate their payloads at the boundary using the schemas from `packages/shared`
- [ ] The API is manually verifiable with `curl` against a running dev server (a short section in the app README or an ADR-adjacent note is fine)
