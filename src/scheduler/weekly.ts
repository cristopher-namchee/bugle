import { formatDate } from '@/lib/date';
import { getReport } from '@/lib/sheet';

import type { Env } from '@/types';

export async function sendWeeklyBugReport(env: Env) {
  const weeklyStats = await getReport(env);
  if (!weeklyStats) {
    return;
  }

  const { bugs, performance } = weeklyStats.data;

  const today = new Date();
  const firstDate = new Date();
  firstDate.setDate(1);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 GLChat Bug Reports',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Bugs from Internal Reports*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Total Opened: ${bugs.internal.open.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${bugs.internal.open[0]} bugs\n        P1: ${bugs.internal.open[1]} bugs\n        P2: ${bugs.internal.open[2]} bugs\n\nTotal Closed: ${bugs.internal.closed.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${bugs.internal.closed[0]} bugs\n        P1: ${bugs.internal.closed[1]} bugs\n        P2: ${bugs.internal.closed[2]} bugs\n        Closed as Enhancement: ${bugs.internal.closed[3]} bugs`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Bugs from External Reports*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Total Opened: ${bugs.external.open.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${bugs.external.open[0]} bugs\n        P1: ${bugs.external.open[1]} bugs\n        P2: ${bugs.external.open[2]} bugs\n\nTotal Closed: ${bugs.external.closed.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${bugs.external.closed[0]} bugs\n        P1: ${bugs.external.closed[1]} bugs\n        P2: ${bugs.external.closed[2]} bugs\n        Closed as Enhancement: ${bugs.external.closed[3]} bugs`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*GLChat Performance Report*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${performance[0]}_\n        ${performance[1]}\n        ${performance[2]}\n        ${performance[3]}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*GL AIP Performance Report*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${performance[0]}_\n        ${performance[1]}\n        ${performance[2]}\n        ${performance[3]}`,
      },
    },
  ];

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: env.WEEKLY_SLACK_CHANNEL,
      blocks,
    }),
  });
}
