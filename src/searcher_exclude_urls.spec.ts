import { describe, it, expect, vi, afterEach } from 'vitest';
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

describe('WebSearcher excludeUrls', () => {
  afterEach(() => {
    // clean up static default options set by the static-default test
    delete (MockSearcher as any)._defaultOptions;
  });

  it('should drop results whose URL exactly matches an excludeUrls entry', async () => {
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep 1', url: 'http://good.com/1' },
          { title: 'Drop', url: 'http://bad.com/1' },
          { title: 'Keep 2', url: 'http://good.com/2' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 2,
      excludeUrls: ['http://bad.com/1']
    });

    expect(results).toHaveLength(2);
    expect(results.map(r => r.url)).toEqual(['http://good.com/1', 'http://good.com/2']);
  });

  it('should treat "/pattern/flags" excludeUrls entries as RegExp', async () => {
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'https://good.com/a' },
          { title: 'Drop 1', url: 'https://sub.bad.com/x' },
          { title: 'Drop 2', url: 'https://other-bad.com/y' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 1,
      excludeUrls: ['/(^|\\.)bad\\.com$/i']
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('https://good.com/a');
  });

  it('should not match plain string entries by substring', async () => {
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 1,
      // must NOT match http://good.com/1
      excludeUrls: ['http://good.com']
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });

  it('should reset the RegExp lastIndex so consecutive matches are all dropped', async () => {
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Drop 1', url: 'http://bad.com/1' },
          { title: 'Drop 2', url: 'http://bad.com/2' },
          { title: 'Keep', url: 'http://good.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    // '/bad/g' carries the global flag: without a lastIndex reset the
    // second consecutive match would be skipped.
    const results = await searcher.search('test', {
      limit: 1,
      excludeUrls: ['/bad/g']
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });

  it('should filter excluded results across pages until the limit is reached', async () => {
    const searcher = new MockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll')
      .mockResolvedValueOnce({
        outputs: {
          results: [
            { title: 'P1 Keep 1', url: 'http://good.com/1' },
            { title: 'P1 Drop', url: 'http://bad.com/1' },
            { title: 'P1 Keep 2', url: 'http://good.com/2' }
          ]
        }
      } as any)
      .mockResolvedValueOnce({
        outputs: {
          results: [
            { title: 'P2 Drop', url: 'http://bad.com/2' },
            { title: 'P2 Keep 3', url: 'http://good.com/3' }
          ]
        }
      } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 3,
      excludeUrls: ['/bad\\.com\\//']
    });

    expect(executeSpy).toHaveBeenCalledTimes(2);
    expect(results.map(r => r.url)).toEqual(['http://good.com/1', 'http://good.com/2', 'http://good.com/3']);
  });

  it('should keep searching the next page when a page is fully excluded', async () => {
    const searcher = new MockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll')
      .mockResolvedValueOnce({
        outputs: {
          results: [
            { title: 'Drop 1', url: 'http://bad.com/1' },
            { title: 'Drop 2', url: 'http://bad.com/2' }
          ]
        }
      } as any)
      .mockResolvedValueOnce({
        outputs: {
          results: [
            { title: 'Keep 1', url: 'http://good.com/1' },
            { title: 'Keep 2', url: 'http://good.com/2' }
          ]
        }
      } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 2,
      excludeUrls: ['/bad\\.com\\//']
    });

    // A page with only excluded results is not exhausted: keep fetching
    // the next page until the limit is reached.
    expect(executeSpy).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.url)).toEqual(['http://good.com/1', 'http://good.com/2']);
  });    it('should stop after maxPages when every page is fully excluded', async () => {
      const searcher = new MockSearcher();
      const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
        outputs: {
          results: [{ title: 'Drop', url: 'http://bad.com/1' }]
        }
      } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 10,
      maxPages: 3,
      excludeUrls: ['http://bad.com/1']
    });

    // pages 0, 1 and 2 are fetched, then maxPages stops the loop
    expect(executeSpy).toHaveBeenCalledTimes(3);
    expect(results).toHaveLength(0);
  });

  it('should stop paginating when the engine returns no results at all', async () => {
    const searcher = new MockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: [] }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 10,
      excludeUrls: ['http://bad.com/1']
    });

    // an actually-empty page means the engine is exhausted
    expect(executeSpy).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(0);
  });

  it('should apply excludeUrls filtering after the user validator', async () => {
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' },
          { title: 'Drop', url: 'http://bad.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const validator = vi.fn(() => true);
    const results = await searcher.search('test', {
      limit: 1,
      excludeUrls: ['http://bad.com/1'],
      validator
    });

    expect(validator).toHaveBeenCalledTimes(1);
    // the validator sees the raw (unfiltered) page results
    expect(validator.mock.calls[0][0].map((r: any) => r.url)).toEqual(['http://good.com/1', 'http://bad.com/1']);
    // the excluded URL is dropped from the final output
    expect(results.map(r => r.url)).toEqual(['http://good.com/1']);
  });

  it('should allow subclasses to customize filtering via the filterResults hook', async () => {
    class CustomFilterSearcher extends MockSearcher {
      protected override async filterResults(results: any[], context: any): Promise<any[]> {
        const filtered = await super.filterResults(results, context);
        // custom rule on top of the default excludeUrls behavior
        return filtered.filter(r => r.url.startsWith('http://good.com'));
      }
    }
    const searcher = new CustomFilterSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' },
          { title: 'Dropped by excludeUrls', url: 'http://bad.com/1' },
          { title: 'Dropped by custom rule', url: 'https://other.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 1,
      excludeUrls: ['http://bad.com/1']
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });

  it('should still filter when a subclass overrides validateFetchResult without calling super', async () => {
    class NoSuperSearcher extends MockSearcher {
      protected override async validateFetchResult(results: any[]): Promise<boolean> {
        // engine-specific check that ignores excludeUrls (no super call)
        return results.length > 0;
      }
    }
    const searcher = new NoSuperSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' },
          { title: 'Drop', url: 'http://bad.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', {
      limit: 1,
      excludeUrls: ['http://bad.com/1']
    });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });

  it('should support excludeUrls set via instance options', async () => {
    const searcher = new MockSearcher({ excludeUrls: ['http://bad.com/1'] });
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' },
          { title: 'Drop', url: 'http://bad.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', { limit: 1 });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });

  it('should support excludeUrls set via static defaultOptions', async () => {
    MockSearcher.defaultOptions = { excludeUrls: ['http://bad.com/1'] };
    const searcher = new MockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: {
        results: [
          { title: 'Keep', url: 'http://good.com/1' },
          { title: 'Drop', url: 'http://bad.com/1' }
        ]
      }
    } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    const results = await searcher.search('test', { limit: 1 });

    expect(results).toHaveLength(1);
    expect(results[0].url).toBe('http://good.com/1');
  });
});
