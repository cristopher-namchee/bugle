import { sendDailyBugReminder } from './scheduler/daily';
import { sendWeeklyBugReport } from './scheduler/weekly';

import type { Env } from './types';

const schedules: Record<string, (env: Env) => Promise<void>> = {
  '0 3 * * *': sendDailyBugReminder,
  '0 8 * * 5': sendWeeklyBugReport,
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
