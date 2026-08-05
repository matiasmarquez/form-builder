import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { formTemplateSchema } from '@form-builder/shared';
import { seededTemplate } from './seed.ts';

const app = new Hono();

app.use('/*', cors());

app.get('/templates/:id', (c) => {
  const { id } = c.req.param();
  if (id !== seededTemplate.id) {
    return c.json({ error: 'Not found' }, 404);
  }
  const parsed = formTemplateSchema.parse(seededTemplate);
  return c.json(parsed);
});

const port = Number(process.env.PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`);
});
