import { describe, expect, it } from 'vitest';
import { extractTitleMetadata } from './string';

describe('extractTitleMetadata', () => {
  it('should return title as-is when the format is non-standard', () => {
    const title = 'Cannot read property of undefined';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe('Cannot read property of undefined');
    expect(result.source).toBe('Manual Report');
    expect(result.type).toBeUndefined();
  });

  it('should extract source correctly when the format is standardized', () => {
    const title = '[GLoria Feedback] Cannot read property of undefined';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe('Cannot read property of undefined');
    expect(result.source).toBe('GLoria Feedback');
    expect(result.type).toBeUndefined();
  });

  it('should extract type correctly when the type is provided in standardized way', () => {
    const title =
      '[GLoria Feedback] Prompting or result issue - Cannot read property of undefined';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe('Cannot read property of undefined');
    expect(result.source).toBe('GLoria Feedback');
    expect(result.type).toBe('Prompting or result issue');
  });

  it('should still extract type correctly when the type is prepended by a dash', () => {
    const title =
      '[GLoria Feedback] - Prompting or result issue - Cannot read property of undefined';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe('Cannot read property of undefined');
    expect(result.source).toBe('GLoria Feedback');
    expect(result.type).toBe('Prompting or result issue');
  });

  it('should get string before first dash only as the regex is non-greedy', () => {
    const title =
      '[AVA Feedback] Prompt / result issue - System Errors and Multi-User Limitation';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe('System Errors and Multi-User Limitation');
    expect(result.source).toBe('AVA Feedback');
    expect(result.type).toBe('Prompt / result issue');
  });

  it('should not separate non-dash in the title', () => {
    const title = 'User is Half-Stuck on Guest Mode after Fresh Install';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe(
      'User is Half-Stuck on Guest Mode after Fresh Install',
    );
    expect(result.source).toBe('Manual Report');
    expect(result.type).toBeUndefined();
  });

  it('should not separate non-dash in the title, with custom source', () => {
    const title =
      '[GLoria Feedback] User is Half-Stuck on Guest Mode after Fresh Install';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe(
      'User is Half-Stuck on Guest Mode after Fresh Install',
    );
    expect(result.source).toBe('GLoria Feedback');
    expect(result.type).toBeUndefined();
  });

  it('should not confuse dash that separate type with actual text, with custom source', () => {
    const title =
      '[GLoria Feedback] User Feed-back - User is Half-Stuck on Guest Mode after Fresh Install';

    const result = extractTitleMetadata(title);

    expect(result.title).toBe(
      'User is Half-Stuck on Guest Mode after Fresh Install',
    );
    expect(result.source).toBe('GLoria Feedback');
    expect(result.type).toBe('User Feed-back');
  });
});
