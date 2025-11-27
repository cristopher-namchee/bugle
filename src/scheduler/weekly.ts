import { formatDate } from '@/lib/date';
import { getWeeklyBugList } from '@/lib/sheet';

import type { Env } from '@/types';

export async function sendWeeklyBugReport(env: Env) {
  const weeklyStats = await getWeeklyBugList(env);

  // should be Saturday
  const today = new Date();
  const prevSunday = new Date(today);
  prevSunday.setDate(today.getDate() - 6);

  const firstBlock = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '📊 GLChat Weekly Bug Report',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Below is the curated report of <https://github.com/GDP-ADMIN/glchat/issues|weekly bugs in GLChat> from *${formatDate(prevSunday)}* until *${formatDate(today)}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🐞 *Issue(s) Opened*`,
      },
    },
    {
      type: 'table',
      rows: [
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: ' ',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Internal',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'External',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P0',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.open[0].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.open[0].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P1',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.open[1].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.open[1].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P2',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.open[2].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.open[2].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Total',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.open
                      .reduce((acc, curr) => acc + curr, 0)
                      .toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.open
                      .reduce((acc, curr) => acc + curr, 0)
                      .toString(),
                  },
                ],
              },
            ],
          },
        ],
      ],
    },
  ];

  const secondBlock = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✨ *Issue(s) Closed*`,
      },
    },
    {
      type: 'table',
      rows: [
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: ' ',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Internal',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'External',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P0',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.closed[0].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.closed[0].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P1',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.closed[1].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.closed[1].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'P2',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.closed[2].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.closed[2].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'CaE',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.closed[3].toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.closed[3].toString(),
                  },
                ],
              },
            ],
          },
        ],
        [
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Total',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.internal.closed
                      .reduce((acc, curr) => acc + curr, 0)
                      .toString(),
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: weeklyStats?.data.external.closed
                      .reduce((acc, curr) => acc + curr, 0)
                      .toString(),
                  },
                ],
              },
            ],
          },
        ],
      ],
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
      blocks: firstBlock,
    }),
  });

  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: env.WEEKLY_SLACK_CHANNEL,
      blocks: secondBlock,
    }),
  });
}
