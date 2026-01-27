import { GoogleAuth } from 'google-auth-library';
import { JWT } from '@/const';
import type { GoogleServiceAccount } from '@/types';

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {GoogleServiceAccount} serviceAccount Google Service Account info
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(
  serviceAccount: GoogleServiceAccount,
): Promise<string> {
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: JWT.Scopes,
  });

  const client = await auth.getClient();
  const { token } = await client.getAccessToken();

  if (!token) {
    console.error('Failed to get access token from Google Auth');

    return '';
  }

  return token;
}
