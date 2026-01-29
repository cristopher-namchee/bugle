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
import { getCurrentlyActiveBugs } from './github';

const mockServer = setupServer();

describe('getCurrentlyActiveBugs', () => {
  beforeAll(() => {
    mockServer.listen();
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should return empty issues when GitHub returned non-200', async () => {
    mockServer.use(
      http.get('https://api.github.com/repos/GDP-ADMIN/glchat/issues', () => {
        return HttpResponse.json(
          { message: 'Bad credentials' },
          { status: 401 },
        );
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    const result = await getCurrentlyActiveBugs('tokenA');

    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalledOnce();
  });

  // pardon the pun
  it('should resolve all issues without issues', async () => {
    mockServer.use(
      http.get('https://api.github.com/repos/GDP-ADMIN/glchat/issues', () => {
        return HttpResponse.json([
          {
            number: 1,
            title: 'Test Issue',
            html_url: 'https://api.github.com/issues/1',
            created_at: '2026-08-09',
            user: {
              login: 'namchee',
            },
            assignees: [
              {
                id: 2,
                url: 'https://api.github.com/namchee',
                nodeid: 3,
              },
            ],
          },
        ]);
      }),
      http.get('https://api.github.com/namchee', () => {
        return HttpResponse.json({
          login: 'namchee',
          name: 'Cristopher Namchee',
          email: 'cristopher@gdplabs.id',
        });
      }),
    );

    const result = await getCurrentlyActiveBugs('tokenA');

    expect(result).toEqual([
      {
        title: 'Test Issue',
        number: 1,
        reporter: 'namchee',
        url: 'https://api.github.com/issues/1',
        created_at: '2026-08-09',
        assignees: ['cristopher@gdplabs.id'],
      },
    ]);
  });

  it('should resolve issues without assignees', async () => {
    mockServer.use(
      http.get('https://api.github.com/repos/GDP-ADMIN/glchat/issues', () => {
        return HttpResponse.json([
          {
            number: 1,
            title: 'Test Issue',
            html_url: 'https://api.github.com/issues/1',
            created_at: '2026-08-09',
            user: {
              login: 'namchee',
            },
            assignees: [],
          },
        ]);
      }),
    );

    const result = await getCurrentlyActiveBugs('tokenA');

    expect(result).toEqual([
      {
        title: 'Test Issue',
        number: 1,
        reporter: 'namchee',
        url: 'https://api.github.com/issues/1',
        created_at: '2026-08-09',
        assignees: [],
      },
    ]);
  });

  it('should resolve issues correctly if the assignee has not linked GitHub with e-mail', async () => {
    mockServer.use(
      http.get('https://api.github.com/repos/GDP-ADMIN/glchat/issues', () => {
        return HttpResponse.json([
          {
            number: 1,
            title: 'Test Issue',
            html_url: 'https://api.github.com/issues/1',
            created_at: '2026-08-09',
            user: {
              login: 'namchee',
            },
            assignees: [
              {
                id: 2,
                url: 'https://api.github.com/namchee',
                nodeid: 3,
              },
            ],
          },
        ]);
      }),
      http.get('https://api.github.com/namchee', () => {
        return HttpResponse.json({
          login: 'namchee',
          name: 'Cristopher Namchee',
          email: null,
        });
      }),
    );

    const result = await getCurrentlyActiveBugs('tokenA');

    expect(result).toEqual([
      {
        title: 'Test Issue',
        number: 1,
        reporter: 'namchee',
        url: 'https://api.github.com/issues/1',
        created_at: '2026-08-09',
        assignees: ['namchee'],
      },
    ]);
  });
});
