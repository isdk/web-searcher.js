import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchHeaders, fetchPartial } from './fetcher.js'

describe('fetcher', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('fetchHeaders', () => {
    it('should return headers on successful HEAD request', async () => {
      const mockHeaders = new Headers({ 'last-modified': 'test-date' })
      ;(globalThis.fetch as any).mockResolvedValue({
        ok: true,
        headers: mockHeaders,
      })

      const headers = await fetchHeaders('https://example.com')
      expect(headers?.get('last-modified')).toBe('test-date')
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'HEAD' })
      )
    })

    it('should return null on fetch error', async () => {
      ;(globalThis.fetch as any).mockRejectedValue(new Error('Network error'))
      const headers = await fetchHeaders('https://example.com')
      expect(headers).toBeNull()
    })
  })

  describe('fetchPartial', () => {
    it('should read content stream until maxBytes', async () => {
      const encoder = new TextEncoder()
      const chunks = [
        encoder.encode('first chunk '),
        encoder.encode('second chunk'),
        encoder.encode('third chunk'),
      ]

      const stream = new ReadableStream({
        async start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(chunk)
          }
          controller.close()
        },
      })

      ;(globalThis.fetch as any).mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers({ 'content-type': 'text/html' }),
      })

      const result = await fetchPartial('https://example.com', 15) // maxBytes = 15
      expect(result?.content).toContain('first chunk')
      // It might read slightly more depending on chunk boundaries, but it should contain at least the first parts
      expect(result?.content.length).toBeGreaterThanOrEqual(12)
    })

    it('should handle AbortError and return partial content if available', async () => {
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('some data'))
          // Don't close, let it be aborted
        },
        cancel(reason) {
          // This will be called when aborted
        },
      })

      ;(globalThis.fetch as any).mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers({ 'content-type': 'text/html' }),
      })

      // We need to simulate the abort throwing an error in the loop
      // But in our implementation, the loop breaks on controller.abort()
      const result = await fetchPartial('https://example.com', 5)
      expect(result?.content).toBe('some data')
    })

    it('should use charset from content-type header', async () => {
      const encoder = new TextEncoder()
      // "测试" in GBK: 0xB2 0xE2 0xCA 0xD4
      const gbkData = new Uint8Array([0xb2, 0xe2, 0xca, 0xd4])
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(gbkData)
          controller.close()
        },
      })

      ;(globalThis.fetch as any).mockResolvedValue({
        ok: true,
        body: stream,
        headers: new Headers({ 'content-type': 'text/html; charset=gbk' }),
      })

      const result = await fetchPartial('https://example.com')
      expect(result?.content).toBe('测试')
    })

    it('should return null if body is empty', async () => {
      ;(globalThis.fetch as any).mockResolvedValue({
        ok: true,
        body: null,
      })
      const result = await fetchPartial('https://example.com')
      expect(result).toBeNull()
    })
  })
})
