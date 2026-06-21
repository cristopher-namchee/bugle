import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { Spreadsheet } from '@/const';
import { getAIPReport, getBugReport, getPerformanceReport } from './sheet';

const mockServer = setupServer();

describe('getBugReport', () => {
  beforeAll(async () => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  const mockToken = 'mock-sheets-token';
  const targetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values:batchGet`;

  it('should successfully parse and aggregate bug numbers from value ranges', async () => {
    mockServer.use(
      http.get(targetUrl, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.getAll('ranges')).toEqual([
          `${Spreadsheet.Bug.Name}!B5:B7`,
          `${Spreadsheet.Bug.Name}!D5:D7`,
          `${Spreadsheet.Bug.Name}!B10:B13`,
          `${Spreadsheet.Bug.Name}!D10:D13`,
        ]);
        expect(url.searchParams.get('valueRenderOption')).toBe(
          'UNFORMATTED_VALUE',
        );
        expect(request.headers.get('Authorization')).toBe(
          `Bearer ${mockToken}`,
        );

        return HttpResponse.json({
          valueRanges: [
            {
              range: `${Spreadsheet.Bug.Name}!B5:B7`,
              majorDimension: 'ROWS',
              values: [[1], [2], [3]],
            }, // Internal Open
            {
              range: `${Spreadsheet.Bug.Name}!D5:D7`,
              majorDimension: 'ROWS',
              values: [[10], [20], [30]],
            }, // External Open
            {
              range: `${Spreadsheet.Bug.Name}!B10:B13`,
              majorDimension: 'ROWS',
              values: [[5], [6], [7], [8]],
            }, // Internal Closed
            {
              range: `${Spreadsheet.Bug.Name}!D10:D13`,
              majorDimension: 'ROWS',
              values: [[50], [60], [70], [80]],
            }, // External Closed
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReport(mockToken);

    expect(result).toEqual({
      internal: { open: [1, 2, 3], closed: [5, 6, 7, 8] },
      external: { open: [10, 20, 30], closed: [50, 60, 70, 80] },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return null and log an error if the Sheets API returns a non-200 status', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return new HttpResponse(null, { status: 403, statusText: 'Forbidden' });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain(
      'Faled to fetch bug aggregation data:',
    );
  });

  it('should return null and log an error if less than 4 value ranges are returned', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.json({
          valueRanges: [
            {
              range: `${Spreadsheet.Bug.Name}!B5:B7`,
              majorDimension: 'ROWS',
              values: [[1]],
            },
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return null and log an error if cell values contain invalid non-numeric data', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.json({
          valueRanges: [
            {
              range: `${Spreadsheet.Bug.Name}!B5:B7`,
              majorDimension: 'ROWS',
              values: [[1], ['not-a-number'], [3]],
            },
            {
              range: `${Spreadsheet.Bug.Name}!D5:D7`,
              majorDimension: 'ROWS',
              values: [[10]],
            },
            {
              range: `${Spreadsheet.Bug.Name}!B10:B13`,
              majorDimension: 'ROWS',
              values: [[5]],
            },
            {
              range: `${Spreadsheet.Bug.Name}!D10:D13`,
              majorDimension: 'ROWS',
              values: [[50]],
            },
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('getPerformanceReport', () => {
  beforeAll(async () => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  const mockToken = 'mock-perf-token';
  const expectedRange = `${Spreadsheet.Bug.Name}!K27:K30`;
  const targetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values/${encodeURIComponent(expectedRange)}`;

  it('should successfully fetch, flatten, and return the performance report values', async () => {
    mockServer.use(
      http.get(targetUrl, ({ request }) => {
        const url = new URL(request.url);

        expect(url.searchParams.get('valueRenderOption')).toBe(
          'UNFORMATTED_VALUE',
        );
        expect(request.headers.get('Authorization')).toBe(
          `Bearer ${mockToken}`,
        );

        return HttpResponse.json({
          range: expectedRange,
          majorDimension: 'ROWS',
          values: [
            ['99.9% Uptime'],
            ['p99: 120ms'],
            ['Error Rate: 0.01%'],
            ['Throughput: 5k/s'],
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getPerformanceReport(mockToken);

    expect(result).toEqual([
      '99.9% Uptime',
      'p99: 120ms',
      'Error Rate: 0.01%',
      'Throughput: 5k/s',
    ]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return an empty array if the values field is missing from the response', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.json({
          range: expectedRange,
          majorDimension: 'ROWS',
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getPerformanceReport(mockToken);

    expect(result).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return null and log the error when the Sheets API returns a non-200 status', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getPerformanceReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return null and log the error if a complete network failure happens', async () => {
    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.error();
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getPerformanceReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});

describe('getAIPReport', () => {
  beforeAll(async () => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  const mockToken = 'mock-aip-token';
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.AIP}`;
  const batchGetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.AIP}/values:batchGet`;

  it('should successfully fetch metadata, dynamic sheets, and process scenario data', async () => {
    mockServer.use(
      http.get(metaUrl, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('fields')).toBe('sheets(properties)');
        expect(request.headers.get('Authorization')).toBe(
          `Bearer ${mockToken}`,
        );

        return HttpResponse.json({
          sheets: [
            { properties: { title: 'IrrelevantSheet1' } },
            { properties: { title: 'ScenarioSheet' } },
            { properties: { title: 'ModelSheet' } },
          ],
        });
      }),
    );

    mockServer.use(
      http.get(batchGetUrl, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.getAll('ranges')).toEqual([
          'ScenarioSheet!A1:D',
          'ModelSheet!A:D',
        ]);
        expect(url.searchParams.get('valueRenderOption')).toBe(
          'UNFORMATTED_VALUE',
        );

        return HttpResponse.json({
          valueRanges: [
            {
              range: 'ScenarioSheet!A1:D',
              majorDimension: 'ROWS',
              values: [
                ['Header\nTargetScenarioName'],
                [],
                [],
                [],
                [],
                [],
                [],
                [null, null, 0.25, 'Target: 5s limit'],
              ],
            },
            {
              range: 'ModelSheet!A:D',
              majorDimension: 'ROWS',
              values: [['GPT-4o', null, null, 150]],
            },
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getAIPReport(mockToken);

    expect(result).toEqual({
      model: 'GPT-4o',
      users: 150,
      scenario: {
        TargetScenarioName: [0.25, '5s'],
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return null and log an error if metadata fetch fails', async () => {
    mockServer.use(
      http.get(metaUrl, () => {
        return new HttpResponse(null, {
          status: 400,
          statusText: 'Bad Request',
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getAIPReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('Failed to fetch AIP report:');
  });

  it('should return null if the spreadsheet has fewer than 2 sheets', async () => {
    mockServer.use(
      http.get(metaUrl, () => {
        return HttpResponse.json({
          sheets: [{ properties: { title: 'OnlyOneSheet' } }],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getAIPReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return null and log an error if the model sheet payload is completely empty', async () => {
    mockServer.use(
      http.get(metaUrl, () => {
        return HttpResponse.json({
          sheets: [
            { properties: { title: 'ScenarioSheet' } },
            { properties: { title: 'ModelSheet' } },
          ],
        });
      }),
    );

    mockServer.use(
      http.get(batchGetUrl, () => {
        return HttpResponse.json({
          valueRanges: [
            { range: 'ScenarioSheet!A1:D', majorDimension: 'ROWS', values: [] },
            { range: 'ModelSheet!A:D', majorDimension: 'ROWS', values: [] },
          ],
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getAIPReport(mockToken);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});
