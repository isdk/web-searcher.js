import { FetcherOptions } from '@isdk/web-fetcher';
import { WebSearcher } from '../searcher';
import { PaginationConfig, SearchOptions } from '../types';

/**
 * A sample implementation of a Google Search scraper.
 *
 * @remarks
 * **⚠️ DEMO ONLY ⚠️**
 *
 * This class serves as a **reference implementation** to demonstrate how to extend
 * the `WebSearcher` base class. It is **NOT intended for production use**.
 *
 * Google frequently changes its HTML structure and employs sophisticated anti-bot measures.
 * A production-grade Google scraper would require robust proxy rotation, CAPTCHA solving,
 * and constant maintenance of selectors, or usage of an official API.
 *
 * Use this class to understand:
 * 1. How to define a fetch template with variable injection.
 * 2. How to map standard options (like time range) to engine-specific URL parameters.
 * 3. How to handle pagination.
 * 4. How to transform and clean raw extracted data.
 */
export class GoogleSearcher extends WebSearcher {
  static override alias = ['google'];

  /**
   * Defines the fetch template for Google Search.
   *
   * @returns The fetcher configuration including the URL pattern and extraction rules.
   */
  get template(): FetcherOptions {
    return {
      engine: 'browser',
      browser: {
        headless: false,
      },
      url: 'https://www.google.com/search?q=${query}&start=${offset}&tbs=${tbs}&tbm=${tbm}&gl=${gl}&hl=${hl}&safe=${safe}',
      actions: [
        {
          id: 'extract',
          storeAs: 'results',
          "params": {
            "type": "array",
            "selector": "#main #search",
            "items": {
              "url": { "selector": "a:has(h3)", "attribute": "href", "required": true },
              "title": { "selector": "a:has(h3) h3", "required": true, "mode": "innerText" },
              "snippet": { "selector": "div[style*='-webkit-line-clamp']", "type": "html" }
            }
          }
        }
      ]
    };
  }

  /**
   * Configures pagination for Google Search results.
   * Uses the 'start' URL parameter, incrementing by 10 for each page.
   */
  override get pagination(): PaginationConfig {
    return {
      type: 'url-param',
      paramName: 'start',
      startValue: 0,
      increment: 10
    };
  }

  /**
   * Maps standard `SearchOptions` to Google's specific URL parameters.
   *
   * - `timeRange` -> `tbs` (e.g., 'qdr:d' for day)
   * - `category` -> `tbm` (e.g., 'isch' for images)
   * - `region` -> `gl`
   * - `language` -> `hl`
   * - `safeSearch` -> `safe`
   *
   * @param options - The user-provided search options.
   * @returns A map of variables to inject into the URL template.
   */
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

  /**
   * Cleans and normalizes the extracted results.
   * Specifically, it unwraps Google's redirect URLs (starting with `/url?q=`).
   *
   * @param outputs - The raw outputs from the fetcher.
   * @returns An array of cleaned search results.
   */
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
