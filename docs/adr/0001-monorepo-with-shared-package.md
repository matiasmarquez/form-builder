# Monorepo with shared types package

The project has a Vue 3 frontend and a Hono + SQLite backend that exchange `FormTemplate` payloads at the API boundary. We use a pnpm monorepo with `apps/web`, `apps/api`, and `packages/shared` rather than a single repo with a `server/` folder.

`packages/shared` owns the `FormTemplate` / `Field` discriminated union and the Zod schemas both sides use to validate the same payloads — server at the API boundary, client at the store boundary and for preview validation. Duplicating those types across two roots, or reaching across roots with relative imports, would be the alternative; both are worse than the small ceremony of a workspace (one `pnpm-workspace.yaml`, three `package.json`s). `pnpm -r dev` runs both apps.

Reversing this later means merging two apps back into one and inlining the shared package — mechanical but tedious, and it would take the shared schemas with it.
