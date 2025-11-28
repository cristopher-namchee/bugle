import { IssueReporter } from '@/const';
import { formatDate } from '@/lib/date';

import { getSchedule } from '@/lib/sheet';
import { userLookup } from '@/lib/slack';

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
  const today = new Date();

  const pics = await getSchedule(env, today);
  if (!pics) {
    throw new Error('Failed to get schedule data.');
  }

  const dailyBugPic = await userLookup(env, pics[0].email);

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
      `Failed to fetch bug list. Response returned ${bugsRequest.status}`,
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

      const slackAssignees = await Promise.all(
        assigneeData.map(async ({ login, email }) => {
          if (!email) {
            return { found: false, user: login };
          }

          const slackUser = await userLookup(env, email);
          return { found: !!slackUser, user: slackUser ?? login };
        }),
      );

      return {
        title: issue.title,
        number: issue.number,
        reporter: issue.user.login,
        url: issue.html_url,
        created_at: issue.created_at,
        assignees: slackAssignees,
      };
    }),
  );

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🐛 GLChat Active Bug List',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `There are *${bugsWithAssignees.length}* of <https://github.com/GDP-ADMIN/glchat/issues|currently active bugs in GLChat> per *${formatDate(today)}*:`,
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
                    text: 'Issue #',
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
                    text: 'Source',
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
                    text: 'Title',
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
                    text: 'Age',
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
                    text: 'Assignee(s)',
                    style: { bold: true },
                  },
                ],
              },
            ],
          },
        ],
        ...bugsWithAssignees
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((issue) => {
            let source = IssueReporterMap[issue.reporter] ?? 'Manual Report';
            let actualTitle = issue.title;

            const firstDash = issue.title.indexOf('-');

            if (firstDash !== -1) {
              const beforeDash = issue.title.slice(0, firstDash - 1).trim();
              const bracketMatch = beforeDash.match(/^\[(.+?)\]/);

              if (bracketMatch) {
                source = bracketMatch[1].trim();
                actualTitle = issue.title.slice(firstDash + 2).trim();
              }
            }

            const issueAge = Math.round(
              (today.getTime() - new Date(issue.created_at ?? '').getTime()) /
                (1000 * 60 * 60 * 24),
            );

            return [
              {
                type: 'rich_text',
                elements: [
                  {
                    type: 'rich_text_section',
                    elements: [
                      {
                        type: 'link',
                        text: issue.number.toString(),
                        url: issue.url,
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
                        text: source,
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
                        text:
                          actualTitle.length > 56
                            ? `${actualTitle.slice(0, 56)}...`
                            : actualTitle,
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
                        text: `${issueAge} day(s)`,
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
                    elements:
                      issue.assignees.length === 0
                        ? [
                            {
                              type: 'text',
                              text: '⚠️',
                            },
                          ]
                        : issue.assignees.map((assignee) => {
                            if (assignee.found) {
                              return {
                                type: 'user',
                                user_id: assignee.user,
                              };
                            }

                            return {
                              type: 'text',
                              text: assignee.user,
                              style: {
                                code: true,
                              },
                            };
                          }),
                  },
                ],
              },
            ];
          }),
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `✅ *Things to do as an assignee:*`,
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_list',
          style: 'bullet',
          indent: 0,
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: "Investigate the issue that you've been assigned to.",
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: 'Provide a status update in the issue page.',
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: "If you can't provide a status update to the issue, please state the reason in this thread.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🐛 PIC for Daily Bug Report',
        emoji: true,
      },
    },
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'user',
              user_id: dailyBugPic,
            },
          ],
        },
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
      channel: env.DAILY_SLACK_CHANNEL,
      blocks,
    }),
  });
}
