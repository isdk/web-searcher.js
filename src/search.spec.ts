import { describe, it, expect, vi, beforeAll } from 'vitest';
import { WebSearcher } from './searcher';
import { GoogleSearcher } from './engines/google';

describe('Searcher', () => {
  beforeAll(() => {
    WebSearcher.register(GoogleSearcher);
  });
  afterAll(() => {
    WebSearcher.unregister(GoogleSearcher);
  });

  it('should register and retrieve engines', () => {
    expect(WebSearcher.get('Google')).toBe(GoogleSearcher);
  });

  describe('Instance Logic (Pagination & Transform)', () => {
    it('should fetch multiple pages to satisfy limit', async () => {
      // Create instance directly
      const searcher = new GoogleSearcher();

      // Mock executeAll to return fake results
      const executeSpy = vi.spyOn(searcher, 'executeAll')
        .mockResolvedValueOnce({
          outputs: {
            results: Array(10).fill(0).map((_, i) => ({ title: `Page 1 Result ${i}`, url: 'http://test.com' }))
          }
        } as any)
        .mockResolvedValueOnce({
          outputs: {
            results: Array(10).fill(0).map((_, i) => ({ title: `Page 2 Result ${i}`, url: 'http://test.com' }))
          }
        } as any);

      // Mock dispose
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      const results = await searcher.search('test query', { limit: 15 });

      // 1. Check if it fetched twice
      expect(executeSpy).toHaveBeenCalledTimes(2);

      // 2. Check total results
      expect(results).toHaveLength(15);
      expect(results[0].title).toBe('Page 1 Result 0');
      expect(results[10].title).toBe('Page 2 Result 0');

      // 3. Verify variable injection (first call should have start=0, second start=10)
      const firstCallActions = executeSpy.mock.calls[0][0];
      const secondCallActions = executeSpy.mock.calls[1][0];

      expect(firstCallActions[0].params.url).toContain('start=0');
      expect(firstCallActions[0].params.url).toContain('q=test query');
      expect(secondCallActions[0].params.url).toContain('start=10');
    });

    it('should apply user-defined transform', async () => {
      const searcher = new GoogleSearcher();

      vi.spyOn(searcher, 'executeAll')
        .mockResolvedValue({
          outputs: {
            results: [
              { title: 'Item 1', type: 'target', url: 'http://test.com' },
              { title: 'Item 2', type: 'noise', url: 'http://test.com' }
            ]
          }
        } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      const results = await searcher.search('filter test', {
        limit: 1,
        transform: (items) => items.filter(i => i.type === 'target')
      });

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('target');
    });

    it('should parse real Google HTML structure correctly', async () => {
      const html = `
        <div class="g">
          <div>
            <a href="/url?q=https://github.com/isdk/web-fetcher&amp;sa=U&amp;ved=0ahUKEwj..." data-ved="2ahUKEwj...">
              <h3>GitHub - isdk/web-fetcher</h3>
              <div style="-webkit-line-clamp:2">
                A powerful web scraping library...
              </div>
            </a>
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
  });

  describe('Static Helper', () => {
    it('should create instance and search', async () => {
      // Mock the prototype search method to avoid real execution
      const searchSpy = vi.spyOn(GoogleSearcher.prototype, 'search')
        .mockResolvedValue([{ title: 'Static Result', url: 'http://test.com' }]);
      const disposeSpy = vi.spyOn(GoogleSearcher.prototype, 'dispose')
        .mockResolvedValue(undefined);

      const results = await WebSearcher.search('Google', 'query');

      expect(results).toHaveLength(1);
      expect(searchSpy).toHaveBeenCalledWith('query', expect.anything());
      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});