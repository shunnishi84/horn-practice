import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requireAuth } from './auth';
import * as repo from './repository';
import type { Env, Session, Settings } from './types';

const app = new Hono<{ Bindings: Env }>();

app.use('*', async (c, next) => {
  const corsMiddleware = cors({ origin: c.env.ALLOWED_ORIGIN, allowMethods: ['GET', 'POST', 'PUT', 'DELETE'] });
  return corsMiddleware(c, next);
});

app.use('/api/*', requireAuth);

app.use('/api/*', async (c, next) => {
  await repo.ensureUser(c.env, c.get('user'));
  await next();
});

app.get('/api/sessions', async (c) => {
  const sessions = await repo.listSessions(c.env, c.get('user').uid);
  return c.json({ sessions });
});

app.post('/api/sessions', async (c) => {
  const session = await c.req.json<Session>();
  await repo.insertSession(c.env, c.get('user').uid, session);
  return c.json({ ok: true }, 201);
});

app.delete('/api/sessions', async (c) => {
  await repo.deleteAllSessions(c.env, c.get('user').uid);
  return c.json({ ok: true });
});

app.get('/api/settings', async (c) => {
  const settings = await repo.getSettings(c.env, c.get('user').uid);
  return c.json({ settings });
});

app.put('/api/settings', async (c) => {
  const settings = await c.req.json<Settings>();
  await repo.putSettings(c.env, c.get('user').uid, settings);
  return c.json({ ok: true });
});

export default app;
