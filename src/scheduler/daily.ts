import { IssueReporter } from '@/const';
import { formatDate } from '@/lib/date';
import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';

import { getSchedule } from '@/lib/sheet';

import type { Env, GithubIssue, GithubUser } from '@/types';

const GLChatMetadata = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

const IssueReporterMap = {
  [IssueReporter.Form]: 'Feedback Form',
  [IssueReporter.Sentry]: 'Sentry',
};

export async function sendDailyBugReminder(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
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

    const dailyBugPic = await getUserIdByEmail(pics[0].email, token);

    const params = new URLSearchParams();
    params.append('labels', 'bug');
    params.append('state', 'open');

    const url = new URL(
      `/repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/issues`,
      'https://api.github.com',
    );
    url.search = params.toString();

    const bugsRequest = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'bugle',
      },
    });

    if (!bugsRequest.ok) {
      throw new Error(
        `Failed to fetch bug list from GitHub. Response returned ${bugsRequest.status}`,
      );
    }

    const bugs = (await bugsRequest.json()) as GithubIssue[];
    const bugsWithAssignees = await Promise.all(
      bugs.map(async (issue) => {
        const users = issue.assignees;

        if (!users?.length) {
          return {
            title: issue.title,
            number: issue.number,
            url: issue.html_url,
            created_at: issue.created_at,
            reporter: issue.user.login,
            assignees: [],
          };
        }

        const assigneeData = await Promise.all(
          users.map(async (user) => {
            const userResponse = await fetch(user.url, {
              headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${env.GITHUB_TOKEN}`,
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': 'bugle',
              },
            });

            const userData = (await userResponse.json()) as GithubUser;

            return userData;
          }),
        );

        const assignees = await Promise.all(
          assigneeData.map(async ({ login, email }) => {
            if (!email) {
              return { found: false, user: login };
            }

            const googleUser = await getUserIdByEmail(email, token);
            return { found: !!googleUser, user: googleUser ?? login };
          }),
        );

        return {
          title: issue.title,
          number: issue.number,
          reporter: issue.user.login,
          url: issue.html_url,
          created_at: issue.created_at,
          assignees,
        };
      }),
    );

    text = `*🐛 GLChat Active Bug List*
    
There are *${bugsWithAssignees.length}* of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${formatDate(today)}*${bugsWithAssignees.length > 0 ? ':' : '🎉'}}.

✅ *Things to do as an assignee:*

- Investigate the issue that you've been assigned to.
- Provide a status update in the issue page.
- If you can't provide a status update to the issue, please state the reason in this thread.

🧑 *Today's Bug PIC:*

<${dailyBugPic}>`;

    cards.push(
      ...bugsWithAssignees
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
          Authorization: `Bearer ${token}`,
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
