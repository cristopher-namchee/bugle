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

/* Weekly Report */
interface BugAggregate {
  open: number[];
  closed: number[];
}

export interface BugReport {
  internal: BugAggregate;
  external: BugAggregate;
}

export type PerformanceReport = [string, string, string, string];

export interface AIPReport {
  model: string;
  users: number;
  scenario: Record<string, [number, string]>;
}
