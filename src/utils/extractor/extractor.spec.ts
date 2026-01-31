import { describe, it, expect } from 'vitest'
import { extractMetadataFrom } from './extractor.js'

describe('Metadata Extractor', () => {
  const mockHeaders = new Headers({
    'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
  })

  it('should extract date from LD+JSON (highest priority)', () => {
    const content = `
      <script type="application/ld+json">{"datePublished": "2024-01-20T12:00:00Z"}</script>
      <meta name="date" content="2023-01-01">
    `
    const date = extractMetadataFrom({ content, headers: mockHeaders }, 'date')
    expect(date).toBe('2024-01-20T12:00:00.000Z')
  })

  it('should extract date from deeply nested LD+JSON @graph', () => {
    const content = `
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@graph": [
            { "@type": "Organization", "name": "Test" },
            { "@type": "WebPage", "datePublished": "2024-03-15" }
          ]
        }
      </script>
    `
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBe(new Date('2024-03-15').toISOString())
  })

  it('should pick the most specific meta tag', () => {
    const content = `
      <meta name="date" content="2024-01-01">
      <meta property="article:published_time" content="2024-02-01">
    `
    // article:published_time has higher priority in our findDateInMeta list order?
    // Wait, let's check findDateInMeta implementation.
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBe(new Date('2024-02-01').toISOString())
  })

  it('should handle multiple LD+JSON blocks, skipping ones without dates', () => {
    const content = `
      <script type="application/ld+json">{"@type": "Organization"}</script>
      <script type="application/ld+json">{"datePublished": "2024-04-01"}</script>
    `
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBe(new Date('2024-04-01').toISOString())
  })

  it('should successfully extract date using rescue logic if JSON-LD is truncated', () => {
    const content = `
      <script type="application/ld+json">
        {
          "datePublished": "2024-06-01",
          "incomplete": "this json ends abrup
      </script>
    `
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBe(new Date('2024-06-01').toISOString())
  })

  it('should extract date from meta tags if LD+JSON is missing', () => {
    const content = `
      <meta property="article:published_time" content="2023-12-25">
    `
    const date = extractMetadataFrom({ content, headers: mockHeaders }, 'date')
    expect(date).toBe(new Date('2023-12-25').toISOString())
  })

  it('should extract date from time tags if meta is missing', () => {
    const content = `
      <time datetime="2024-05-01">May 1</time>
    `
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBe(new Date('2024-05-01').toISOString())
  })

  it('should fallback to headers if no HTML date is found', () => {
    const content = `<html><body>No date here</body></html>`
    const date = extractMetadataFrom({ content, headers: mockHeaders }, 'date')
    expect(date).toBe('2015-10-21T07:28:00.000Z')
  })

  it('should return null if no date can be found or normalized', () => {
    const content = `<html><body>Invalid date: <time>long ago</time></body></html>`
    const date = extractMetadataFrom(
      { content, headers: new Headers() },
      'date'
    )
    expect(date).toBeNull()
  })
})
