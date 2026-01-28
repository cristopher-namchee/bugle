export const IssueReporter = {
  Form: 'infra-gl',
  Sentry: 'sentry[bot]',
};

export const AIPModel = 'gpt-4.1';

export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};