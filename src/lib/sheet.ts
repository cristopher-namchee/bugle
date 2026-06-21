import { Spreadsheet } from '@/const';
import type { AIPReport, BugReport, PerformanceReport } from '@/types';

interface SheetsBatchGetResponse {
  valueRanges?: {
    range: string;
    majorDimension: string;
    values?: unknown[][];
  }[];
}

interface SpreadsheetMetadataResponse {
  sheets: {
    properties: {
      title: string;
      gridProperties: {
        rowCount: number;
      };
    };
  }[];
}

interface SheetsValueResponse {
  range: string;
  majorDimension: string;
  values?: unknown[][];
}

/**
 * Get aggregated value of bug report for the current week.
 *
 * @param {string} token Google OAuth token that will be used to fetch data.
 * Should have the spreadsheet scope.
 * @returns {Promise<BugReport | null>} A promise that resolves into bug
 * report data or rejects with `null`
 */
export async function getBugReport(token: string): Promise<BugReport | null> {
  try {
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values:batchGet`;
    const url = new URL(baseUrl);

    const ranges = [
      `${Spreadsheet.Bug.Name}!B5:B7`, // Internal Open
      `${Spreadsheet.Bug.Name}!D5:D7`, // External Open
      `${Spreadsheet.Bug.Name}!B10:B13`, // Internal Closed
      `${Spreadsheet.Bug.Name}!D10:D13`, // External Closed
    ];

    ranges.forEach((range) => {
      url.searchParams.append('ranges', range);
    });
    url.searchParams.append('valueRenderOption', 'UNFORMATTED_VALUE');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Google Sheets API error: ${response.status} ${response.statusText}`,
      );
    }

    const result: SheetsBatchGetResponse = await response.json();
    const valueRanges = result.valueRanges;

    if (!valueRanges || valueRanges.length < 4) {
      throw new Error(
        `Sheet "${Spreadsheet.Bug.ID}:${Spreadsheet.Bug.Name}" not found or failed to return requested ranges.`,
      );
    }

    const extractNumbers = (valueRange: (typeof valueRanges)[0]): number[] => {
      const rows = valueRange.values || [];
      return rows.flat().map((val) => {
        const num = Number(val);
        if (Number.isNaN(num)) {
          throw new Error(`Encountered invalid non-numeric data of ${val}`);
        }

        return num;
      });
    };

    const internalOpen = extractNumbers(valueRanges[0]);
    const externalOpen = extractNumbers(valueRanges[1]);
    const internalClosed = extractNumbers(valueRanges[2]);
    const externalClosed = extractNumbers(valueRanges[3]);

    return {
      internal: { open: internalOpen, closed: internalClosed },
      external: { open: externalOpen, closed: externalClosed },
    };
  } catch (err) {
    console.error('Faled to fetch bug aggregation data:', err);

    return null;
  }
}

/**
 * Get AIP benchmark report of the current week
 *
 * @param {string} token Google OAuth token that will be used to fetch data.
 * Should have the spreadsheet scope.
 * @returns {Promise<AIPReport | null>} A promise that resolves into benchmark data
 * or rejects with `null`
 */
export async function getAIPReport(token: string): Promise<AIPReport | null> {
  try {
    const baseHeaders = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.AIP}?fields=sheets(properties)`,
      {
        method: 'GET',
        headers: baseHeaders,
      },
    );
    if (!metaRes.ok) {
      throw new Error(`Metadata fetch failed: ${metaRes.statusText}`);
    }

    const metaData: SpreadsheetMetadataResponse = await metaRes.json();
    const sheetsMeta = metaData.sheets;

    if (!sheetsMeta || sheetsMeta.length < 2) {
      throw new Error('Spreadsheet does not have enough sheets.');
    }

    const benchmarkMeta = sheetsMeta[sheetsMeta.length - 2].properties;
    const lastSheetMeta = sheetsMeta[sheetsMeta.length - 1].properties;

    const secondLastTitle = benchmarkMeta.title;
    const lastTitle = lastSheetMeta.title;

    const dataUrl = new URL(
      `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.AIP}/values:batchGet`,
    );
    dataUrl.searchParams.append('ranges', `${secondLastTitle}!A1:D`);
    dataUrl.searchParams.append('ranges', `${lastTitle}!A:D`);
    dataUrl.searchParams.append('valueRenderOption', 'UNFORMATTED_VALUE');

    const dataRes = await fetch(dataUrl.toString(), {
      method: 'GET',
      headers: baseHeaders,
    });
    if (!dataRes.ok) {
      throw new Error(
        `Failed to fetch values from AIP sheet: ${dataRes.statusText}`,
      );
    }

    const dataPayload: SheetsBatchGetResponse = await dataRes.json();
    const valueRanges = dataPayload.valueRanges || [];

    const modelValues = valueRanges[1]?.values || [];
    if (modelValues.length === 0) {
      throw new Error(`The model sheet "${lastTitle}" appears to be empty.`);
    }
    const lastRowData = modelValues[modelValues.length - 1];
    const model = lastRowData[0]?.toString() || '';
    const users = Number(lastRowData[3] || 0);

    const scenarioValues = valueRanges[0]?.values || [];
    const scenario: Record<string, [number, string]> = {};

    for (let idx = 1; idx < scenarioValues.length; idx += 10) {
      const rowItem = scenarioValues[idx - 1];
      if (!rowItem || !rowItem[0]) {
        continue;
      }

      const rawNameString = rowItem[0].toString();
      const splitParts = rawNameString.split('\n');
      const scenarioName = splitParts[1] ? splitParts[1] : splitParts[0];

      const targetRow = scenarioValues[idx - 1 + 7];
      const ttft = targetRow ? Number(targetRow[2]) : 0;

      const targetRawString = targetRow[3]?.toString() ?? '';
      const matchResult = targetRawString.match(/(\d+s)/);
      const target = matchResult ? matchResult[1] : '';

      scenario[scenarioName] = [ttft, target];
    }

    return {
      model,
      users,
      scenario,
    };
  } catch (err) {
    console.error('Failed to get AIP report:', err);

    return null;
  }
}

/**
 * Get GLChat performance report of the current week.
 *
 * @param {string} token Google OAuth token that will be used to fetch data.
 * Should have the spreadsheet scope.
 * @returns {Promise<PerformanceReport | null>} A promise that resolves into performance report
 * or rejects with `null`
 */
export async function getPerformanceReport(
  token: string,
): Promise<PerformanceReport | null> {
  try {
    const range = `${Spreadsheet.Bug.Name}!K27:K30`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Google Sheets API error: ${response.status} ${response.statusText}`,
      );
    }

    const result: SheetsValueResponse = await response.json();

    return result.values ? (result.values.flat() as PerformanceReport) : null;
  } catch (err) {
    console.error(err);

    return null;
  }
}

export async function mapEmailFromGithubUsername(
  username: string,
): Promise<string> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values/${Spreadsheet.Bug.PIC}!B:C`;
    const response = await fetch();
  } catch (err) {}
}
