/**
 * Options for network requests.
 */
export interface FetchOptions {
  /** Timeout in milliseconds. Defaults vary by function (5s to 10s). */
  timeout?: number
  /** Custom HTTP headers to include in the request. */
  headers?: Record<string, string>
}

/**
 * Fetches only the HTTP headers for a given URL using a HEAD request.
 * Useful for checking 'last-modified' without downloading the body.
 *
 * @param url - The URL to check.
 * @param options - Request options.
 * @returns The Headers object, or null on failure.
 */
export async function fetchHeaders(
  url: string,
  options: FetchOptions = {}
): Promise<Headers | null> {
  const { timeout = 5000, headers } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      },
    })
    return response.headers
  } catch (e) {
    return null
  } finally {
    clearTimeout(id)
  }
}

/**
 * Fetches a partial amount of content from a URL.
 * Automatically handles character set detection from the Content-Type header.
 * Aborts the request once the specified maxBytes is reached.
 *
 * @param url - The URL to fetch.
 * @param maxBytes - The maximum number of bytes to read. Defaults to 32KB.
 * @param options - Request options.
 * @returns An object containing the decoded content string and the response headers.
 */
export async function fetchPartial(
  url: string,
  maxBytes: number = 32768,
  options: FetchOptions = {}
): Promise<{ content: string; headers: Headers } | null> {
  const { timeout = 10000, headers } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  let content = ''
  let responseHeaders = new Headers()

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...headers,
      },
    })

    responseHeaders = response.headers
    if (!response.ok || !response.body) return null

    const contentType = response.headers.get('content-type')
    const charsetMatch = contentType?.match(/charset=([\w-]+)/i)
    const charset = charsetMatch ? charsetMatch[1] : 'utf-8'

    const reader = response.body.getReader()
    const decoder = new TextDecoder(charset)
    let receivedLength = 0

    while (true) {
      try {
        const { done, value } = await reader.read()
        if (done) break

        receivedLength += value.length
        content += decoder.decode(value, { stream: true })

        if (receivedLength >= maxBytes) {
          controller.abort()
          break
        }
      } catch (e: any) {
        if (e.name === 'AbortError') break
        throw e
      }
    }

    return { content, headers: responseHeaders }
  } catch (e: any) {
    if (content.length > 0) {
      return { content, headers: responseHeaders }
    }
    return null
  } finally {
    clearTimeout(id)
  }
}
