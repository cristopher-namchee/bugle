import type { Env } from '@/types';

/* General types */

interface SuccessResponse<T> {
  status: 'success';
  data: T;
}

interface ErrorResponse {
  status: 'failed';
  message: string;
}

type AppsScriptResponse<T = undefined> = SuccessResponse<T> | ErrorResponse;

/* Weekly report types */

export interface ResourceData<T> {
  data: T | null;
  error: string | null;
}

interface BugReport {
  open: [number, number, number];
  closed: [number, number, number, number];
}

export type Bugs = {
  internal: BugReport;
  external: BugReport;
};

export type Performance = [string, string, string, string];

export interface AIP {
  model: string;
  users: number;
  scenario: Record<string, [number, string]>;
}

interface WeeklyReport {
  bugs: ResourceData<Bugs>;
  performance: ResourceData<Performance>;
  aip: ResourceData<AIP>;
}

/* Daily bug report types */

interface Employee {
  name: string;
  email: string;
}

type ShiftData = [Employee, Employee, Employee, Employee, Employee];

export async function getSchedule(
  env: Env,
  date: Date,
): Promise<ShiftData | null> {
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

    return null;
  }
}

export async function getReport(env: Env): Promise<WeeklyReport | null> {
  const url = new URL(env.SCRIPT_URL);
  const params = new URLSearchParams();

  url.search = params.toString();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`AppsScript returned ${response.status}`);
    }

    const body = (await response.json()) as AppsScriptResponse<WeeklyReport>;
    if (body.status === 'failed') {
      throw new Error(body.message);
    }

    return body.data;
  } catch (err) {
    console.error(
      'Failed to fetch weekly bug report due to the following error: ',
      err,
    );

    return null;
  }
}
