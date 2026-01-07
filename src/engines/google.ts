import { FetcherOptions } from '@isdk/web-fetcher';
import { WebSearcher } from '../searcher';
import { PaginationConfig } from '../types';

export class GoogleSearcher extends WebSearcher {
  static readonly engineName = 'google';

  get template(): FetcherOptions {
    return {
      engine: 'auto',
      url: 'https://www.google.com/search?q=${query}&start=${offset}',
      actions: [
        {
          id: 'extract',
          storeAs: 'results',
          params: {
            type: 'array',
            selector: 'div.g',
            items: {
              title: { selector: 'h3' },
              url: { selector: 'a', attribute: 'href' },
              snippet: { selector: 'div[style*="-webkit-line-clamp"]' }
            }
          }
        }
      ]
    };
  }

  override get pagination(): PaginationConfig {
    return {
      type: 'url-param',
      paramName: 'start',
      startValue: 0,
      increment: 10
    };
  }

  protected override async transform(outputs: Record<string, any>): Promise<any[]> {
    const results = outputs['results'] || [];
    if (!Array.isArray(results)) return [];

    return results.map(item => {
      if (item.url && item.url.startsWith('/url?q=')) {
        try {
          const urlObj = new URL(item.url, 'https://www.google.com');
          const realUrl = urlObj.searchParams.get('q');
          if (realUrl) item.url = realUrl;
        } catch (e) {
          // Ignore
        }
      }
      return item;
    });
  }
}