import { IssueReporter } from '@/const';
import { chunkArray } from '@/lib/array';
import { formatDate } from '@/lib/date';
import { getCurrentlyActiveBugs } from '@/lib/github';
import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';

import { getSchedule } from '@/lib/sheet';

import type { Bug, Env } from '@/types';

const IssueReporterMap = {
  [IssueReporter.Form]: 'Feedback Form',
  [IssueReporter.Sentry]: 'Sentry',
};

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

export async function sendDailyBugReminder(env: Env) {
  const googleToken = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!googleToken) {
    return;
  }

  const today = new Date();

  const pics = await getSchedule(env, today);
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

  const bugs = await getCurrentlyActiveBugs(env.GITHUB_TOKEN);
  const text = `*🐛 GLChat Active Bug List*

There are *${bugs.length}* of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${formatDate(today)}*${bugs.length > 0 ? '.' : ' 🎉'}

✅ *Things to do as an assignee:*

- Investigate the issue that you've been assigned to.
- Provide a status update in the issue page.
- If you can't provide a status update to the issue, please state the reason in this thread.

🧑 *Today's Bug PIC:*

${dailyBugPic ? `<${dailyBugPic}>` : '-'}`;

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
  const chunkedBugs = [...chunkArray(bugs)];

  for (const chunk of chunkedBugs) {
    const issues = await resolveAssignees(
      chunk,
      env.DAILY_GOOGLE_SPACE,
      googleToken,
    );

    await Promise.all(
      issues.map(async (issue) => {
        let source = IssueReporterMap[issue.reporter] ?? 'Manual Report';
        let actualTitle = issue.title;

        const bracket = actualTitle.match(/^\[(.+?)\]/);
        if (bracket) {
          source = bracket[1].trim();
          actualTitle = actualTitle.replace(bracket[1], '');
        }

        // It's possible to [source] - nonsense - title
        const lastDash = issue.title.lastIndexOf('-');

        if (lastDash !== -1) {
          actualTitle = issue.title.slice(lastDash + 2).trim();
        }

        const issueAge = Math.round(
          (today.getTime() - new Date(issue.created_at ?? '').getTime()) /
            (1_000 * 60 * 60 * 24),
        );

        const picDisplay = issue.assignees.length
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
                      title: `#${issue.number} - ${issue.title}`,
                      subtitle: source,
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
                        ],
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
}
