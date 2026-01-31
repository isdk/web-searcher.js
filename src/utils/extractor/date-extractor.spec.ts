import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractDate } from './index.js'

describe('extractDate integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should return date from HTML if both HTML and Headers have dates', async () => {
    ;(globalThis.fetch as any).mockImplementation(() => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              '<html><meta name="date" content="2024-02-01"></html>'
            )
          )
          controller.close()
        },
      })
      return Promise.resolve({
        ok: true,
        body: stream,
        headers: new Headers({ 'last-modified': '2024-01-01T00:00:00Z' }),
      })
    })

    const date = await extractDate('https://example.com')
    // Should prefer HTML date (Feb 1) over Header date (Jan 1)
    expect(date).toBe(new Date('2024-02-01').toISOString())
  })

  it('should fallback to Headers if HTML has no date', async () => {
    ;(globalThis.fetch as any).mockImplementation(() => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('<html><body>No date here</body></html>')
          )
          controller.close()
        },
      })
      return Promise.resolve({
        ok: true,
        body: stream,
        headers: new Headers({ 'last-modified': '2024-03-01T00:00:00Z' }),
      })
    })

    const date = await extractDate('https://example.com')
    expect(date).toBe('2024-03-01T00:00:00.000Z')
  })

  it('should return null if neither HEAD nor GET find a date', async () => {
    ;(globalThis.fetch as any).mockImplementation((url, init) => {
      if (init.method === 'HEAD')
        return Promise.resolve({ headers: new Headers() })
      return Promise.resolve({ body: null })
    })

    const date = await extractDate('https://example.com')
    expect(date).toBeNull()
  })
})
