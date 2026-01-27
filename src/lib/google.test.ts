import { GoogleAuth } from 'google-auth-library';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { getGoogleAuthToken } from '@/lib/google';
import type { GoogleServiceAccount } from '@/types';

vi.mock('google-auth-library', async (original) => {
  const originalPackage =
    await original<typeof import('google-auth-library')>();

  const GoogleAuth = vi.fn(
    class {
      getClient = vi.fn().mockImplementation(() => ({
        getAccessToken: vi.fn(),
      }));
    },
  );

  return { ...originalPackage, GoogleAuth };
});

describe('getGoogleAuthToken', () => {
  const mockServiceAccount: GoogleServiceAccount = {
    client_email: 'test@test.iam.gserviceaccount.com',
    private_key:
      '-----BEGIN PRIVATE KEY-----\nFAKE\n-----END PRIVATE KEY-----\n',
    token_uri: 'https://oauth2.googleapi.com',
  };

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should resolve into empty string due to connection error', async () => {
    const spy = vi.mocked(GoogleAuth).mockImplementationOnce(
      class {
        getClient = vi.fn().mockResolvedValue({
          getAccessToken: vi.fn().mockResolvedValue({
            token: null,
          }),
        });
      } as unknown as typeof GoogleAuth,
    );

    const consoleSpy = vi.spyOn(console, 'error');
    const result = await getGoogleAuthToken(mockServiceAccount);

    expect(result).toBe('');
    expect(spy).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledOnce();
  });

  it('should resolve into an access token', async () => {
    const spy = vi.mocked(GoogleAuth).mockImplementationOnce(
      class {
        getClient = vi.fn().mockResolvedValue({
          getAccessToken: vi.fn().mockResolvedValue({
            token: 'token',
          }),
        });
      } as unknown as typeof GoogleAuth,
    );

    const result = await getGoogleAuthToken(mockServiceAccount);

    expect(result).toBe('token');
    expect(spy).toHaveBeenCalledOnce();
  });
});
