import { AIPModel } from '@/const';
import { formatDate } from '@/lib/date';
import { getGoogleAuthToken } from '@/lib/google';

import {
  type AIP,
  type Bugs,
  getReport,
  type Performance,
  type ResourceData,
} from '@/lib/sheet';

import type { Env } from '@/types';

function constructPerformanceReport(data: ResourceData<Performance>) {
  const { data: performance } = data;
  if (!performance) {
    return `*⏱️ Performance Report*
    
⚠️ _Failed to fetch performance report. Please check the execution log._`;
  }

  return `*⏱️ Performance Report*
    
${performance[0]}
${performance[1]}
${performance[2]}
${performance[3]}`;
}

function constructAIPReport(data: ResourceData<AIP>) {
  const { data: aip } = data;
  if (!aip) {
    return `*🏃 GL AIP Report*
    
⚠️ _Failed to fetch GL AIP report. Please check the execution log._`;
  }

  return `*🏃 GL AIP Report*
    
_${AIPModel}, ${aip.users} Concurrent Users_
${Object.entries(aip.scenario).reduce((acc, curr, idx) => `${acc}    Scenario ${idx + 1} ${curr[0]}: ${curr[1][0].toFixed(3)}s from target ${curr[1][1]}\n`, '')}`;
}

function constructWeeklyBugReport(data: ResourceData<Bugs>): string {
  const { data: bugs } = data;
  if (!bugs) {
    return `*🐛 Weekly Bug Report*
    
⚠️ _Failed to fetch weekly bug report. Please check the execution log._`;
  }

  return `*🐛 Weekly Bug Report*
    
_Bugs from Internal Report_

  Total Opened: ${bugs.internal.open.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${bugs.internal.open[0]} bug(s)
    P1: ${bugs.internal.open[1]} bug(s)
    P2: ${bugs.internal.open[2]} bug(s)

  Total Closed: ${bugs.internal.closed.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${bugs.internal.closed[0]} bug(s)
    P1: ${bugs.internal.closed[1]} bug(s)
    P2: ${bugs.internal.closed[2]} bug(s)
    Closed As Enhancements: ${bugs.internal.closed[3]} bug(s)
    
_Bugs from External Report_
    
  Total Opened: ${bugs.external.open.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${bugs.external.open[0]} bug(s)
    P1: ${bugs.external.open[1]} bug(s)
    P2: ${bugs.external.open[2]} bug(s)

  Total Closed: ${bugs.external.closed.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${bugs.external.closed[0]} bug(s)
    P1: ${bugs.external.closed[1]} bug(s)
    P2: ${bugs.external.closed[2]} bug(s)
    Closed As Enhancements: ${bugs.external.closed[3]} bug(s)`;
}

export async function sendWeeklyBugReport(env: Env) {
  const token = await getGoogleAuthToken(
    env.SERVICE_ACCOUNT_EMAIL,
    env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );
  if (!token) {
    return;
  }

  const today = new Date();
  const firstDate = new Date();
  firstDate.setDate(1);

  const weeklyStats = await getReport(env);

  if (!weeklyStats) {
    await fetch(
      `https://chat.googleapis.com/v1/spaces/${env.WEEKLY_GOOGLE_SPACE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)

⚠️ _Failed to fetch data from API. Please check the execution logs_.`,
        }),
      },
    );

    return;
  }

  const { bugs, performance, aip } = weeklyStats;

  await fetch(
    `https://chat.googleapis.com/v1/spaces/${env.WEEKLY_GOOGLE_SPACE}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)

${constructWeeklyBugReport(bugs)}

${constructPerformanceReport(performance)}

${constructAIPReport(aip)}`.trim(),
      }),
    },
  );
}
