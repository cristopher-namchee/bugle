import { AIPModel } from '@/const';
import { formatDate } from '@/lib/date';

import {
  type AIP,
  type Bugs,
  getReport,
  type Performance,
  type ResourceData,
} from '@/lib/sheet';

import type { Env } from '@/types';

function createBugReportBlocks(data: ResourceData<Bugs>) {
  const { data: bugs } = data;
  if (!bugs) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚠️ _Failed to fetch weekly bug report. Please check the execution log._',
        },
      },
    ];
  }

  return [
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
  ];
}

function createPerformanceReportBlocks(data: ResourceData<Performance>) {
  const { data: performance } = data;

  if (!performance) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚠️ _Failed to fetch performance report. Please check the execution log._',
        },
      },
    ];
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${performance[0]}_\n        ${performance[1]}\n        ${performance[2]}\n        ${performance[3]}`,
      },
    },
  ];
}

function createAIPReportBlock(data: ResourceData<AIP>) {
  const { data: aip } = data;
  if (!aip) {
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '⚠️ _Failed to fetch GL AIP report. Please check the execution log._',
        },
      },
    ];
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_${AIPModel}, ${aip.users} Concurrent Users_\n${Object.entries(aip.scenario).reduce((acc, curr, idx) => `${acc}        Scenario ${idx + 1} ${curr[0]}: ${curr[1][0].toFixed(3)}s from target ${curr[1][1]}\n`, '')}`,
      },
    },
  ];
}

export async function sendWeeklyBugReport(env: Env) {
  const today = new Date();
  const firstDate = new Date();
  firstDate.setDate(1);

  const baseBlocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 GLChat Weekly Report',
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
  ];

  let blocks: unknown[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⚠️ Failed to fetch data from API. Please check the execution logs.',
      },
    },
  ];

  try {
    const weeklyStats = await getReport(env);

    if (weeklyStats) {
      const { bugs, performance, aip } = weeklyStats.data;

      blocks = [
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Weekly Bug Report*`,
          },
        },
        ...createBugReportBlocks(bugs),
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
        ...createPerformanceReportBlocks(performance),
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
        ...createAIPReportBlock(aip),
      ];
    }
  } catch {
  } finally {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: env.WEEKLY_SLACK_CHANNEL,
        blocks: [...baseBlocks, ...blocks],
      }),
    });
  }
}
