import { JWT, Spreadsheet } from '@/const';

interface GoogleAuthResponse {
  access_token: string;
}

interface GoogleUserAPIResponse {
  name: string;
}

interface ChatMessage {
  text?: string;
  cardsV2?: CardV2Envelope[];
}

interface CardV2Envelope {
  cardId: string;
  card: CardV2;
}

interface CardV2 {
  header?: CardHeader;
  sections?: CardSection[];
  fixedFooter?: CardFixedFooter;
  name?: string;
}

interface CardHeader {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageType?: 'SQUARE' | 'CIRCLE';
  imageAltText?: string;
}

interface CardSection {
  header?: string;
  widgets?: (Widget | undefined)[];
  collapsible?: boolean;
  uncollapsibleWidgetsCount?: number;
}

interface Widget {
  textParagraph?: TextParagraphWidget;
  decoratedText?: DecoratedTextWidget;
  image?: ImageWidget;
  buttonList?: ButtonListWidget;
  textInput?: TextInputWidget;
}

interface TextParagraphWidget {
  text: string;
}

interface DecoratedTextWidget {
  topLabel?: string;
  text: string;
  bottomLabel?: string;
  startIcon?: Icon;
  endIcon?: Icon;
  onClick?: OnClickAction;
}

interface ImageWidget {
  imageUrl: string;
  onClick?: OnClickAction;
  altText?: string;
}

export interface ButtonListWidget {
  buttons: Button[];
}

interface Button {
  text?: string;
  icon?: Icon;
  color?: Color;
  onClick: OnClickAction;
  disabled?: boolean;
}

interface Icon {
  knownIcon?: string;
  iconUrl?: string;
  altText?: string;
  imageType?: 'SQUARE' | 'CIRCLE';
}

interface Color {
  red: number;
  green: number;
  blue: number;
  alpha?: number;
}

interface OnClickAction {
  action?: FormAction;
  openLink?: OpenLink;
}

interface FormAction {
  functionName: string;
  parameters?: ActionParameter[];
  loadIndicator?: 'SPINNER' | 'NONE';
}

interface ActionParameter {
  key: string;
  value: string;
}

interface OpenLink {
  url: string;
}

interface CardFixedFooter {
  primaryButton?: Button;
  secondaryButton?: Button;
}

interface TextInputWidget {
  name: string;
  label?: string;
  hintText?: string;
  value?: string;
  type?: 'SINGLE_LINE' | 'MULTIPLE_LINE';
}

interface MessageResponse {
  thread: {
    name: string;
  };
}

function b64(input: ArrayBuffer | string) {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);

  return btoa(String.fromCharCode(...bytes))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function pemToArrayBuffer(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s+/g, '');

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

/**
 * Get auth token that can be used to interact with Google Chat API
 * using the provided service account credentials.
 *
 * @param {string} email Service account e-mail
 * @returns {Promise<string>} Resolves into a string. If successful, it will
 * resolve into an access token. If not, it will resolve an empty string.
 */
export async function getGoogleAuthToken(
  email: string,
  pem: string,
): Promise<string> {
  try {
    const iat = Math.floor(Date.now() / 1_000);
    const exp = iat + 3_600;

    const header = b64(JSON.stringify({ alg: JWT.Algorithm, typ: 'JWT' }));

    const claims = b64(
      JSON.stringify({
        iss: email,
        scope: JWT.Scopes.join(' '),
        aud: 'https://oauth2.googleapis.com/token',
        exp,
        iat,
      }),
    );

    const signatureInput = `${header}.${claims}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(pem),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(signatureInput),
    );

    const jwt = `${signatureInput}.${b64(signature)}`;

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: JWT.Grant,
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      throw new Error(`Response returned ${response.status}`);
    }

    const body = (await response.json()) as GoogleAuthResponse;

    if (!body.access_token) {
      throw new Error('Access token is empty');
    }

    return body.access_token;
  } catch (err) {
    console.error('Failed to get access token from Google:', err);

    return '';
  }
}

/**
 * Get Google Space user ID by email.
 *
 * @param {string} email User e-mail
 * @param {string} space Google space ID
 * @param {string} token Google access token that contains People API scopes
 * @returns {Promise<string>} Resolves into a string. If the user is not found, it will
 * resolve into an empty string.
 */
export async function getUserIdByEmail(
  email: string,
  space: string,
  token: string,
): Promise<string> {
  try {
    if (!email) {
      return email;
    }

    const url = new URL(
      `/v1/spaces/${space}/members/${email}`,
      'https://chat.googleapis.com',
    );

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Response returned ${response.status}`);
    }

    const data = (await response.json()) as GoogleUserAPIResponse;
    if (!data.name) {
      return '';
    }

    const [_space, _spaceId, _member, id] = data.name.split('/');

    return `users/${id}`;
  } catch (err) {
    console.warn('Failed to get Google user ID:', err);

    return email;
  }
}

/**
 * Sends a message to a Google Space channel.
 *
 * @param {string} token Google OAuth access token
 * @param {string} channel Google Space channel ID to send the message
 * @param {ChatMessage} message Google Chat compliant message object
 * @returns A Promise that resolves to a message object that contains thread information
 * or `null` if the request failed.
 */
export async function sendMessage(
  token: string,
  channel: string,
  message: ChatMessage,
): Promise<MessageResponse | null> {
  try {
    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${channel}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      },
    );

    if (!response.ok) {
      throw new Error(`response returned ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error(`Failed to send message to channel ${channel}:`, err);

    return null;
  }
}

/**
 * Sends a message as a reply to a thread in a Google Space channel.
 *
 * @param {string} token Google OAuth access token
 * @param {string} channel Google Space channel ID to send the message
 * @param {string} thread Parent thread ID
 * @param {ChatMessage} message Google Chat compliant message object
 * @returns A Promise that resolves to a message object that contains thread information
 * or `null` if the request failed.
 */
export async function sendMessageToThread(
  token: string,
  channel: string,
  thread: string,
  message: ChatMessage,
): Promise<MessageResponse | null> {
  try {
    const response = await fetch(
      `https://chat.googleapis.com/v1/spaces/${channel}/messages?messageReplyOption=REPLY_MESSAGE_OR_FAIL`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...message,
          thread: {
            name: thread,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `failed to send message to thread, response returned ${response.status}`,
      );
    }

    return response.json();
  } catch (err) {
    console.error(
      `Failed to send message to thread ${thread} in channel ${channel}:`,
      err,
    );

    return null;
  }
}

async function getBugReport(token: string): Promise<BugReportResponse> {
  try {
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${Spreadsheet.Bug.ID}/values:batchGet`;
    const url = new URL(baseUrl);

    const ranges = [
      `${Spreadsheet.Bug.Name}!B5:B7`, // Internal Open
      `${Spreadsheet.Bug.Name}!D5:D7`, // External Open
      `${Spreadsheet.Bug.Name}!B10:B13`, // Internal Closed
      `${Spreadsheet.Bug.Name}!D10:D13`, // External Closed
    ];

    // Append ranges to URL query parameters
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
        `Sheet "${targetSheet}" not found or failed to return requested ranges.`,
      );
    }

    // Helper to safely flatten Google's 2D array structure down to a 1D array of numbers
    const extractNumbers = (valueRange: (typeof valueRanges)[0]): number[] => {
      // Default to empty array if the range itself is empty in the sheet
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
      data: {
        internal: { open: internalOpen, closed: internalClosed },
        external: { open: externalOpen, closed: externalClosed },
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error,
    };
  }
}
