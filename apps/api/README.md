# @form-builder/api

Hono + SQLite backend that persists `FormTemplate`s.

## Storage

SQLite database, one table: `form_templates`.

| Column        | Type                 | Notes                                        |
| ------------- | -------------------- | -------------------------------------------- |
| `id`          | `TEXT PRIMARY KEY`   | Client-generated UUID (see ADR-0004).        |
| `title`       | `TEXT NOT NULL`      |                                              |
| `description` | `TEXT NOT NULL`      |                                              |
| `body`        | `TEXT NOT NULL`      | JSON-encoded `Field[]` (see ADR-0002).       |
| `created_at`  | `INTEGER NOT NULL`   | Unix ms; client-assigned.                    |
| `updated_at`  | `INTEGER NOT NULL`   | Unix ms; client-assigned.                    |

The schema is created on first boot by `openDatabase()` (`src/db.ts`) — no separate migration step.

The database file lives at `apps/api/data/form-builder.sqlite` by default (gitignored via the repo-root `.gitignore` `*.sqlite` rule). Override with `DATABASE_PATH` for tests or alternative deployments.

## Routes

All request/response bodies use the shared Zod schemas from `@form-builder/shared`.

- `GET  /templates` — list metadata `{ id, title, updatedAt }[]`, sorted by `updatedAt` desc. No `body`.
- `GET  /templates/:id` — full `FormTemplate` including `fields`.
- `POST /templates` — insert a new template (client-assigned `id`). `409` on duplicate primary key. `400` on invalid payload.
- `PUT  /templates/:id` — replace the whole template atomically (upsert). Idempotent. Path `id` must match body `id`.
- `DELETE /templates/:id` — remove the template. `404` if unknown.

## Manual verification with `curl`

Start the dev server (from the repo root):

```bash
pnpm --filter @form-builder/api dev
```

Then, in another shell:

```bash
# Empty list
curl -s http://localhost:3001/templates | jq

# Create a template (client-assigned UUID)
ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NOW=$(date +%s)000
curl -s -X POST http://localhost:3001/templates \
  -H 'content-type: application/json' \
  -d "{
    \"id\": \"$ID\",
    \"title\": \"My first form\",
    \"description\": \"\",
    \"fields\": [],
    \"createdAt\": $NOW,
    \"updatedAt\": $NOW
  }" | jq

# Duplicate POST returns 409
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/templates \
  -H 'content-type: application/json' \
  -d "{\"id\":\"$ID\",\"title\":\"x\",\"description\":\"\",\"fields\":[],\"createdAt\":$NOW,\"updatedAt\":$NOW}"

# Fetch by id
curl -s http://localhost:3001/templates/$ID | jq

# Replace (PUT) — idempotent
curl -s -X PUT http://localhost:3001/templates/$ID \
  -H 'content-type: application/json' \
  -d "{
    \"id\": \"$ID\",
    \"title\": \"Renamed\",
    \"description\": \"Now with a description\",
    \"fields\": [
      { \"id\": \"f1\", \"type\": \"text\", \"label\": \"Name\", \"required\": true }
    ],
    \"createdAt\": $NOW,
    \"updatedAt\": $(($NOW + 1000))
  }" | jq

# List (metadata only)
curl -s http://localhost:3001/templates | jq

# Delete
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE http://localhost:3001/templates/$ID
# 204

# 404 after delete
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/templates/$ID
# 404
```
