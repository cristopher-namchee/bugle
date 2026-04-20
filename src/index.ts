import { Hono } from 'hono';
import type { Env } from './types';

const schedules: Record<string, (env: Env) => Promise<void>> = {
  '0 3 * * *': async (env: Env) => {
    await fetch(
      'https://api.github.com/repos/cristopher-namchee/bugle/actions/workflows/daily/dispatches',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2026-03-10',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    );
  },
  '0 8 * * 6': async (env: Env) => {
    await fetch(
      'https://api.github.com/repos/cristopher-namchee/bugle/actions/workflows/weekly/dispatches',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2026-03-10',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    );
  },
};

const app = new Hono<{ Bindings: Env }>();
app.get('/', async (c) => {
  const { GITHUB_TOKEN } = c.env;

  await fetch(
    'https://api.github.com/repos/cristopher-namchee/bugle/actions/workflows/test/dispatches',
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2026-03-10',
      },
      body: JSON.stringify({ ref: 'main' }),
    },
  );
});

export default {
  fetch: app.fetch,
  scheduled: async (
    ctrl: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    const task = schedules[ctrl.cron];

    if (task) {
      ctx.waitUntil(task(env));
    }
  },
};
