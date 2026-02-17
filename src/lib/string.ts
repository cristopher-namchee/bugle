import type { IssueMetadata } from '@/types';

/**
 * Extract all possible information from GitHub issue title, such as
 * source and type.
 *
 * @param {string} title Raw issue title
 * @returns {IssueMetadata} List of metadata that can be extracted from the issue.
 */
export function extractTitleMetadata(title: string): IssueMetadata {
  const metadata: IssueMetadata = {
    title,
    source: 'Manual Report',
  };
  const source = metadata.title.match(/^\[(.+?)\]/);
  if (source) {
    metadata.source = source[1].trim();
    metadata.title = metadata.title.replace(source[0], '').trim();
  }

  if (metadata.title.startsWith('-')) {
    metadata.title = metadata.title.slice(1).trim();
  }

  const type = metadata.title.match(/^(.+)-/);
  if (type) {
    metadata.type = type[1].trim();
    metadata.title = metadata.title.replace(type[0], '').slice(1).trim();
  }

  return metadata;
}
