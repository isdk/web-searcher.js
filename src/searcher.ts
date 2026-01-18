import { FetchActionOptions, FetcherOptions, FetchSession } from "@isdk/web-fetcher";
import { addBaseFactoryAbility, IBaseFactoryOptions } from "custom-factory";
import { PaginationConfig, SearchContext, SearchOptions, StandardSearchResult } from "./types";
import { injectVariables } from "./utils/inject";
import { defaultsDeep } from "lodash-es";

/**
 * Constructor definition for Searcher subclasses.
 */
export type SearcherConstructor = new (options?: FetcherOptions) => WebSearcher;

/**
 * The abstract base class for all search engines.
 *
 * It extends `FetchSession`, meaning each `WebSearcher` instance is an active session
 * capable of maintaining state (e.g., cookies, local storage) across multiple search queries.
 *
 * Developers should extend this class to create specific search engine implementations
 * (e.g., Google, Bing, DuckDuckGo).
 *
 * @example
 * ```typescript
 * class MySearcher extends WebSearcher {
 *   get template() {
 *     return { url: '...' };
 *   }
 * }
 * WebSearcher.register(MySearcher);
 * ```
 */
export abstract class WebSearcher extends FetchSession {
  // the registered item is not a factory
  static _isFactory = false;

  /**
   * Custom engine name. If not provided, it is derived from the class name.
   * For example, `GoogleSearcher` becomes `Google`.
   */
  // @ts-ignore
  declare static name?: string;
  /**
   * Engine alias(es). Can be a single string or an array of strings.
   * Useful for registering shorthand names (e.g., 'g' for 'Google').
   */
  declare static alias?: string | string[];

  /**
   * Registers a search engine class.
   *
   * @param ctor - The search engine class to register.
   * @param options - Registration options. If a string is provided, it is used as the registered name.
   * @returns `true` if registration was successful.
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
   * @returns The search engine class constructor.
   */
  declare static get: (name: string) => typeof WebSearcher;

  /**
   * Creates an instance of the registered search engine.
   *
   * @param name - The name of the engine.
   * @param args - Arguments to pass to the constructor.
   * @returns An instance of the search engine.
   */
  declare static createObject: (name: string, ...args: any[]) => WebSearcher;

  /**
   * Iterates over all registered engines.
   *
   * @param cb - Callback function to invoke for each registered engine.
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
   *
   * It creates an instance of the specified engine, executes the search, and then
   * automatically disposes of the session.
   *
   * @param engineName - The name of the engine to use (e.g., 'Google').
   * @param query - The search query string.
   * @param options - Combined search options and fetcher options.
   * @returns A promise resolving to an array of standardized search results.
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
   *
   * Subclasses **must** implement this getter to provide the engine configuration,
   * including the base URL, search parameters pattern, and extraction rules.
   *
   * Supports variable injection using syntax like `${query}`, `${offset}`, etc.
   *
   * @example
   * ```typescript
   * get template() {
   *   return {
   *     url: 'https://example.com/search?q=${query}',
   *     actions: [ ... ]
   *   };
   * }
   * ```
   */
  abstract get template(): FetcherOptions;

  /**
   * Optional pagination configuration.
   * Defines how the searcher navigates to subsequent pages.
   *
   * If undefined, the searcher will only fetch the first page.
   */
  get pagination(): PaginationConfig | undefined {
    return undefined;
  }

  protected createContext(options: FetcherOptions = this.options) {
    const template = this.template;
    // 1. Merge config: Template > User Options
    // We use defaultsDeep to ensure template properties take precedence,
    // but missing properties are filled from user options.
    const effectiveOptions = defaultsDeep({}, template, options);

    // 2. Special handling for 'engine'
    // If template specifies 'auto' (or is missing) but user provided an explicit engine,
    // we want to respect the user's choice.
    if ((!template.engine || template.engine === 'auto') && options.engine) {
      effectiveOptions.engine = options.engine;
    }

    return super.createContext(effectiveOptions);
  }

  /**
   * Executes a search query.
   *
   * This method handles the pagination loop, variable injection, fetching,
   * and result transformation.
   *
   * @param query - The search query string.
   * @param options - Optional search parameters (e.g., limit, timeRange).
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
    // We merge these into the session's context via createContext -> super().
    // However, for the per-request options in the loop, we need to re-evaluate.

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
      const templateWithOptions = injectVariables(this.template, variables);

      // 4. Merge runtime options
      // Template takes precedence (via defaultsDeep logic in createContext),
      // but here we ensure any runtime-only options (like timeoutMs provided in search call)
      // are mixed in if not strictly defined by template.
      // defaultsDeep(dest, source) -> keeps dest, fills from source.
      const currentOptions = defaultsDeep({}, templateWithOptions, options) as FetcherOptions;

      // 5. Prepare Actions
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

      // 6. Execute the fetch actions
      // Note: We use executeAll from FetchSession (this)
      // If the template specifies 'engine', we should probably respect it for the session context.
      if (currentOptions.engine && this.context.engine !== currentOptions.engine && currentOptions.engine !== 'auto') {
         // This is a complex case: changing engine mid-flight.
         // For now, we assume the session was created with the right engine or 'auto'.
      }

      const { outputs } = await this.executeAll(actions);

      // 7. Extract and transform results
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
   *
   * Subclasses should override this method to provide engine-specific cleaning,
   * normalization, or post-processing of the data extracted by the fetcher.
   *
   * @param outputs - The complete outputs object from the fetch actions.
   * @param context - The search context (query, page, etc.).
   * @returns A promise resolving to an array of standardized search results.
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
   *
   * Subclasses should override this to map standard options like 'timeRange',
   * 'category', 'region' into the specific URL parameters required by the engine
   * (e.g., mapping `timeRange: 'day'` to `tbs: 'qdr:d'` for Google).
   *
   * @param options - The search options provided by the user.
   * @returns A dictionary of variables to be injected into the template.
   */
  protected formatOptions(options: SearchOptions): Record<string, any> {
    return { ...options };
  }
}

// Apply the factory mixin
addBaseFactoryAbility(WebSearcher as any);

// Set the prototype name to 'Searcher' to allow automatic name extraction
// e.g., 'GoogleSearcher' -> 'Google' (baseNameOnly=1)
// @ts-ignore
WebSearcher.prototype.name = 'Searcher';