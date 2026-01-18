import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { WebSearcher } from '../searcher';
import { GoogleSearcher } from './google';

// Run this test only if the environment variable RunNetworkTests is set to 'true'
const runRealNetworkTests = process.env.RunNetworkTests === 'true';

describe('Google Search Engine', () => {
  it('should parse real Google HTML structure correctly', async () => {
    // Mock HTML structure matching the new selector:
    // #main #search div:has(> div > div > span > a > h3)
    const html = `
      <div id="main">
        <div id="search">
          <!-- Result Container -->
          <div class="tF2Cxc">
            <div class="yuRUbf">
              <div class="b8lM7">
                <span class="V9tjod">
                  <a href="/url?q=https://github.com/isdk/web-fetcher&amp;sa=U" data-ved="...">
                    <h3>GitHub - isdk/web-fetcher</h3>
                  </a>
                </span>
              </div>
            </div>
            <div class="IsZvec">
              <div style="-webkit-line-clamp:2">
                A powerful web scraping library...
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 1. Validate Selectors using Cheerio
    const cheerio = await import('cheerio');
    const $ = cheerio.load(html);

    // Get the extract action from the class getter
    const template = new GoogleSearcher().template;
    const extractAction = template.actions!.find(a => a.id === 'extract');
    const extractParams = extractAction!.params;

    const items = $(extractParams.selector).map((_, el) => {
      const $el = $(el);
      return {
        title: $el.find(extractParams.items.title.selector).text().trim(),
        url: $el.find(extractParams.items.url.selector).attr(extractParams.items.url.attribute),
        snippet: $el.find(extractParams.items.snippet.selector).text().trim()
      };
    }).get();

    expect(items.length).toBeGreaterThan(0);
    expect(items[0].title).toBe('GitHub - isdk/web-fetcher');
    expect(items[0].url).toContain('/url?q=https://github.com/isdk/web-fetcher');

    // 2. Validate Transform Logic
    const searcher = new GoogleSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: items } } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test');

    expect(results[0].url).toBe('https://github.com/isdk/web-fetcher');
  });

  describe.skipIf(!runRealNetworkTests)('Live Network Tests', () => {
    beforeAll(() => {
      WebSearcher.register(GoogleSearcher);
    });
    afterAll(() => {
      WebSearcher.unregister(GoogleSearcher);
    });

    it('should fetch real results from Google', async () => {
      const results = await WebSearcher.search('google', 'hello world', {
        limit: 5,
        timeoutMs: 30000
      });

      console.log(`Successfully fetched ${results.length} results.`);
      if (results.length > 0) {
        console.log('First result:', results[0]);
      }

      expect(results.length).toBeGreaterThan(0);

      const first = results[0];
      expect(first.title).toBeDefined();
      expect(first.url).toMatch(/^https?:\/\//);
      expect(first.url).not.toContain('/url?q=');
    }, 60000);
  });
});