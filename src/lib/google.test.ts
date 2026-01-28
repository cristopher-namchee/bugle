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
import { getGoogleAuthToken } from '@/lib/google';

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
        hash: 'SHA-512',
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
});
