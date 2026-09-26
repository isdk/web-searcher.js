/**
 * Interface representing a standardized search result item.
 * This ensures consistency across different search engines.
 */
export interface StandardSearchResult {
  /** The title of the search result. */
  title: string;

  /** The URL of the search result. */
  url: string;

  /** A brief snippet or description of the result. */
  snippet?: string;

  /** An optional image URL associated with the result. */
  image?: string;

  /** The date the result was published or last updated. */
  date?: string | Date;

  /** The author or source name of the result. */
  author?: string;

  /** The favicon URL of the source website. */
  favicon?: string;

  /** The rank or position of the result (usually 1-indexed). */
  rank?: number;

  /** The source website name (e.g., 'GitHub', 'StackOverflow'). */
  source?: string;

  /** Allows for engine-specific extra fields (e.g., siteIcon, category). */
  [key: string]: any;
}

/**
 * Configuration for pagination strategies.
 * Defines how the searcher should navigate to the next page of results.
 */
export interface PaginationConfig {
  /**
   * The type of pagination mechanism:
   * - 'url-param': Pagination is handled by modifying URL parameters (e.g., `?page=2` or `?start=10`).
   * - 'click-next': Pagination is handled by clicking a "Next" button on the page (only works in 'browser' mode).
   */
  type: 'url-param' | 'click-next';

  /**
   * The name of the URL parameter used for pagination.
   * Required if type is 'url-param'.
   * @example 'start' for Google, 'page' or 'p' for others.
   */
  paramName?: string;

  /**
   * The starting value for the pagination parameter.
   * @default 0
   */
  startValue?: number;

  /**
   * The increment step for each page.
   * - If the parameter represents an item offset (like Google's 'start'), this might be 10.
   * - If the parameter represents a page number, this is usually 1.
   * @default 1
   */
  increment?: number;

  /**
   * The CSS selector for the "Next" page button.
   * Required if type is 'click-next'.
   */
  nextButtonSelector?: string;

  /**
   * The safety threshold for the maximum number of pages to fetch automatically
   * in a single search call.
   *
   * Even if the requested `limit` of results hasn't been reached, the searcher
   * will stop after this many pages to prevent infinite loops or excessive API usage.
   *
   * @default 10
   */
  maxPages?: number;
}

/**
 * Context object passed to the transform function.
 */
export interface SearchContext {
  /** The original search query. */
  query: string;

  /** The current page index (0-based). */
  page: number;

  /** The requested limit of results. */
  limit?: number;

  /** Allows for custom variables passed via search options. */
  [key: string]: any;

  /** The baseUrl used for this specific fetch (if multi-instance is enabled) */
  baseUrl?: string;

  /** The name of the engine executing the search */
  engine?: string;

  /** The `excludeUrls` option of the current search, if any. */
  excludeUrls?: string[];
}

export type SearchTimeRangePreset = 'all' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface CustomTimeRange {
  /** Start date (Date object or string like 'YYYY-MM-DD'). */
  from: Date | string;
  /** End date (Date object or string like 'YYYY-MM-DD'). Defaults to current date if omitted. */
  to?: Date | string;
}

export type SearchTimeRange = SearchTimeRangePreset | CustomTimeRange;

export type SearchCategory = 'all' | 'images' | 'videos' | 'news' | string;

export type SafeSearchLevel = 'off' | 'moderate' | 'strict';

/**
 * Options provided when executing a search.
 */
export interface SearchOptions {
  /** The maximum number of results to retrieve. */
  limit?: number;

  /**
   * The maximum number of pages (fetch cycles) allowed to reach the requested `limit`.
   *
   * This is a safety guard. If the `limit` is high but each page has few results,
   * the searcher will stop once this page count is reached.
   *
   * If not provided, it defaults to the value in `PaginationConfig` or 10.
   */
  maxPages?: number;

  /**
   * Date range for the search results.
   * Default: 'all'
   */
  timeRange?: SearchTimeRange;

  /**
   * The category of results to return.
   * Default: 'all' (web search)
   */
  category?: SearchCategory;

  /**
   * Region code (ISO 3166-1 alpha-2) to bias results (e.g., 'US', 'CN', 'JP').
   */
  region?: string;

  /**
   * Language code (ISO 639-1) for the interface or results (e.g., 'en', 'zh-CN').
   */
  language?: string;

  /**
   * Safe search filtering level.
   * Default: engine dependent (usually 'moderate' or 'strict' by default).
   */
  safeSearch?: SafeSearchLevel;

  /**
   * A custom transform function to filter or modify results at runtime.
   * This runs AFTER the engine-level transform.
   */
  transform?: (
    results: StandardSearchResult[],
    context: SearchContext
  ) => Promise<StandardSearchResult[]> | StandardSearchResult[];

  /** Any other custom variables to be injected into the template. */
  [key: string]: any;

  /**
   * Allows the user to dynamically specify or override the base URLs for the engines.
   * Can be an array of URLs for a single engine, or a map of engine names to URL arrays.
   */
  baseUrls?: string[] | Record<string, string[]>;

  /**
   * User-defined callback to validate the fetched results for a page.
   * If it returns false, the fetch is considered a failure, triggering the retry/failover mechanism.
   */
  validator?: (
    results: StandardSearchResult[],
    context: SearchContext
  ) => boolean | Promise<boolean>;

  /**
   * If true (default), the searcher will attempt to fulfill the requested `limit`
   * by falling back to subsequent engines in the chain if previous ones are exhausted.
   * If false, it will stop after the first successful engine regardless of whether 
   * the limit was reached.
   */
  fillLimit?: boolean;

  /**
   * Specifies which page index to start the search from.
   * Useful when delegating pagination across different sessions.
   * @default 0
   */
  startPage?: number;

  /**
   * How multiple engines are executed when `engineNames` is an array.
   *
   * - `'race'` (default): all engines are started concurrently. As soon as one
   *   engine reaches the requested `limit`, the remaining engines are aborted
   *   and the results are returned immediately. If the first engines to settle
   *   do not reach the `limit`, a grace period (`gracePeriodMs`) waits for the
   *   others before returning whatever has been collected.
   * - `'fallback'`: the original sequential behavior. Engines are tried one by
   *   one in order; the next engine is only used when the previous one fails
   *   or does not fill the `limit`.
   *
   * A single engine name (not an array) always uses the sequential path.
   * @default 'race'
   */
  strategy?: 'race' | 'fallback';

  /**
   * Grace period in milliseconds for the `'race'` strategy.
   *
   * After the first engines settle without reaching the `limit`, the searcher
   * waits this long for the remaining engines before returning the collected
   * results anyway. Set to `0` to return as soon as the first engine settles.
   * @default 2000
   */
  gracePeriodMs?: number;

  /**
   * Maximum number of engines searched simultaneously under the `'race'`
   * strategy (see {@link strategy}). Extra engines wait in declaration order
   * for a free slot. Has no effect on `'fallback'`.
   * @default Infinity
   */
  concurrency?: number;

  /**
   * A list of URLs to exclude from the search results.
   *
   * Results whose URL matches an entry are dropped.
   * - Plain string entries are matched by exact URL equality.
   * - Entries in the `/pattern/flags` form (e.g. `/example\.com\//i`) are treated as RegExp.
   *
   * Filtering runs after result validation (in the searcher's `filterResults`
   * hook), so subclass `validateFetchResult` overrides and the `validator`
   * option always see the raw page results, and an all-excluded page never
   * triggers the failover mechanism. Such a page is not treated as exhausted
   * either: the searcher keeps fetching subsequent pages until the `limit` is
   * reached.
   */
  excludeUrls?: string[];
}