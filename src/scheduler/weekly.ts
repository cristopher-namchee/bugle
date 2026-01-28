import { AIPModel } from '@/const';
import { formatDate } from '@/lib/date';
import { getGoogleAuthToken } from '@/lib/google';

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

function constructInternalWeeklyBugReport(data: ResourceData<Bugs>) {
  const { data: bugs } = data;

  if (!bugs) {
    return {
      cardId: `card-bug-report-internal`,
      card: {
        header: {
          title: 'Bugs From Internal Report',
          subtitle: 'Weekly Bug Report',
        },
        sections: [
          {
            textParagraph: {
              text: '⚠️ _Failed to fetch weekly bug report. Please check the execution log._',
            },
          },
        ],
      },
    };
  }

  return {
    cardId: `card-bug-report-internal`,
    card: {
      header: {
        title: 'Bugs From Internal Report',
        subtitle: 'Weekly Bug Report',
      },
      sections: [
        {
          collapsible: true,
          widgets: [
            {
              decoratedText: {
                topLabel: 'Total Opened',
                text: `${bugs.internal.open.reduce(
                  (acc, curr) => acc + curr,
                  0,
                )} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P0',
                text: `${bugs.internal.open[0]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P1',
                text: `${bugs.internal.open[1]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P2',
                text: `${bugs.internal.open[2]} bug(s)`,
              },
            },
          ],
        },
        {
          collapsible: true,
          widgets: [
            {
              decoratedText: {
                topLabel: 'Total Closed',
                text: `${bugs.internal.closed.reduce(
                  (acc, curr) => acc + curr,
                  0,
                )} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P0',
                text: `${bugs.internal.closed[0]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P1',
                text: `${bugs.internal.closed[1]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P2',
                text: `${bugs.internal.closed[2]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'Closed as Enhancements',
                text: `${bugs.internal.closed[3]} bug(s)`,
              },
            },
          ],
        },
      ],
    },
  };
}

function constructExternalWeeklyBugReport(data: ResourceData<Bugs>) {
  const { data: bugs } = data;

  if (!bugs) {
    return {
      cardId: `card-bug-report-external`,
      card: {
        header: {
          title: 'Bugs From External Report',
          subtitle: 'Weekly Bug Report',
        },
        sections: [
          {
            textParagraph: {
              text: '⚠️ _Failed to fetch weekly bug report. Please check the execution log._',
            },
          },
        ],
      },
    };
  }

  return {
    cardId: `card-bug-report-external`,
    card: {
      header: {
        title: 'Bugs From External Report',
        subtitle: 'Weekly Bug Report',
      },
      sections: [
        {
          collapsible: true,
          widgets: [
            {
              decoratedText: {
                topLabel: 'Total Opened',
                text: `${bugs.external.open.reduce(
                  (acc, curr) => acc + curr,
                  0,
                )} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P0',
                text: `${bugs.external.open[0]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P1',
                text: `${bugs.external.open[1]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P2',
                text: `${bugs.external.open[2]} bug(s)`,
              },
            },
          ],
        },
        {
          collapsible: true,
          widgets: [
            {
              decoratedText: {
                topLabel: 'Total Closed',
                text: `${bugs.external.closed.reduce(
                  (acc, curr) => acc + curr,
                  0,
                )} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P0',
                text: `${bugs.external.closed[0]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P1',
                text: `${bugs.external.closed[1]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'P2',
                text: `${bugs.external.closed[2]} bug(s)`,
              },
            },
            {
              decoratedText: {
                topLabel: 'Closed as Enhancements',
                text: `${bugs.external.closed[3]} bug(s)`,
              },
            },
          ],
        },
      ],
    },
  };
}

export async function sendWeeklyBugReport(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const firstDate = new Date();
  firstDate.setDate(1);

  const weeklyStats = await getReport(env);

  if (!weeklyStats) {
    return fetch(
      `https://chat.googleapis.com/v1/spaces/${env.WEEKLY_GOOGLE_SPACE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)

⚠️ _Failed to fetch data from API. Please check the execution logs_.`,
        }),
      },
    );
  }

  const { bugs, performance, aip } = weeklyStats;

  const foo = await fetch(
    `https://chat.googleapis.com/v1/spaces/${env.WEEKLY_GOOGLE_SPACE}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)`,
        cardsV2: [
          constructInternalWeeklyBugReport(bugs),
          constructExternalWeeklyBugReport(bugs),
        ],
      }),
    },
  );

  const body = await foo.json();

  console.log(body);
}
