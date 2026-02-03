import { DefaultChunkSize } from "@/const";

/**
 * Split array into multiple sub-arrays of dictated size.
 * 
 * The main purpose of this function is to circumvent concurrent
 * requests limitations.
 * 
 * @param {T[]} arr Array to be chunked 
 * @param {number} size Size of the chunk. Defaults to 5.
 * @returns {T[][]} Chunked array. Throws Error when size is lower than equal
 * to zero.
 */
export function* chunkArray<T>(arr: T[], size = DefaultChunkSize) {
  if (size <= 0) throw new Error('Size must be > 0');

  for (let idx = 0; idx < arr.length; idx += size) {
    yield arr.slice(idx, idx + size);
  }
}
