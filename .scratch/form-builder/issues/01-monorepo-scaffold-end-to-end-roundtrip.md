# 01 — Monorepo scaffold with a live end-to-end round-trip

**What to build:** a pnpm monorepo whose web app fetches a hardcoded seeded `FormTemplate` from the Hono API and renders its title on screen. Both apps run under a single `pnpm -r dev`. This proves the shared-types wiring end-to-end before any real feature exists.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `pnpm-workspace.yaml` at the repo root with `apps/*` and `packages/*`
- [ ] `apps/web` scaffolded with Vue 3, `<script setup>`, TypeScript in strict mode, Vite, Pinia, vue-router, Tailwind v4, and the Outfit font wired in
- [ ] `apps/api` scaffolded with Hono and better-sqlite3, serving a single `GET /templates/:id` route that returns a hardcoded seeded `FormTemplate` from memory (no real database yet)
- [ ] `packages/shared` exports the `FormTemplate`, `Field` discriminated union, `FieldOption`, and Zod schemas that mirror them (matching the type surface in the spec)
- [ ] Both `apps/web` and `apps/api` import their types and schemas from `packages/shared` with no duplication
- [ ] `pnpm -r dev` starts both apps
- [ ] The web app fetches the seeded template on load and renders its title on the screen
- [ ] `apps/web` builds with `tsc --noEmit` passing under strict mode
