import { FetcherOptions } from '@isdk/web-fetcher';
import { WebSearcher } from '../searcher';
import { PaginationConfig, SearchOptions } from '../types';

export class GoogleSearcher extends WebSearcher {

  get template(): FetcherOptions {
    return {
      engine: 'auto',
      url: 'https://www.google.com/search?q=${query}&start=${offset}&tbs=${tbs}&tbm=${tbm}&gl=${gl}&hl=${hl}&safe=${safe}',
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

  protected override formatOptions(options: SearchOptions): Record<string, any> {
    const vars: Record<string, any> = {};

    // Map Time Range
    if (options.timeRange) {
      if (typeof options.timeRange === 'string') {
        const timeMap: Record<string, string> = {
          day: 'qdr:d',
          week: 'qdr:w',
          month: 'qdr:m',
          year: 'qdr:y',
        };
        if (timeMap[options.timeRange]) {
          vars.tbs = timeMap[options.timeRange];
        }
      } else {
        // Custom Range
        const fromDate = new Date(options.timeRange.from);
        const toDate = options.timeRange.to ? new Date(options.timeRange.to) : new Date();
        
        if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
           const format = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
           vars.tbs = `cdr:1,cd_min:${format(fromDate)},cd_max:${format(toDate)}`;
        }
      }
    }

    // Map Category
    if (options.category) {
      const catMap: Record<string, string> = {
        images: 'isch',
        videos: 'vid',
        news: 'nws',
      };
      if (catMap[options.category]) {
        vars.tbm = catMap[options.category];
      }
    }

    // Map Region/Language
    if (options.region) vars.gl = options.region;
    if (options.language) vars.hl = options.language;
    
    // Map SafeSearch
    if (options.safeSearch) {
        if (options.safeSearch === 'strict') vars.safe = 'active';
        else if (options.safeSearch === 'off') vars.safe = 'images'; 
        // 'moderate' is usually default, so we might not need to set anything, 
        // or explicitly set safe=active (which is often strict/moderate depending on region context).
        // Google simplified safe search to 'active' (on) or 'images' (blur explicit images) or nothing (off).
    }

    return vars;
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