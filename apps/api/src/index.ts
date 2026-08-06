import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { formTemplateSchema } from '@form-builder/shared';
import { openDatabase } from './db.ts';
import {
  DuplicateTemplateIdError,
  TemplatesRepository,
} from './templates-repository.ts';

const db = openDatabase();
const templates = new TemplatesRepository(db);

const app = new Hono();

app.use('/*', cors());

app.get('/templates', (c) => {
  return c.json(templates.list());
});

app.get('/templates/:id', (c) => {
  const { id } = c.req.param();
  const template = templates.get(id);
  if (!template) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.json(template);
});

app.post('/templates', async (c) => {
  const raw = await c.req.json().catch(() => null);
  const parsed = formTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 400);
  }
  try {
    const created = templates.create(parsed.data);
    return c.json(created, 201);
  } catch (err) {
    if (err instanceof DuplicateTemplateIdError) {
      return c.json({ error: 'Template with this id already exists' }, 409);
    }
    throw err;
  }
});

app.put('/templates/:id', async (c) => {
  const { id } = c.req.param();
  const raw = await c.req.json().catch(() => null);
  const parsed = formTemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid payload', issues: parsed.error.issues }, 400);
  }
  if (parsed.data.id !== id) {
    return c.json({ error: 'Path id and body id must match' }, 400);
  }
  const replaced = templates.replace(parsed.data);
  return c.json(replaced);
});

app.delete('/templates/:id', (c) => {
  const { id } = c.req.param();
  const removed = templates.delete(id);
  if (!removed) {
    return c.json({ error: 'Not found' }, 404);
  }
  return c.body(null, 204);
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
