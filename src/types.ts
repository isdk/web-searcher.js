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
  
  /** Allows for engine-specific extra fields (e.g., rank, author, date). */
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
}

export type SearchTimeRangePreset = 'all' | 'day' | 'week' | 'month' | 'year';

export interface CustomTimeRange {
  /** Start date (Date object or string like 'YYYY-MM-DD'). */
  from: Date | string;
  /** End date (Date object or string like 'YYYY-MM-DD'). Defaults to current date if omitted. */
  to?: Date | string;
}

export type SearchTimeRange = SearchTimeRangePreset | CustomTimeRange;

export type SearchCategory = 'all' | 'images' | 'videos' | 'news';

export type SafeSearchLevel = 'off' | 'moderate' | 'strict';

/**
 * Options provided when executing a search.
 */
export interface SearchOptions {
  /** The maximum number of results to retrieve. */
  limit?: number;
  
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
}