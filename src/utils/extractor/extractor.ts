import { parseHtml, parseHeaders, HtmlData } from './parser.js'
import { normalizeDate } from './date-normalizer.js'

/**
 * Result object for generic metadata extraction.
 */
export interface MetadataResult {
  /** The extracted and normalized date, if any. */
  date?: string | null
  /** Placeholders for future metadata fields. */
  [key: string]: any
}

/**
 * Supported metadata types for extraction.
 */
export type MetadataType = 'date' | string

/**
 * Extracts specific metadata from parsed HTML and headers based on a requested type.
 * Currently supports 'date' extraction with a prioritized fallback mechanism.
 *
 * @param result - An object containing the raw HTML content and response headers.
 * @param type - The type of metadata to extract.
 * @returns The extracted and normalized value, or null if not found.
 */
export function extractMetadataFrom(
  result: { content: string; headers: Headers },
  type: MetadataType
): string | null {
  const htmlData = parseHtml(result.content)

  switch (type) {
    case 'date':
      return getDateMetadata(htmlData, result.headers)
    default:
      return null
  }
}

/**
 * Specific extractor for the publication or modification date.
 * Implements a prioritized fallback mechanism:
 * 1. JSON-LD (structured data)
 * 2. Meta tags (OpenGraph, Article, etc.)
 * 3. HTML5 <time> tags
 * 4. HTTP Headers (Last-Modified)
 */
function getDateMetadata(htmlData: HtmlData, headers: Headers): string | null {
  // 1. Priority 1: LD+JSON (most reliable for structured content)
  const ldDate = findDateInJsonLd(htmlData.jsonLd)
  const normalizedLd = normalizeDate(ldDate)
  if (normalizedLd) return normalizedLd

  // 2. Priority 2: Meta Tags
  const metaDate = findDateInMeta(htmlData.meta)
  const normalizedMeta = normalizeDate(metaDate)
  if (normalizedMeta) return normalizedMeta

  // 3. Priority 3: Time Tags
  for (const time of htmlData.time) {
    const val = time.datetime || time.text
    const normalized = normalizeDate(val)
    if (normalized) return normalized
  }

  // 4. Priority 4: Headers (fallback)
  const headerData = parseHeaders(headers)
  const headerDate = headerData['last-modified'] // || headerData['date'] the date is server time
  return normalizeDate(headerDate)
}

/**
 * Scans a map of meta tags for common date-related fields.
 */
function findDateInMeta(meta: Record<string, string>): string | null {
  const metaDatePatterns = [
    'article:published_time',
    'og:published_time',
    'datepublished',
    'date',
    'pubdate',
    'publishdate',
    'dc.date.issued',
    'bt:pubdate',
    'sailthru.date',
    'article:modified_time',
    'og:updated_time',
    'modifieddate',
  ]
  for (const pattern of metaDatePatterns) {
    if (meta[pattern]) return meta[pattern]
  }
  return null
}

/**
 * Recursively searches JSON-LD blocks for date-related properties.
 */
function findDateInJsonLd(blocks: any[]): string | null {
  const keys = ['datePublished', 'dateModified', 'pubDate', 'publishedAt']

  const search = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object') return null

    // Direct properties
    for (const key of keys) {
      if (typeof obj[key] === 'string') return obj[key]
    }

    // Nested in @graph or array
    if (Array.isArray(obj)) {
      for (const item of obj) {
        const date = search(item)
        if (date) return date
      }
    } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      return search(obj['@graph'])
    }

    return null
  }

  return search(blocks)
}
