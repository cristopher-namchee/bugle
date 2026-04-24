import type { Env } from './types';

const schedules: Record<string, (env: Env) => Promise<void>> = {
  '0 3 * * *': async (env: Env) => {
    const response = await fetch(
      'https://api.github.com/repos/cristopher-namchee/bugle/actions/workflows/daily.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'bugle',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    );

    const body = await response.json();

    console.log(body);
  },
  '0 8 * * 6': async (env: Env) => {
    const response = await fetch(
      'https://api.github.com/repos/cristopher-namchee/bugle/actions/workflows/weekly.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'bugle',
        },
        body: JSON.stringify({ ref: 'main' }),
      },
    );

    const body = await response.json();

    console.log(body);
  },
};

export default {
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
