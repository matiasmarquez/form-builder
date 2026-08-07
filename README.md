# 📝 Form Builder

A Google Forms–style app: design templates in a Vue editor, fill them in preview mode, and persist everything with a small Hono + SQLite API.

## ✨ Tech stack

| Layer | Tools |
| --- | --- |
| 🖥️ Frontend | Vue 3, Vite, Pinia, Vue Router, Tailwind CSS |
| 🔌 Backend | Hono |
| 🗄️ Database | SQLite (via `better-sqlite3`) |
| 📦 Shared | TypeScript, Zod (`@form-builder/shared`) |
| 🧰 Monorepo | pnpm workspaces |

## 📋 Prerequisites

- **Node.js** 22+ (LTS is fine)
- **pnpm** 10+ — [`corepack enable`](https://pnpm.io/installation#using-corepack) or `npm i -g pnpm`

## 🚀 Setup & run

From the repo root:

```bash
# 1. Install dependencies
pnpm install

# 2. Start API + web together
pnpm dev
```

That boots both apps in parallel:

| App | URL |
| --- | --- |
| 🌐 Web (editor + preview) | http://localhost:5173 |
| 🛠️ API | http://localhost:3001 |

The Vite dev server proxies `/api` → the API, so the UI talks to the backend with no extra config. SQLite is created automatically on first boot at `apps/api/data/form-builder.sqlite`.

### Run pieces separately (optional)

```bash
pnpm --filter @form-builder/web dev   # frontend only
pnpm --filter @form-builder/api dev   # API only
```

## ✅ Useful scripts

```bash
pnpm build       # build all packages
pnpm typecheck   # TypeScript check across the monorepo

# frontend tests
pnpm --filter @form-builder/web test
```

Happy building! 🎉
