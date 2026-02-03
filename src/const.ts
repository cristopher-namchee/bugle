export const IssueReporter = {
  Form: 'infra-gl',
  Sentry: 'sentry[bot]',
};

export const AIPModel = 'gpt-4.1';

export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const GLChatMetadata = {
  owner: 'GDP-ADMIN',
  repo: 'glchat',
};

// https://developers.cloudflare.com/workers/platform/limits/
export const DefaultChunkSize = 5;
