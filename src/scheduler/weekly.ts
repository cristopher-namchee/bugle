import { formatDate } from '@/lib/date';
import { getWeeklyBugList } from '@/lib/sheet';

import type { Env } from '@/types';

export async function sendWeeklyBugReport(env: Env) {
  const weeklyStats = await getWeeklyBugList(env);

  // should be Saturday
  const today = new Date();
  const prevSunday = new Date(today);
  prevSunday.setDate(today.getDate() - 6);

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
        text: `Month-to-Date (*${formatDate(prevSunday)}* until *${formatDate(today)}*)`,
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
        text: `Total Opened: ${weeklyStats?.data.internal.open.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${weeklyStats?.data.internal.open[0]} bugs\n        P1: ${weeklyStats?.data.internal.open[1]} bugs\n        P2: ${weeklyStats?.data.internal.open[2]} bugs\n\nTotal Closed: ${weeklyStats?.data.internal.closed.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${weeklyStats?.data.internal.closed[0]} bugs\n        P1: ${weeklyStats?.data.internal.closed[1]} bugs\n        P2: ${weeklyStats?.data.internal.closed[2]} bugs\n        Closed as Enhancement: ${weeklyStats?.data.internal.closed[3]} bugs`,
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
        text: `Total Opened: ${weeklyStats?.data.external.open.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${weeklyStats?.data.external.open[0]} bugs\n        P1: ${weeklyStats?.data.external.open[1]} bugs\n        P2: ${weeklyStats?.data.external.open[2]} bugs\n\nTotal Closed: ${weeklyStats?.data.external.closed.reduce((acc, curr) => acc + curr, 0)} bugs\n        P0: ${weeklyStats?.data.external.closed[0]} bugs\n        P1: ${weeklyStats?.data.external.closed[1]} bugs\n        P2: ${weeklyStats?.data.external.closed[2]} bugs\n        Closed as Enhancement: ${weeklyStats?.data.external.closed[3]} bugs`,
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
