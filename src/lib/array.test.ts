import { describe, expect, it } from 'vitest';

import { DefaultChunkSize } from '@/const';
import { chunkArray } from './array';

describe('chunkArray', () => {
  it('chunks array using provided size', () => {
    const result = [...chunkArray([1, 2, 3, 4, 5], 2)];

    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('uses DefaultChunkSize when size is not provided', () => {
    const input = Array.from({ length: DefaultChunkSize + 1 }, (_, i) => i);

    const result = [...chunkArray(input)];

    expect(result.length).toBe(2);
    expect(result[0]).toHaveLength(DefaultChunkSize);
    expect(result[1]).toHaveLength(1);
  });

  it('returns single chunk when size >= array length', () => {
    const result = [...chunkArray([1, 2, 3], 10)];

    expect(result).toEqual([[1, 2, 3]]);
  });

  it('returns empty array when input is empty', () => {
    const result = [...chunkArray([], 3)];

    expect(result).toEqual([]);
  });

  it('throws when size is zero', () => {
    expect(() => [...chunkArray([1, 2, 3], 0)]).toThrow('Size must be > 0');
  });

  it('throws when size is negative', () => {
    expect(() => [...chunkArray([1, 2, 3], -1)]).toThrow('Size must be > 0');
  });

  it('preserves order', () => {
    const input = ['a', 'b', 'c', 'd'];

    const result = [...chunkArray(input, 3)];

    expect(result.flat()).toEqual(input);
  });
});
