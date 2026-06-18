export const IssueReporter = {
  Sentry: 'sentry-gdplabs[bot]',
};

export const AIPModel = 'gpt-4.1';

export const JWT = {
  Scopes: [
    'https://www.googleapis.com/auth/chat.messages.create',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.memberships',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
  Algorithm: 'RS256',
  Grant: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
};

export const RepositoryOwner = 'GDP-ADMIN';
export const Repositories: Record<string, string> = {
  glchat: 'GLChat',
  'smart-search': 'Smart Search',
  'ai-agent-platform': 'Agent',
  'gl-connectors': 'GLConnectors',
  'gl-langflow': 'LangFlow',
  'glchat-mobile-app': 'GLChat Native',
  meemo: 'Meemo',
};

export const DefaultChunkSize = 5;

export const Spreadsheet = {
  Bug: {
    ID: '1ZGlbEKvVqaP4BL2a81sKSHaBJw11cYxkyKQpCPdPV7A',
    Name: 'REPORT',
  },
  AIP: '1cs1OThqveeEb0cQPOcjsZGwewc6nuFargQ9DPL0UmqE',
};
