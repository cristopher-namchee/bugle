import { AIPModel } from '@/const';
import { formatDate } from '@/lib/date';
import { getGoogleAuthToken, sendMessage } from '@/lib/google';

import { getAIPReport, getBugReport, getPerformanceReport } from '@/lib/sheet';
import type { AIPReport, BugReport, PerformanceReport } from '@/types';

function constructPerformanceReport(data: PerformanceReport | null) {
  if (!data) {
    return `*⏱️ Performance Report*

⚠️ _Failed to fetch performance report. Please check the execution log._`;
  }

  return `*⏱️ Performance Report*

_${data[0]}_
  ${data[1]}
  ${data[2]}
  ${data[3]}`;
}

function constructAIPReport(data: AIPReport | null) {
  if (!data) {
    return `*🏃 GL AIP Report*

⚠️ _Failed to fetch GL AIP report. Please check the execution log._`;
  }

  return `*🏃 GL AIP Report*

_${AIPModel}, ${data.users} Concurrent Users_
${Object.entries(data.scenario).reduce((acc, curr, idx) => `${acc}    Scenario ${idx + 1} ${curr[0]}: ${curr[1][0].toFixed(3)}s from target ${curr[1][1]}\n`, '')}`;
}

function constructWeeklyBugReport(data: BugReport | null): string {
  if (!data) {
    return `*🐛 Weekly Bug Report*

⚠️ _Failed to fetch weekly bug report. Please check the execution log._`;
  }

  return `*🐛 Weekly Bug Report*

_Bugs from Internal Report_

  Total Opened: ${data.internal.open.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${data.internal.open[0]} bug(s)
    P1: ${data.internal.open[1]} bug(s)
    P2: ${data.internal.open[2]} bug(s)

  Total Closed: ${data.internal.closed.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${data.internal.closed[0]} bug(s)
    P1: ${data.internal.closed[1]} bug(s)
    P2: ${data.internal.closed[2]} bug(s)
    Closed As Enhancements: ${data.internal.closed[3]} bug(s)

_Bugs from External Report_

  Total Opened: ${data.external.open.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${data.external.open[0]} bug(s)
    P1: ${data.external.open[1]} bug(s)
    P2: ${data.external.open[2]} bug(s)

  Total Closed: ${data.external.closed.reduce((acc, curr) => acc + curr, 0)} bug(s)
    P0: ${data.external.closed[0]} bug(s)
    P1: ${data.external.closed[1]} bug(s)
    P2: ${data.external.closed[2]} bug(s)
    Closed As Enhancements: ${data.external.closed[3]} bug(s)`;
}

export async function sendWeeklyBugReport() {
  const env = process.env;

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

  const [bugs, performance, aip] = await Promise.all([
    getBugReport(token),
    getPerformanceReport(token),
    getAIPReport(token),
  ]);

  if (!bugs && !performance && !aip) {
    await sendMessage(token, env.WEEKLY_GOOGLE_SPACE, {
      text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)

⚠️ _Failed to fetch data from Google Sheet. Please check the execution logs_.`,
    });

    return;
  }

  await sendMessage(token, env.WEEKLY_GOOGLE_SPACE, {
    text: `*📊 GLChat Weekly Report*

Month-to-Date (*${formatDate(firstDate, { weekday: undefined })}* until *${formatDate(today, { weekday: undefined })}*)

${constructWeeklyBugReport(bugs)}

${constructPerformanceReport(performance)}

${constructAIPReport(aip)}`.trim(),
  });
}

(async () => {
  await sendWeeklyBugReport();
})();
