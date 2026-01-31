import { describe, it, expect } from 'vitest'
import { parseHtml, parseHeaders } from './parser.js'

describe('Generic Parsers', () => {
  describe('parseHeaders', () => {
    it('should parse headers into a record', () => {
      const headers = new Headers({
        'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
        'Content-Type': 'text/html',
      })
      const result = parseHeaders(headers)
      expect(result['last-modified']).toBe('Wed, 21 Oct 2015 07:28:00 GMT')
      expect(result['content-type']).toBe('text/html')
    })
  })

  describe('parseHtml', () => {
    it('should extract meta tags', () => {
      const html = `
        <html>
          <meta name="date" content="2024-01-01">
          <meta property="og:title" content="Test Page">
        </html>
      `
      const data = parseHtml(html)
      expect(data.meta['date']).toBe('2024-01-01')
      expect(data.meta['og:title']).toBe('Test Page')
    })

    it('should extract multiple LD+JSON blocks', () => {
      const html = `
        <script type="application/ld+json">{"@type": "NewsArticle", "date": "2024-01-01"}</script>
        <script type="application/ld+json">[{"@type": "WebPage"}]</script>
      `
      const data = parseHtml(html)
      expect(data.jsonLd).toHaveLength(2)
      expect(data.jsonLd[0].date).toBe('2024-01-01')
      expect(data.jsonLd[1][0]['@type']).toBe('WebPage')
    })

    it('should handle different attribute orders and mixed case', () => {
      const html = `<META content="2024-01-04" NAME="date">`
      const data = parseHtml(html)
      expect(data.meta['date']).toBe('2024-01-04')
    })

    it('should handle unquoted attributes', () => {
      const html = `<meta name=date content=2024-01-05>`
      const data = parseHtml(html)
      expect(data.meta['date']).toBe('2024-01-05')
    })

    it('should handle single quotes', () => {
      const html = `<meta name='date' content='2024-01-06'>`
      const data = parseHtml(html)
      expect(data.meta['date']).toBe('2024-01-06')
    })

    it('should handle attributes with namespaces and weird characters', () => {
      const html = `<meta property="og:published_time" content="2024-01-07">`
      const data = parseHtml(html)
      expect(data.meta['og:published_time']).toBe('2024-01-07')
    })

    it('should rescue date information from truncated JSON-LD', () => {
      const html = `
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "datePublished": "2024-01-08T12:00:00Z",
            "description": "This JSON is cut off right her...
      `
      // Note: The closing </script> is missing in the real truncated case,
      // but parseHtml looks for </script>. Let's simulate a truncated block that still has the closing tag
      // (which happens if fetchPartial cuts off in the middle but we still append common footers or just the block itself is invalid)
      const htmlWithTag = html + '</script>'
      const data = parseHtml(htmlWithTag)
      expect(data.jsonLd).toHaveLength(1)
      expect(data.jsonLd[0].datePublished).toBe('2024-01-08T12:00:00Z')
    })

    it('should strip HTML tags from time tag text content', () => {
      const html = `<time>2024-01-01 <span>12:00</span></time>`
      const data = parseHtml(html)
      expect(data.time[0].text).toBe('2024-01-01 12:00')
    })
  })
})
