export interface Env {
  DAILY_GOOGLE_SPACE: string;
  WEEKLY_GOOGLE_SPACE: string;
  SCRIPT_URL: string;
  SHIFT_URL: string;
  GITHUB_TOKEN: string;

  SERVICE_ACCOUNT_EMAIL: string;
  SERVICE_ACCOUNT_PRIVATE_KEY: string;
}

export interface Bug {
  title: string;
  number: number;
  url: string;
  created_at: string;
  reporter: string;
  assignees: {
    found: boolean;
    user: string;
  }[];
}
