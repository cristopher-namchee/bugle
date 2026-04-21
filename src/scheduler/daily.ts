import { IssueReporter, Repositories } from '@/const';
import { chunkArray } from '@/lib/array';
import { formatDate } from '@/lib/date';
import { getCurrentlyActiveBugs } from '@/lib/github';
import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';

import { getSchedule } from '@/lib/sheet';
import { extractTitleMetadata } from '@/lib/string';

import type { Bug } from '@/types';

function resolveAssignees(bugs: Bug[], space: string, token: string) {
  return Promise.all(
    bugs.map(async (bug) => {
      const assignees: string[] = [];

      for (const assigneeChunk of chunkArray(bug.assignees)) {
        const resolved = await Promise.all(
          assigneeChunk.map(async (assignee) => {
            const userId = await getUserIdByEmail(assignee, space, token);
            return userId ?? assignee;
          }),
        );

        assignees.push(...resolved);
      }

      return {
        ...bug,
        assignees,
      };
    }),
  );
}

export async function sendDailyBugReminder() {
  const env = process.env;

  const googleToken = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!googleToken) {
    return;
  }

  const today = new Date();

  const pics = await getSchedule(today);
  if (!pics) {
    console.error('Schedule data is empty');

    await fetch(
      `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `*🐛 GLChat Active Bug List*

⚠️ _Failed to process daily bug report. Please check the execution log._`,
        }),
      },
    );

    return;
  }

  const dailyBugPic = await getUserIdByEmail(
    pics[0].email,
    env.DAILY_GOOGLE_SPACE,
    googleToken,
  );

  const rawBugs = await Promise.all(
    Object.entries(Repositories).map(
      async ([repo, label]) =>
        [label, await getCurrentlyActiveBugs(repo, env.GH_TOKEN)] as [
          string,
          Bug[] | undefined,
        ],
    ),
  );

  const bugs = rawBugs.reduce(
    (acc, curr) => {
      if (!curr[1]) {
        return acc;
      }

      acc[curr[0]] = curr[1];

      return acc;
    },
    {} as Record<string, Bug[]>,
  );

  const bugCount = Object.values(bugs).reduce(
    (acc, curr) => acc + curr.length,
    0,
  );

  const text = `*🐛 GLChat Ecosystem Active Bug List*

There are *${bugCount}* active ${bugCount === 1 ? 'bug' : 'bugs'} in GLChat ecosystem per *${formatDate(today)}*${bugCount > 0 ? ':' : ' 🎉'}
${
  bugCount
    ? `
${Object.entries(bugs)
  .map(
    ([label, bugs]) =>
      `- *${label}*, ${bugs.length} ${bugs.length === 1 ? 'bug' : 'bugs'}`,
  )
  .join('\n')}`
    : ''
}
${
  bugCount
    ? `
✅ *Things to do as when assigned to a bug:*

- Investigate the issue that you've been assigned to.
- Provide a status update on the issue page.
- If you can't provide a status update to the issue, please state the reason in this thread.
`
    : ''
}
🧑 *Today's Bug PIC:*

${dailyBugPic ? `<${dailyBugPic}>` : '-'}`;

  console.log(bugCount, text);

  /*
  const threadStarter = await fetch(
    `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${googleToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
      }),
    },
  );

  const { thread } = (await threadStarter.json()) as {
    thread: { name: string };
  };
  const threadId = thread.name;

  for (const [label, bugList] of Object.entries(bugs)) {
    if (bugList.length === 0) {
      continue;
    }

    await fetch(
      `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages?messageReplyOption=REPLY_MESSAGE_OR_FAIL`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🐛 _List of bugs for ${label}_`,
          thread: {
            name: threadId,
          },
        }),
      },
    );

    const issues = await resolveAssignees(
      bugList,
      env.DAILY_GOOGLE_SPACE,
      googleToken,
    );

    await Promise.all(
      issues.map(async (issue) => {
        const meta = extractTitleMetadata(issue.title);

        if (issue.reporter === IssueReporter.Sentry) {
          meta.title = issue.title;
          meta.source = 'Sentry';
          meta.type = 'Automated Sentry Report';
        }

        const issueAge = Math.round(
          (today.getTime() - new Date(issue.created_at ?? '').getTime()) /
            (1_000 * 60 * 60 * 24),
        );

        const picDisplay = issue.assignees.filter(Boolean).length
          ? `cc: ${issue.assignees.map((a) => (a.startsWith('users/') ? `<${a}>` : `\`${a}\``)).join(' ')}`
          : '⚠️ _Unassigned_';

        await fetch(
          `https://chat.googleapis.com/v1/spaces/${env.DAILY_GOOGLE_SPACE}/messages?messageReplyOption=REPLY_MESSAGE_OR_FAIL`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${googleToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: picDisplay,
              cardsV2: [
                {
                  cardId: `card-issue-${issue.number}`,
                  card: {
                    header: {
                      title: meta.title,
                      subtitle: `#${issue.number}`,
                    },
                    sections: [
                      {
                        collapsible: true,
                        widgets: [
                          {
                            decoratedText: {
                              topLabel: 'URL',
                              startIcon: {
                                knownIcon: 'EMAIL',
                              },
                              text: `<a href="${issue.url}">${issue.url}</a>`,
                            },
                          },
                          {
                            decoratedText: {
                              topLabel: 'Source',
                              startIcon: {
                                knownIcon: 'MULTIPLE_PEOPLE',
                              },
                              text: meta.source,
                            },
                          },
                          meta.type
                            ? {
                                decoratedText: {
                                  topLabel: 'Type',
                                  startIcon: {
                                    knownIcon: 'DESCRIPTION',
                                  },
                                  text: meta.type,
                                },
                              }
                            : undefined,
                          {
                            decoratedText: {
                              topLabel: 'Created At',
                              startIcon: {
                                knownIcon: 'INVITE',
                              },
                              text: `${formatDate(issue.created_at, { weekday: undefined })}`,
                            },
                          },
                          {
                            decoratedText: {
                              topLabel: 'Age',
                              startIcon: {
                                knownIcon: 'CLOCK',
                              },
                              text: `${issueAge} day(s)`,
                            },
                          },
                        ].filter(Boolean),
                      },
                    ],
                  },
                },
              ],
              thread: {
                name: threadId,
              },
            }),
          },
        );
      }),
    );
  }
  */
}

(async () => {
  await sendDailyBugReminder();
})();
