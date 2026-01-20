import { describe, it, expect, vi } from 'vitest';
import { WebSearcher } from './searcher';
import { FetcherOptions } from '@isdk/web-fetcher';

// Define a test-specific searcher
class TestSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      url: 'http://example.com/?q=${query}',
      actions: [
        { id: 'extract', params: { selector: 'body' } }
      ]
    };
  }
}

// Another searcher that explicitly defines goto in template
class ExplicitGotoSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      url: 'http://example.com/?q=${query}',
      actions: [
        { id: 'goto', params: { url: 'http://example.com/?q=${query}' } },
        { id: 'extract', params: { selector: 'body' } }
      ]
    };
  }
}

describe('Searcher Logic (Actions & Merging)', () => {

  it('should ignore user-provided actions in options', async () => {
    const searcher = new TestSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    await searcher.search('test', {
      limit: 1,
      // User attempts to inject malicious or conflicting actions
      // @ts-ignore
      actions: [{ id: 'malicious-action' }]
    });

    const calledActions = executeSpy.mock.calls[0][0];
    const hasMalicious = calledActions.some(a => a.id === 'malicious-action');
    const hasTemplateAction = calledActions.some(a => a.id === 'extract');

    expect(hasMalicious).toBe(false);
    expect(hasTemplateAction).toBe(true);
  });

  it('should auto-inject goto if not present in template', async () => {
    const searcher = new TestSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    await searcher.search('test', { limit: 1 });

    const calledActions = executeSpy.mock.calls[0][0];
    
    // Expect: [goto, extract]
    expect(calledActions[0].id).toBe('goto');
    expect(calledActions[0].params.url).toBe('http://example.com/?q=test');
    expect(calledActions[1].id).toBe('extract');
  });

  it('should NOT auto-inject goto if template already has it (Duplicate Prevention)', async () => {
    const searcher = new ExplicitGotoSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    await searcher.search('test', { limit: 1 });

    const calledActions = executeSpy.mock.calls[0][0];

    // Count goto actions
    const gotoActions = calledActions.filter(a => a.id === 'goto');
    expect(gotoActions).toHaveLength(1); // Should only be the one from template
    
    // Verify it is indeed the template one (though they look identical)
    // The key is length is 1, not 2.
    expect(calledActions[0].id).toBe('goto');
    expect(calledActions[1].id).toBe('extract');
  });

  it('should inject goto if template has goto but for DIFFERENT url', async () => {
     class DifferentUrlSearcher extends WebSearcher {
      get template(): FetcherOptions {
        return {
          url: 'http://example.com/search?q=${query}', // This is the "calculated" URL
          actions: [
            // Template forces a visit to login page first
            { id: 'goto', params: { url: 'http://example.com/login' } },
            { id: 'extract', params: { selector: 'body' } }
          ]
        };
      }
    }

    const searcher = new DifferentUrlSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);
    vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

    await searcher.search('test', { limit: 1 });

    const calledActions = executeSpy.mock.calls[0][0];

    // Expect: [goto(search), goto(login), extract]
    // The auto-injected goto comes first because the loop adds it before pushing template actions.
    
    const gotoActions = calledActions.filter(a => a.id === 'goto');
    expect(gotoActions).toHaveLength(2);

    expect(gotoActions[0].params.url).toBe('http://example.com/search?q=test');
    expect(gotoActions[1].params.url).toBe('http://example.com/login');
  });

  describe('Pagination Edge Cases', () => {
    it('should break loop if results are empty', async () => {
      const searcher = new TestSearcher();
      const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
        outputs: { results: [] } // Empty results
      } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      const results = await searcher.search('test', { limit: 10 });

      expect(results).toHaveLength(0);
      expect(executeSpy).toHaveBeenCalledTimes(1); // Should stop after first empty page
    });

    it('should respect maxPages limit', async () => {
      class ContinuousSearcher extends TestSearcher {
        override get pagination() {
          return { type: 'url-param' as const, startValue: 0, increment: 1, maxPages: 2 };
        }
      }
      const searcher = new ContinuousSearcher();
      // Always return 1 result, but limit is 10, so it would want to fetch 10 pages
      const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
        outputs: { results: [{ title: 'res', url: '...' }] }
      } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      const results = await searcher.search('test', { limit: 10 });

      expect(results).toHaveLength(2); // Only 2 pages fetched due to maxPages: 2
      expect(executeSpy).toHaveBeenCalledTimes(2);
    });

    it('should use click-next sequence for subsequent pages', async () => {
      class ClickSearcher extends TestSearcher {
        override get pagination() {
          return {
            type: 'click-next' as const,
            nextButtonSelector: '#next-btn'
          };
        }
      }
      const searcher = new ClickSearcher();
      const executeSpy = vi.spyOn(searcher, 'executeAll')
        .mockResolvedValueOnce({ outputs: { results: [{ title: 'p1', url: '...' }] } } as any)
        .mockResolvedValueOnce({ outputs: { results: [{ title: 'p2', url: '...' }] } } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      await searcher.search('test', { limit: 2 });

      expect(executeSpy).toHaveBeenCalledTimes(2);

      const firstPageActions = executeSpy.mock.calls[0][0];
      const secondPageActions = executeSpy.mock.calls[1][0];

      // Page 1: [goto, extract]
      expect(firstPageActions[0].id).toBe('goto');
      
      // Page 2: [click, waitFor, extract]
      expect(secondPageActions[0].id).toBe('click');
      expect(secondPageActions[0].params.selector).toBe('#next-btn');
      expect(secondPageActions[1].id).toBe('waitFor');
      expect(secondPageActions[2].id).toBe('extract');
    });

    it('should calculate correct offset and page variables', async () => {
      class OffsetSearcher extends TestSearcher {
        override get pagination() {
          return { type: 'url-param' as const, startValue: 1, increment: 10 };
        }
      }
      const searcher = new OffsetSearcher();
      const executeSpy = vi.spyOn(searcher, 'executeAll')
        .mockResolvedValueOnce({ outputs: { results: Array(10).fill({ title: 'p1' }) } } as any)
        .mockResolvedValueOnce({ outputs: { results: Array(10).fill({ title: 'p2' }) } } as any);
      vi.spyOn(searcher, 'dispose').mockResolvedValue(undefined);

      // We need to inspect the URL to see if variables were injected correctly.
      // The variables are injected into the template before creating actions.
      await searcher.search('test', { limit: 15 });

      const firstUrl = executeSpy.mock.calls[0][0][0].params.url;
      const secondUrl = executeSpy.mock.calls[1][0][0].params.url;

      // Note: TestSearcher template is 'http://example.com/?q=${query}'
      // To test offset, we need a template that uses it.
      
      // Re-testing with a template that uses offset
      class VarSearcher extends WebSearcher {
        get template(): FetcherOptions {
          return { url: 'http://ex.com/?q=${query}&o=${offset}&p=${page}' };
        }
        override get pagination() {
          return { type: 'url-param' as const, startValue: 1, increment: 10 };
        }
      }
      const searcher2 = new VarSearcher();
      const executeSpy2 = vi.spyOn(searcher2, 'executeAll')
        .mockResolvedValueOnce({ outputs: { results: Array(10).fill({ title: 'p1' }) } } as any)
        .mockResolvedValueOnce({ outputs: { results: Array(10).fill({ title: 'p2' }) } } as any);
      vi.spyOn(searcher2, 'dispose').mockResolvedValue(undefined);

      await searcher2.search('test', { limit: 15 });

      const url1 = executeSpy2.mock.calls[0][0][0].params.url;
      const url2 = executeSpy2.mock.calls[1][0][0].params.url;

      // Page 0: offset = 1 + 0*10 = 1, page = 0 + 1 = 1
      expect(url1).toContain('o=1');
      expect(url1).toContain('p=1');
      // Page 1: offset = 1 + 1*10 = 11, page = 1 + 1 = 2
      expect(url2).toContain('o=11');
      expect(url2).toContain('p=2');
    });
  });

});
