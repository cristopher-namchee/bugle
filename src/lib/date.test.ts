import { describe, expect, it } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('should format Date object according to specification', () => {
    const date = new Date('2026-01-28');

    const result = formatDate(date);

    expect(result).toBe('Wednesday, 28 January 2026');
  });

  it('should format valid date string according to specification', () => {
    const date = '2026-01-28';

    const result = formatDate(date);

    expect(result).toBe('Wednesday, 28 January 2026');
  });

  it('should format time according to specification', () => {
    const date = new Date('2026-01-28').getTime();

    const result = formatDate(date);

    expect(result).toBe('Wednesday, 28 January 2026');
  });
});
