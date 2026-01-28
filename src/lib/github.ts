import { GLChatMetadata } from '@/const';

import type { Bug } from '@/types';

interface GithubUser {
  login: string;
  name: string;
  email: string | null;
}

interface GithubIssue {
  number: number;
  title: string;
  html_url: string;
  created_at: string;
  user: {
    login: string;
  };
  assignees?: {
    id: number;
    url: string;
    nodeid: number;
  }[];
}

/**
 * Fetch currently active issues classified as bugs from a GitHub repository.
 *
 * An issue is classified as a bug when it has `bug` label on them (case-sensitive).
 *
 * @param {string} githubToken GitHub access token
 * @returns {Promise<Bug[]>} Resolves into a list of bugs. Will return empty
 * array if GitHub API call failed.
 */
export async function getCurrentlyActiveBugs(
  githubToken: string,
): Promise<Bug[]> {
  const params = new URLSearchParams();
  params.append('labels', 'bug');
  params.append('state', 'open');

  const url = new URL(
    `/repos/${GLChatMetadata.owner}/${GLChatMetadata.repo}/issues`,
    'https://api.github.com',
  );
  url.search = params.toString();

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'bugle',
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch issues from GitHub. Response returned ${response.status}`,
    );

    return [];
  }

  const bugs = (await response.json()) as GithubIssue[];

  return Promise.all(
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
              Authorization: `Bearer ${githubToken}`,
              'X-GitHub-Api-Version': '2022-11-28',
              'User-Agent': 'bugle',
            },
          });

          const userData = (await userResponse.json()) as GithubUser;

          return userData;
        }),
      );

      return {
        title: issue.title,
        number: issue.number,
        reporter: issue.user.login,
        url: issue.html_url,
        created_at: issue.created_at,
        assignees: assigneeData
          .map((assignee) => assignee.email ?? assignee.login)
          .filter(Boolean),
      };
    }),
  );
}
