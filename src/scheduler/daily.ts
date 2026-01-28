import { GLChatMetadata, IssueReporter } from '@/const';
import { formatDate } from '@/lib/date';
import { getCurrentlyActiveBugs } from '@/lib/github';
import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';

import { getSchedule } from '@/lib/sheet';

import type { Env } from '@/types';

const IssueReporterMap = {
  [IssueReporter.Form]: 'Feedback Form',
  [IssueReporter.Sentry]: 'Sentry',
};

export async function sendDailyBugReminder(env: Env) {
  const googleToken = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!googleToken) {
    return;
  }

  let text = `*🐛 GLChat Active Bug List*

⚠️ _Failed to process daily bug report. Please check the execution log._`;
  const cards: Record<string, unknown>[] = [];

  try {
    const today = new Date();

    const pics = await getSchedule(env, today);
    if (!pics) {
      throw new Error('Schedule data is empty');
    }

    const dailyBugPic = await getUserIdByEmail(pics[0].email, googleToken);
    const bugs = await getCurrentlyActiveBugs(env.GITHUB_TOKEN, googleToken);

    text = `*🐛 GLChat Active Bug List*

There are *${bugs.length}* of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${formatDate(today)}*${bugs.length > 0 ? ':' : '🎉'}}.

✅ *Things to do as an assignee:*

- Investigate the issue that you've been assigned to.
- Provide a status update in the issue page.
- If you can't provide a status update to the issue, please state the reason in this thread.

🧑 *Today's Bug PIC:*

<${dailyBugPic}>`;

    cards.push(
      ...bugs
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((issue) => {
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
              (1000 * 60 * 60 * 24),
          );

          return {
            cardId: `bug-${issue.number}`,
            card: {
              header: {
                title: `#${issue.number}`,
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
                          knownIcon: 'BOOKMARK',
                        },
                        text: `<a href="${issue.url}">${issue.url}</a>`,
                      },
                    },
                    {
                      decoratedText: {
                        topLabel: 'Title',
                        startIcon: {
                          knownIcon: 'DESCRIPTION',
                        },
                        text: issue.title,
                      },
                    },
                    {
                      decoratedText: {
                        topLabel: 'Age',
                        startIcon: {
                          knownIcon: 'CLOCK',
                        },
                        text: `${issueAge} day(s) - since ${formatDate(issue.created_at, { weekday: undefined })}`,
                      },
                    },
                    {
                      decoratedText: {
                        topLabel: 'Assignee',
                        startIcon: {
                          knownIcon: 'PERSON',
                        },
                        text: issue.assignees
                          ? issue.assignees
                              .map((assignee) =>
                                assignee.found ? `<${assignee.user}>` : '',
                              )
                              .join(' ')
                          : '⚠️',
                      },
                    },
                  ],
                },
              ],
            },
          };
        }),
    );
  } catch (err) {
    console.error(err);
  } finally {
    await fetch(
      `https://chat.googleapis.com/v1/${env.DAILY_GOOGLE_SPACE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${googleToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formattedText: text,
          cardsV2: cards,
        }),
      },
    );
  }
}
