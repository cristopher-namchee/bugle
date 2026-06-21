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
import { getBugReportPIC } from './schedule';

const mockServer = setupServer();

describe('getBugReportPIC', () => {
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

  const targetUrl =
    'https://deploynaut.cristopher-b2d.workers.dev/api/schedule';

  it('should successfully fetch the list of PICs and return the first one', async () => {
    const testDate = new Date('2026-06-21T00:00:00Z');
    const mockPICList = [
      { name: 'John Doe', email: 'johndoe@example.com' },
      { name: 'Jane Smith', email: 'janesmith@example.com' },
    ];

    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.json({
          data: {
            schedule: mockPICList,
          },
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReportPIC(testDate);

    expect(result).toEqual({ name: 'John Doe', email: 'johndoe@example.com' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return null if the API returns an empty array', async () => {
    const testDate = new Date('2026-06-21T00:00:00Z');

    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.json([]);
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReportPIC(testDate);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalled();
  });

  it('should return null and log an error when the schedule API returns a non-200 status', async () => {
    const testDate = new Date('2026-06-21T00:00:00Z');

    mockServer.use(
      http.get(targetUrl, () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReportPIC(testDate);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('Failed to get PIC:');
  });

  it('should return null and log an error if a network error occurs', async () => {
    const testDate = new Date('2026-06-21T00:00:00Z');

    mockServer.use(
      http.get(targetUrl, () => {
        return HttpResponse.error();
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getBugReportPIC(testDate);

    expect(result).toBeNull();
    expect(spy).toHaveBeenCalledOnce();
  });
});
