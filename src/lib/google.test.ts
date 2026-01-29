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
import { getGoogleAuthToken, getUserIdByEmail } from '@/lib/google';

const mockServer = setupServer();

function arrayBufferToPem(buffer: ArrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

  const lines = base64.match(/.{1,64}/g)?.join('\n');

  return `-----BEGIN PRIVATE KEY-----\n${lines}\n-----END PRIVATE KEY-----`;
}

describe('getGoogleAuthToken', () => {
  const mockServiceAccount = {
    client_email: 'test@test.iam.gserviceaccount.com',
    private_key: '',
  };

  beforeAll(async () => {
    mockServer.listen();

    // mocking private key
    const keyPair = (await crypto.subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256',
      },
      true,
      ['sign', 'verify'],
    )) as CryptoKeyPair;

    const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const privateKeyPem = arrayBufferToPem(pkcs8 as ArrayBuffer);

    mockServiceAccount.private_key = privateKeyPem;
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should resolve into empty string due to connection error', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        throw new Error('Connection error');
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into empty string when API returned non-200', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({}, { status: 400 });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into empty string when access token is empty', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({});
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should resolve into an access token', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', async () => {
        return HttpResponse.json({ access_token: 'token' });
      }),
    );

    const spy = vi.spyOn(console, 'error');

    const result = await getGoogleAuthToken(
      mockServiceAccount.client_email,
      mockServiceAccount.private_key,
    );

    expect(result).toBe('token');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getGoogleUserID', () => {
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

  it('should return an empty string when the email is empty', async () => {
    mockServer.use(
      http.get('https://chat.googleapis.com/v1/spaces/123/members/', () => {
        return HttpResponse.json({
          name: 'should_not_get',
        });
      }),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('', '123', 'token');

    expect(result).toBe('');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should return an empty string if People API returned non-200', async () => {
    mockServer.use(
      http.get(
        'https://chat.googleapis.com/v1/spaces/123/members/example@domain.com',
        () => {
          return HttpResponse.json({}, { status: 400 });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('example@domain.com', '123', 'token');

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('should return formatted user ID when the user is found', async () => {
    mockServer.use(
      http.get(
        'https://chat.googleapis.com/v1/spaces/123/members/example@domain.com',
        () => {
          return HttpResponse.json({
            name: 'spaces/1234/users/1234',
          });
        },
      ),
    );

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getUserIdByEmail('example@domain.com', '123', 'token');

    expect(result).toBe('users/1234');
    expect(spy).not.toHaveBeenCalled();
  });
});
