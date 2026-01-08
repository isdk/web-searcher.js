import { FetchActionOptions, FetcherOptions, FetchSession } from "@isdk/web-fetcher";
import { addBaseFactoryAbility, IBaseFactoryOptions } from "custom-factory";
import { PaginationConfig, SearchContext, SearchOptions, StandardSearchResult } from "./types";
import { injectVariables } from "./utils/inject";

/**
 * Constructor definition for Searcher subclasses.
 */
export type SearcherConstructor = new (options?: FetcherOptions) => WebSearcher;

/**
 * The abstract base class for all search engines.
 * It extends FetchSession, meaning each Searcher instance is an active session
 * capable of maintaining state (cookies, storage) across multiple searches.
 */
export abstract class WebSearcher extends FetchSession {
  // the registered item is not a factory
  static _isFactory = false;

  /**
   * Custom engine name. If not provided, derived from class name.
   */
  // @ts-ignore
  declare static name?: string;
  /**
   * Engine aliases.
   */
  declare static aliases?: string[];

  /**
   * Registers a search engine class.
   *
   * @param ctor - The search engine class to register.
   * @param options - Registration options. If string, it is the registered name.
   */
  declare static register: (ctor: typeof WebSearcher, options?: IBaseFactoryOptions | string) => boolean;

  /**
   * Unregisters a search engine.
   *
   * @param name - The name or class to unregister.
   */
  declare static unregister: (name?: string | typeof WebSearcher) => void;

  /**
   * Retrieves a registered search engine class by name.
   *
   * @param name - The name of the engine (e.g., 'Google').
   */
  declare static get: (name: string) => typeof WebSearcher;

  /**
   * Creates an instance of the registered search engine.
   *
   * @param name - The name of the engine.
   * @param args - Arguments to pass to the constructor.
   */
  declare static createObject: (name: string, ...args: any[]) => WebSearcher;

  /**
   * Iterates over all registered engines.
   *
   * @param cb - Callback function.
   */
  declare static forEach: (cb: (ctor: typeof WebSearcher, name: string) => void) => void;

  /**
   * Sets aliases for a registered engine.
   *
   * @param ctor - The search engine class.
   * @param aliases - Aliases to add.
   */
  declare static setAliases: (ctor: typeof WebSearcher, ...aliases: string[]) => void;

  /**
   * Static helper to execute a one-off search.
   * It creates an instance, executes the search, and then disposes the session.
   */
  static async search(
    engineName: string,
    query: string,
    options: SearchOptions & FetcherOptions = {}
  ): Promise<StandardSearchResult[]> {
    const instance = (this as any).createObject(engineName, options) as WebSearcher;
    if (!instance) {
      throw new Error(`Search engine not found: ${engineName}`);
    }

    try {
      return await instance.search(query, options);
    } finally {
      await instance.dispose();
    }
  }

  // === Instance Members ===

  /**
   * The declarative template for the fetch options.
   * Subclasses must implement this getter to provide the engine configuration.
   * Supports variable injection (e.g., ${query}).
   */
  abstract get template(): FetcherOptions;

  /**
   * Optional pagination configuration.
   */
  get pagination(): PaginationConfig | undefined {
    return undefined;
  }

  constructor(options: FetcherOptions = {}) {
    super(options);
  }

  /**
   * Executes a search query.
   *
   * @param query - The search query string.
   * @param options - Optional search parameters (e.g., limit).
   * @returns A promise resolving to an array of standardized search results.
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<StandardSearchResult[]> {
    const limit = options.limit || 10;
    const allResults: StandardSearchResult[] = [];

    let page = 0;
    const startValue = this.pagination?.startValue ?? 0;
    const increment = this.pagination?.increment ?? 1;

    // Use the template to determine the base session options (like engine preference)
    // We merge these into the session's context if needed, but FetchSession takes options in constructor.
    // However, the 'actions' and 'url' will be driven by the loop below.

    while (allResults.length < limit) {
      // 1. Calculate engine-specific variables
      const engineVars = this.formatOptions(options);

      // 2. Calculate variables for the current page
      const offset = startValue + (page * increment);
      const variables = {
        ...options,
        ...engineVars,
        query,
        page: page + startValue,
        offset,
        limit
      };

      // 3. Inject variables into the template
      // This creates a new options object with resolved strings (e.g., url with query)
      const currentOptions = injectVariables(this.template, variables);

      // 4. Prepare Actions
      const actions: FetchActionOptions[] = [];

      // Handling navigation logic
      if (page === 0 || this.pagination?.type === 'url-param') {
        if (currentOptions.url) {
          actions.push({ id: 'goto', params: { url: currentOptions.url } });
        }
      } else if (this.pagination?.type === 'click-next' && this.pagination.nextButtonSelector) {
        actions.push({ id: 'click', params: { selector: this.pagination.nextButtonSelector } });
        actions.push({ id: 'waitFor', params: { networkIdle: true, ms: 500 } });
      }

      // Append template actions (excluding duplicate goto)
      if (currentOptions.actions) {
        const templateActions = currentOptions.actions.filter(a => {
          if (actions.length > 0 && actions[0].id === 'goto' && a.id === 'goto') return false;
          return true;
        });
        actions.push(...templateActions);
      }

      // 5. Execute the fetch actions
      // Note: We use executeAll from FetchSession (this)
      // We might need to handle 'engine' switching if the template requires a specific engine
      // that differs from the session default. FetchSession.execute handles this via maybeCreateEngine.
      // But passing 'engine' in options to executeAll isn't directly supported on individual actions usually,
      // but creating the session with the right engine preference is handled in constructor.
      // If the template specifies 'engine', we should probably respect it for the session context.
      if (currentOptions.engine && this.context.engine !== currentOptions.engine && currentOptions.engine !== 'auto') {
         // This is a complex case: changing engine mid-flight.
         // For now, we assume the session was created with the right engine or 'auto'.
      }

      const { outputs } = await this.executeAll(actions);

      // 6. Extract and transform results
      const context: SearchContext = { query, page, limit: options.limit };
      let results: StandardSearchResult[] = [];

      // Call instance transform method
      results = await this.transform(outputs, context);

      // Apply user-level transform if provided
      if (options.transform) {
        results = await options.transform(results, context);
      }

      if (!results || results.length === 0) break;

      allResults.push(...results);

      if (allResults.length >= limit || !this.pagination) break;

      page++;
      if (page > 10) break; // Hard limit
    }

    return allResults.slice(0, limit);
  }

  /**
   * Transform and clean the raw extracted results.
   * Subclasses should override this method to provide engine-specific cleaning.
   *
   * @param outputs - The complete outputs object from the fetch actions.
   * @param context - The search context.
   */
  protected async transform(
    outputs: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: SearchContext
  ): Promise<StandardSearchResult[]> {
    return outputs['results'] || [];
  }

  /**
   * Transforms standard options into engine-specific template variables.
   * Subclasses should override this to map 'timeRange', 'category', etc. to URL parameters.
   */
  protected formatOptions(options: SearchOptions): Record<string, any> {
    return { ...options };
  }
}

// Apply the factory mixin
addBaseFactoryAbility(WebSearcher);

// Set the prototype name to 'Searcher' to allow automatic name extraction
// e.g., 'GoogleSearcher' -> 'Google' (baseNameOnly=1)
// @ts-ignore
WebSearcher.prototype.name = 'Searcher';