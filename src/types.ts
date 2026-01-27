export interface Env {
  SLACK_BOT_TOKEN: string;
  DAILY_SLACK_CHANNEL: string;
  WEEKLY_SLACK_CHANNEL: string;
  SCRIPT_URL: string;
  SHIFT_URL: string;
  GITHUB_TOKEN: string;
}

export interface GithubUser {
  login: string;
  name: string;
  email: string | null;
}

export interface GithubIssue {
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

export interface GoogleServiceAccount {
  private_key: string;
  client_email: string;
  token_uri: string;
}
