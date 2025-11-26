import type { Hono } from 'hono';
import type { Env } from './types';

const scheduler: Record<string, (env: Env) => Promise<void>> = {
  '0 3 * * *': sendActiveBugReminder,
  '0 8 * * 5'
};

const app = new Hono<{ Bindings: Env }>();

app.get('/message', (c) => {
  return c.text('Hello Hono!');
});

export default app;
