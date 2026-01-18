import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { WebSearcher } from './searcher';
import { FetcherOptions } from '@isdk/web-fetcher';
import { PaginationConfig } from './types';

class MockSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      url: 'http://test.com/search?q=${query}&start=${offset}',
      actions: [
        {
          id: 'extract',
          storeAs: 'results',
          params: {
            selector: '.result',
            items: {
              title: { selector: 'h3' },
              url: { selector: 'a', attribute: 'href' }
            }
          }
        }
      ]
    };
  }

  override get pagination(): PaginationConfig {
    return {
      type: 'url-param',
      startValue: 0,
      increment: 10
    };
  }
}

describe('Searcher', () => {
  beforeAll(() => {
    WebSearcher.register(MockSearcher, 'Mock');
  });
  afterAll(() => {
    WebSearcher.unregister('Mock');
  });

  it('should register and retrieve engines', () => {
    expect(WebSearcher.get('Mock')).toBe(MockSearcher);
    // Verify alias registration (MockSearcher doesn't have aliases, but we can test the mechanism)
    WebSearcher.setAliases(MockSearcher, 'mock-alias');
    expect(WebSearcher.get('mock-alias')).toBe(MockSearcher);
  });

  describe('Instance Logic (Pagination & Transform)', () => {
    it('should fetch multiple pages to satisfy limit', async () => {
      // Create instance directly
      const searcher = new MockSearcher();

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
      const searcher = new MockSearcher();

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
        transform: (items) => items.filter(i => (i as any).type === 'target')
      });

      expect(results).toHaveLength(1);
      expect((results[0] as any).type).toBe('target');
    });
  });

  describe('Static Helper', () => {
    it('should create instance and search', async () => {
      // Mock the prototype search method to avoid real execution
      const searchSpy = vi.spyOn(MockSearcher.prototype, 'search')
        .mockResolvedValue([{ title: 'Static Result', url: 'http://test.com' }]);
      const disposeSpy = vi.spyOn(MockSearcher.prototype, 'dispose')
        .mockResolvedValue(undefined);

      const results = await WebSearcher.search('Mock', 'query');

      expect(results).toHaveLength(1);
      expect(searchSpy).toHaveBeenCalledWith('query', expect.anything());
      expect(disposeSpy).toHaveBeenCalled();
    });
  });
});
