export interface Bug {
  title: string;
  number: number;
  url: string;
  created_at: string;
  reporter: string;
  // array of e-mails
  assignees: string[];
}
