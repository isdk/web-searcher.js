/**
 * Represents structured data extracted from an HTML document.
 */
export interface HtmlData {
  /** Map of meta tag names/properties to their content. Keys are lowercase. */
  meta: Record<string, string>
  /** Array of parsed JSON-LD objects found in the document. */
  jsonLd: any[]
  /** Array of data from HTML <time> tags. */
  time: Array<{
    /** The value of the 'datetime' attribute, if present. */
    datetime: string | null
    /** The text content within the <time> tag, with HTML stripped. */
    text: string
  }>
}

/**
 * Converts a Web API Headers object into a plain JavaScript record.
 * All header names are converted to lowercase for consistent access.
 *
 * @param headers - The Headers object to parse.
 * @returns A record where keys are lowercase header names.
 */
export function parseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value
  })
  return result
}

/**

 * Parses an HTML string to extract generic metadata structures (Meta tags, JSON-LD, Time tags).

 * This function does not perform field-specific logic (like finding a date); it simply

 * collects available structured data.

 *

 * @param html - The raw HTML content to parse.

 * @returns An object containing grouped metadata from the HTML.

 */

export function parseHtml(html: string): HtmlData {
  const data: HtmlData = {
    meta: {},

    jsonLd: [],

    time: [],
  }

  // 1. Parse Meta Tags

  const metaRegex = /<meta\s+([^>]+?)>/gi

  let match

  while ((match = metaRegex.exec(html)) !== null) {
    const attrs = getAttrs(match[1])

    const name = attrs['name'] || attrs['property'] || attrs['itemprop']

    const content = attrs['content']

    if (name && content) {
      data.meta[name.toLowerCase()] = content
    }
  }

  // 2. Parse LD+JSON

  const ldJsonRegex =
    /<script\s+[^>]*?type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi

  while ((match = ldJsonRegex.exec(html)) !== null) {
    const rawJson = match[1]

    try {
      const json = JSON.parse(rawJson)

      data.jsonLd.push(json)
    } catch (e) {
      // If JSON is truncated or invalid, try to rescue date fields via regex

      const rescued = rescueJsonLd(rawJson)

      if (rescued) {
        data.jsonLd.push(rescued)
      }
    }
  }

  // 3. Parse Time Tags

  const timeRegex = /<time([^>]*?)>([\s\S]*?)<\/time>/gi

  while ((match = timeRegex.exec(html)) !== null) {
    const attrs = getAttrs(match[1])

    const datetime = attrs['datetime']

    const text = match[2].replace(/<[^>]*>/g, '').trim()

    data.time.push({ datetime, text })
  }

  return data
}

/**



   * Attempts to extract known date-related fields from a potentially truncated 



   * or malformed JSON-LD string using regular expressions.



   *



   * @param raw - The raw string content of a JSON-LD script block.



   * @returns A partial object containing found date fields, or null if none found.



   */

function rescueJsonLd(raw: string): any {
  const dateKeys = ['datePublished', 'dateModified', 'pubDate', 'publishedAt']

  const rescued: Record<string, string> = {}

  let found = false

  for (const key of dateKeys) {
    // Look for "key": "value" patterns

    const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`, 'i')

    const match = raw.match(regex)

    if (match) {
      rescued[key] = match[1]

      found = true
    }
  }

  return found ? rescued : null
}

/**



   * Extracts all attributes from an HTML tag string into a record.



  

 * Supports quoted (single/double) and unquoted values.

 *

 * @param tagContent - The inner content of a tag (e.g., 'name="date" content="2024"')

 */

function getAttrs(tagContent: string): Record<string, string> {
  const attrs: Record<string, string> = {}

  const attrRegex =
    /([a-z0-9:._-]+)(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^>\s]+)))?/gi

  let match

  while ((match = attrRegex.exec(tagContent)) !== null) {
    const name = match[1].toLowerCase()

    const value = match[2] ?? match[3] ?? match[4] ?? ''

    attrs[name] = value
  }

  return attrs
}
