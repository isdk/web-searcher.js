import { describe, it, expect, vi } from 'vitest';
import { WebSearcher } from './searcher';
import { FetcherOptions } from '@isdk/web-fetcher';

// Mock Searcher for testing precedence logic
class MockSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      // Template defines a base URL with variables
      url: 'http://example.com/search?q=${query}&lang=${language}',
      // Template enforces a specific timeoutMs
      timeoutMs: 1000,
      headers: {
        'X-Template-Header': 'template-value',
        'X-Shared-Header': 'template-shared', // Conflict scenario
      },
      engine: 'auto', // Allow user override
    };
  }
}

// Searcher that strictly enforces an engine
class StrictEngineSearcher extends WebSearcher {
  get template(): FetcherOptions {
    return {
      engine: 'puppeteer',
      timeoutMs: 2000,
    };
  }
}

describe('WebSearcher Options & Context Logic', () => {

  describe('createContext (Configuration Priority)', () => {
    it('should prioritize template options over constructor options', () => {
      const searcher = new MockSearcher({
        timeoutMs: 5000, // User tries to set 5s
        headers: {
          'X-User-Header': 'user-value',
          'X-Shared-Header': 'user-shared', // User tries to override shared header
        }
      });

      // Verify Template (1000) > User (5000)
      expect(searcher.context.timeoutMs).toBe(1000);

      // Verify Deep Merge:
      // 1. Template keys exist
      // 2. User keys exist
      // 3. Shared keys take value from Template
      expect(searcher.context.headers).toMatchObject({
        'X-Template-Header': 'template-value',
        'X-Shared-Header': 'template-shared',
        'X-User-Header': 'user-value',
      });
    });

    it('should respect user engine choice when template is "auto"', () => {
      const searcher = new MockSearcher({ engine: 'playwright' });
      expect(searcher.context.engine).toBe('playwright');
    });

    it('should enforce template engine when explicitly defined', () => {
      const searcher = new StrictEngineSearcher({ engine: 'fetch' });
      // Template specifies 'puppeteer', so 'fetch' is ignored
      expect(searcher.context.engine).toBe('puppeteer');
    });
  });

  describe('search (Runtime Options & Injection)', () => {
    it('should inject variables from runtime options into actions', async () => {
      const searcher = new MockSearcher();

      // Spy on executeAll to inspect the generated actions
      const executeSpy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({
        outputs: { results: [] }
      } as any);

      // Execute search with custom runtime variables
      await searcher.search('test query', {
        language: 'zh-CN', // This variable exists in template URL
        extra: 'unused'
      });

      expect(executeSpy).toHaveBeenCalled();
      const actions = executeSpy.mock.calls[0][0];
      const gotoAction = actions.find(a => a.id === 'goto')!;

      // Verify the URL was constructed using the runtime variable
      expect(gotoAction.params.url).toBe('http://example.com/search?q=test query&lang=zh-CN');
    });

    it('should allow runtime options to be used as template variables', async () => {
      class CustomVarSearcher extends WebSearcher {
        get template(): FetcherOptions {
          return {
            // Template depends on a dynamic path variable
            url: 'http://test.com/${myVar}'
          };
        }
      }
      const searcher = new CustomVarSearcher();
      const spy = vi.spyOn(searcher, 'executeAll').mockResolvedValue({ outputs: { results: [] } } as any);

      // Pass the variable at runtime
      await searcher.search('q', { myVar: 'custom-path' });

      const actions = spy.mock.calls[0][0];
      expect(actions[0].params.url).toBe('http://test.com/custom-path');
    });
  });
});