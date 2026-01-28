export interface Env {
  DAILY_GOOGLE_SPACE: string;
  WEEKLY_GOOGLE_SPACE: string;
  SCRIPT_URL: string;
  SHIFT_URL: string;
  GITHUB_TOKEN: string;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
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

export interface GoogleAuthResponse {
  access_token: string;
}

export interface GooglePeopleAPIResponse {
  people: {
    metadata: {
      sources: {
        id: string;
      }[];
    }
  }[];
};
