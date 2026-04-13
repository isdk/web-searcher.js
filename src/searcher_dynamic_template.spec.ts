import { describe, it, expect, vi } from 'vitest';
import { WebSearcher } from './searcher';
import { FetcherOptions } from '@isdk/web-fetcher';
import { SearchOptions } from './types';

class DynamicMockSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      url: 'http://default.com/search?q=${query}',
      actions: [{ id: 'extract', params: { selector: '.default' } }]
    };
  }

  protected override getTemplate(variables: Record<string, any>, options: SearchOptions): FetcherOptions {
    if (options.category === 'special') {
      return {
        url: 'http://special.com/search?q=${query}&type=${type}',
        actions: [{ id: 'extract', params: { selector: '${specialSelector}' } }]
      };
    }
    return super.getTemplate(variables, options);
  }

  protected override formatOptions(options: SearchOptions): Record<string, any> {
    const vars = super.formatOptions(options);
    if (options.category === 'special') {
      vars.type = 'special_type';
      vars.specialSelector = '.special-item';
    }
    return vars;
  }
}

describe('WebSearcher Dynamic Template', () => {
  it('should use default template when no special category is provided', async () => {
    const searcher = new DynamicMockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: [{ title: 'Default Result', url: 'http://test.com' }] }
    } as any);

    await searcher.search('test query');

    const firstCallActions = executeSpy.mock.calls[0][0];
    const gotoAction = firstCallActions.find((a: any) => a.id === 'goto')!;
    const extractAction = firstCallActions.find((a: any) => a.id === 'extract')!;

    expect(gotoAction.params.url).toBe('http://default.com/search?q=test query');
    expect(extractAction.params.selector).toBe('.default');
  });

  it('should use dynamic template and inject variables correctly', async () => {
    const searcher = new DynamicMockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: [{ title: 'Special Result', url: 'http://test.com' }] }
    } as any);

    // Pass custom options that trigger the dynamic template
    await searcher.search('test query', { category: 'special' });

    const firstCallActions = executeSpy.mock.calls[0][0];
    const gotoAction = firstCallActions.find((a: any) => a.id === 'goto')!;
    const extractAction = firstCallActions.find((a: any) => a.id === 'extract')!;

    // 1. Verify URL from the dynamic template was used and injected
    expect(gotoAction.params.url).toBe('http://special.com/search?q=test query&type=special_type');

    // 2. Verify Actions from the dynamic template were used and injected
    expect(extractAction.params.selector).toBe('.special-item');
  });

  it('should not include actions in session context (createContext)', () => {
    const searcher = new DynamicMockSearcher();
    // Access protected createContext via any
    const context = (searcher as any).createContext();

    // The context should contain environment settings from template (like url if it wasn't filtered,
    // but actions must be filtered)
    expect(context.actions).toBeUndefined();
    // It should still have other properties from the template if they exist
    // In our Mock, url is in template.
    expect(context.url).toBe('http://default.com/search?q=${query}');
  });

  it('should call getTemplate for every page during pagination', async () => {
    const searcher = new DynamicMockSearcher();
    const getTemplateSpy = vi.spyOn(searcher as any, 'getTemplate');

    vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: Array(5).fill({ title: 'Result', url: 'http://test.com' }) }
    } as any);

    // Mock pagination to force 2 pages
    vi.spyOn(searcher, 'pagination', 'get').mockReturnValue({
      type: 'url-param',
      startValue: 0,
      increment: 5
    });

    await searcher.search('test query', { limit: 10 });

    // Should be called twice (once for each page)
    expect(getTemplateSpy).toHaveBeenCalledTimes(2);
    // Verify variables for each call (offset change)
    expect(getTemplateSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ offset: 0 }), expect.anything());
    expect(getTemplateSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: 5 }), expect.anything());
  });

  it('should correctly merge user options with dynamic template (excluding actions)', async () => {
    const searcher = new DynamicMockSearcher();
    vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);

    const options = {
      category: 'special',
      timeout: 5000, // User option
      headers: { 'X-Test': 'true' }, // User option
      actions: [{ id: 'illegal-action' }] // This should be ignored
    };

    await searcher.search('test query', options);

    // Get the final options passed to something (we'll check what was merged into currentOptions indirectly via executeAll or similar,
    // but the logic is inside search). Let's use a spy on executeAll and check the first action if it was modified by merged options if applicable,
    // or better, check how createContext and defaultsDeep worked.

    // In our implementation, currentOptions is a local variable.
    // Let's verify that template actions survived and user actions were dropped.
    const executeSpy = vi.spyOn(searcher, 'executeAll');
    await searcher.search('test query', options);

    const actions = executeSpy.mock.calls[0][0];
    const hasIllegalAction = actions.some((a: any) => a.id === 'illegal-action');
    const hasExtractAction = actions.some((a: any) => a.id === 'extract');

    expect(hasIllegalAction).toBe(false);
    expect(hasExtractAction).toBe(true);
  });

  it('should handle deep nested variable injection in actions', async () => {
    class DeepMockSearcher extends WebSearcher {
      protected override getTemplate(): FetcherOptions {
        return {
          actions: [
            {
              id: 'extract',
              params: {
                items: {
                  details: {
                    selector: '${container} ${item}',
                    params: { attr: '${attributeName}' }
                  }
                }
              }
            }
          ]
        };
      }
    }

    const searcher = new DeepMockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);

    await searcher.search('test', {
      container: '.main',
      item: '.row',
      attributeName: 'data-id'
    });

    const actions = executeSpy.mock.calls[0][0];
    const extractAction = actions.find((a: any) => a.id === 'extract')!;
    const itemConfig = extractAction.params.items.details;

    expect(itemConfig.selector).toBe('.main .row');
    expect(itemConfig.params.attr).toBe('data-id');
  });

  it('should maintain isolation when reusing instance for different categories', async () => {
    const searcher = new DynamicMockSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: [{ title: 'Res', url: 'http://t.com' }] }
    } as any);

    // First search: special
    await searcher.search('q1', { category: 'special' });
    expect(executeSpy.mock.calls[0][0].find((a: any) => a.id === 'extract')!.params.selector).toBe('.special-item');

    // Second search: default
    await searcher.search('q2');
    expect(executeSpy.mock.calls[1][0].find((a: any) => a.id === 'extract')!.params.selector).toBe('.default');
  });

  it('should respect explicit goto in dynamic template and avoid duplicates', async () => {
    class ExplicitGotoSearcher extends WebSearcher {
      protected override getTemplate(): FetcherOptions {
        return {
          url: 'http://test.com/${query}',
          actions: [
            { id: 'goto', params: { url: 'http://test.com/${query}' } },
            { id: 'extract', params: { selector: 'h1' } }
          ]
        };
      }
    }

    const searcher = new ExplicitGotoSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);

    await searcher.search('hello');

    const actions = executeSpy.mock.calls[0][0];
    const gotoActions = actions.filter((a: any) => a.id === 'goto');

    // Should only have ONE goto action because the template one matches the generated one
    expect(gotoActions).toHaveLength(1);
    expect(gotoActions[0].params.url).toBe('http://test.com/hello');
  });

  it('should handle missing variables by injecting empty strings', async () => {
    class MissingVarSearcher extends WebSearcher {
      get template(): FetcherOptions {
        return {
          url: 'http://test.com?q=${query}&missing=${missing_val}',
          actions: [{ id: 'extract', params: { selector: '${not_found}' } }]
        };
      }
    }

    const searcher = new MissingVarSearcher();
    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);

    await searcher.search('test');

    const actions = executeSpy.mock.calls[0][0];
    const gotoAction = actions.find((a: any) => a.id === 'goto')!;
    const extractAction = actions.find((a: any) => a.id === 'extract')!;

    expect(gotoAction.params.url).toBe('http://test.com?q=test&missing=');
    expect(extractAction.params.selector).toBe('');
  });

  it('should correctly integrate pagination variables into dynamic URL', async () => {
    const searcher = new DynamicMockSearcher();
    vi.spyOn(searcher, 'pagination', 'get').mockReturnValue({
      type: 'url-param',
      startValue: 1,
      increment: 1
    });

    const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
      outputs: { results: Array(1).fill({ title: 'R', url: 'http://t.com' }) }
    } as any);

    // Search with 2 pages limit
    await searcher.search('test', { category: 'special', limit: 2 });

    const call1 = executeSpy.mock.calls[0][0].find((a: any) => a.id === 'goto')!;
    const call2 = executeSpy.mock.calls[1][0].find((a: any) => a.id === 'goto')!;

    // Page 1: offset=1, page=1
    expect(call1.params.url).toContain('q=test');
    // Page 2: offset=2, page=2
    expect(call2.params.url).toContain('q=test');

    // Check if variables from options also persist
    expect(call2.params.url).toContain('type=special_type');
  });
});

