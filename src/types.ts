export interface Bug {
  title: string;
  number: number;
  url: string;
  created_at: string;
  reporter: string;
  // array of e-mails
  assignees: string[];
}

export interface IssueMetadata {
  title: string;
  source: string;
  type?: string;
}

export interface Env {
  GITHUB_TOKEN: string;
}
