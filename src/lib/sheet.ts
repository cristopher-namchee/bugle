import type { Env } from '@/types';

interface Employee {
  name: string;
  email: string;
}

interface BugReport {
  open: [number, number, number];
  closed: [number, number, number, number];
}

type ShiftData = [Employee, Employee, Employee, Employee, Employee];
type BugsData = {
  internal: BugReport;
  external: BugReport;
};

type PerformanceData = [string, string, string, string];

interface AIPData {
  model: string;
  users: number;
  scenario: Record<string, [number, string]>;
}

interface Report {
  bugs: BugsData;
  performance: PerformanceData;
  aip: AIPData;
}

interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

interface ErrorResponse {
  status: 'failed';
  message: string;
}

type AppsScriptResponse<T = undefined> = SuccessResponse<T> | ErrorResponse;

export async function getSchedule(env: Env, date: Date) {
  const url = new URL(env.SHIFT_URL);
  const params = new URLSearchParams();

  params.set(
    'date',
    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
  );

  url.search = params.toString();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AppsScript returned ${response.status}`);
    }

    const body = (await response.json()) as AppsScriptResponse<ShiftData>;
    if (body.status === 'failed') {
      throw new Error(body.message);
    }

    return body.data;
  } catch (err) {
    console.error('Failed to fetch schedule due to the following error: ', err);
  }
}

export async function getReport(env: Env) {
  const url = new URL(env.SCRIPT_URL);
  const params = new URLSearchParams();

  url.search = params.toString();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AppsScript returned ${response.status}`);
    }

    const body = (await response.json()) as AppsScriptResponse<Report>;
    if (body.status === 'failed') {
      throw new Error(body.message);
    }

    return body;
  } catch (err) {
    console.error(
      'Failed to fetch weekly bug report due to the following error: ',
      err,
    );
  }
}
