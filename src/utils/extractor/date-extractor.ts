import { fetchPartial, FetchOptions } from './fetcher.js'
import { extractMetadataFrom } from './extractor.js'

/**
 * Options for the extractDate function.
 */
export interface ExtractOptions extends FetchOptions {
  /**
   * Maximum number of bytes to download from the URL.
   * Defaults to 32768 (32KB), which is usually enough for the HTML <head>.
   */
  maxBytes?: number
}

/**
 * High-level convenience function to extract the publication or modification date from a URL.
 * It performs a partial fetch of the content and applies multiple extraction rules
 * (LD+JSON, Meta tags, Time tags, Headers) to find the most reliable date.
 *
 * @param url - The web page URL to analyze.
 * @param options - Fetch and extraction options.
 * @returns An ISO 8601 date string, or null if no valid date could be found.
 *
 * @example
 * ```ts
 * const date = await extractDate('https://example.com/article');
 * console.log(date); // "2024-01-20T12:00:00.000Z"
 * ```
 */
export async function extractDate(
  url: string,
  options: ExtractOptions = {}
): Promise<string | null> {
  const result = await fetchPartial(url, options.maxBytes, options)
  if (!result) return null

  return extractMetadataFrom(result, 'date')
}
