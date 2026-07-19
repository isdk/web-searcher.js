import { FetchActionOptions, FetcherOptions, FetchSession } from "@isdk/web-fetcher";
import { addBaseFactoryAbility, IBaseFactoryOptions } from "custom-factory";
import { PaginationConfig, SearchContext, SearchOptions, StandardSearchResult } from "./types";
import { injectVariables } from "./utils/inject";
import { cloneDeep, defaultsDeep } from "lodash-es";

/**
 * Constructor definition for Searcher subclasses.
 */
export type SearcherConstructor = new (options?: FetcherOptions) => WebSearcher;
export type { FetcherOptions };

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

  /** Default base URLs for engines that support multiple instances. */
  declare static defaultBaseUrls?: string[];

  /** Globally shared index for tracking the currently active instance (node) across sessions. */
  static currentInstanceIndex?: number;

  /** @internal */
  static _defaultOptions?: SearchOptions;

  /**
   * Gets or sets the default search parameters for this specific engine class.
   * This does not include settings from parent classes.
   */
  static get defaultOptions(): SearchOptions {
    if (!Object.prototype.hasOwnProperty.call(this, '_defaultOptions')) {
      this._defaultOptions = {};
    }
    return this._defaultOptions!;
  }

  static set defaultOptions(options: SearchOptions) {
    this._defaultOptions = options;
  }

  /**
   * Retrieves the combined default search options by traversing the prototype chain.
   * Priority: Current class > Parent class > WebSearcher base class.
   */
  static getDefaultOptions(): SearchOptions {
    const chain: SearchOptions[] = [];
    let curr: any = this;

    while (curr && curr !== Object.prototype) {
      if (Object.prototype.hasOwnProperty.call(curr, '_defaultOptions') && curr._defaultOptions) {
        chain.push(curr._defaultOptions);
      }
      if (curr === WebSearcher) break;
      curr = Object.getPrototypeOf(curr);
    }

    return chain.length > 0 ? defaultsDeep({}, ...chain) : {};
  }

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
   * Static helper to execute a one-off search or a fallback chain.
   *
   * It creates an instance of the specified engine(s), executes the search, and automatically
   * falls back to the next engine in the list if the current one fails or is exhausted.
   *
   * @param engineNames - The name(s) of the engine(s) to use (e.g., 'Google' or ['SearXNG', 'Google']).
   * @param query - The search query string.
   * @param options - Combined search options and fetcher options.
   * @returns A promise resolving to an array of standardized search results.
   */
  static async search(
    engineNames: string | string[],
    query: string,
    options: SearchOptions & FetcherOptions = {}
  ): Promise<StandardSearchResult[]> {
    const engines = Array.isArray(engineNames) ? engineNames : [engineNames];
    const allResults: StandardSearchResult[] = [];

    for (let i = 0; i < engines.length; i++) {
      const engineName = engines[i];
      const engineCtor = (this as any).get(engineName);
      // Resolve all defaults for this engine (including global defaults)
      const engineDefaults = engineCtor ? engineCtor.getDefaultOptions() : (this as any).getDefaultOptions();

      // Final effective options for this engine: Call Options > Engine Defaults
      const currentOptions = defaultsDeep({}, options, engineDefaults);
      const limit = currentOptions.limit || 10;

      if (allResults.length >= limit) break;

      const remainingLimit = limit - allResults.length;
      // Pass the remaining limit to the instance
      const instanceOptions = { ...options, limit: remainingLimit };

      const instance = (this as any).createObject(engineName, instanceOptions) as WebSearcher;
      if (!instance) {
        throw new Error(`Search engine not found: ${engineName}`);
      }

      try {
        const results = await instance.search(query, instanceOptions);
        for (const res of results) {
          if (res.url && !allResults.some(r => r.url === res.url)) {
            allResults.push(res);
          }
        }

        if (allResults.length >= limit) {
          break;
        } else if (currentOptions.fillLimit === false) {
          break;
        }
      } catch (error) {
        console.warn(`[WebSearcher] Engine '${engineName}' failed completely:`, error);
        if (i === engines.length - 1 && allResults.length === 0) {
          throw error;
        }
      } finally {
        await instance.dispose();
      }
    }

    return allResults;
  }
  // === Instance Members ===

  /**
   * The declarative template for the fetch options.
   *
   * Subclasses can implement this getter to provide the engine configuration,
   * including the base URL, search parameters pattern, and extraction rules.
   *
   * This getter is **optional** if you override {@link getTemplate}.
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
  get template(): FetcherOptions {
    return {};
  }

  /**
   * Optional pagination configuration.
   * Defines how the searcher navigates to subsequent pages.
   *
   * If undefined, the searcher will only fetch the first page.
   */
  get pagination(): PaginationConfig | undefined {
    return undefined;
  }

  /**
   * Dynamically retrieves the fetch template based on current variables and search options.
   *
   * Subclasses can override this method to return different extraction rules (actions)
   * or URL patterns based on the search category, region, or other parameters.
   *
   * @param variables - The calculated variables (from formatOptions, pagination, etc.).
   * @param options - The original search options provided by the user.
   * @returns The fetcher configuration to be used for the current request.
   */
  protected getTemplate(variables: Record<string, any>, options: SearchOptions): FetcherOptions {
    return cloneDeep(this.template);
  }

  protected createContext(options: FetcherOptions = this.options) {
    // 1. Get the base template configuration
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { actions: _unused, ...templateConfig } = this.template;

    // 2. Merge config: Template > User Options
    // We use defaultsDeep to ensure template properties take precedence,
    // but missing properties are filled from user options.
    const effectiveOptions = defaultsDeep({}, templateConfig, options);

    // 3. Special handling for 'engine'
    // If template specifies 'auto' (or is missing) but user provided an explicit engine,
    // we want to respect the user's choice.
    if ((!templateConfig.engine || templateConfig.engine === 'auto') && options.engine) {
      effectiveOptions.engine = options.engine;
    }

    return super.createContext(effectiveOptions);
  }

  /**
   * Executes a search query.
   *
   * This method handles the pagination loop, multi-instance failover, variable injection,
   * fetching, and result transformation.
   *
   * @param query - The search query string.
   * @param options - Optional search parameters (e.g., limit, timeRange).
   * @returns A promise resolving to an array of standardized search results.
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<StandardSearchResult[]> {
    const constructor = this.constructor as typeof WebSearcher;
    options = defaultsDeep({}, options, this.options, constructor.getDefaultOptions()) as SearchOptions;

    const limit = options.limit || 10;
    const allResults: StandardSearchResult[] = [];
    const seenUrls = new Set<string>();

    let page = options.startPage || 0;
    const startValue = this.pagination?.startValue ?? 0;
    const increment = this.pagination?.increment ?? 1;
    const maxPages = options.maxPages || this.pagination?.maxPages || 10;
    const engineName = (this.constructor as any).name;

    // Resolve baseUrls for multi-instance support
    let baseUrls: string[] | undefined;
    if (options.baseUrls) {
      if (Array.isArray(options.baseUrls)) {
        baseUrls = options.baseUrls;
      } else if (typeof options.baseUrls === 'object') {
        baseUrls = options.baseUrls[engineName] || options.baseUrls[(this.constructor as any).alias?.[0]];
      }
    }
    if (!baseUrls || baseUrls.length === 0) {
      baseUrls = (this.constructor as any).defaultBaseUrls;
    }
    const hasBaseUrls = baseUrls && baseUrls.length > 0;

    let urlIndex = 0;
    if (hasBaseUrls && typeof (this.constructor as any).currentInstanceIndex === 'number') {
      urlIndex = (this.constructor as any).currentInstanceIndex;
    }

    let exhausted = false;

    while (allResults.length < limit) {
      let pageSuccess = false;
      let lastError: any = null;

      const instancesToTry = hasBaseUrls ? baseUrls!.length : 1;
      let attempts = 0;

      while (attempts < instancesToTry) {
        const baseUrl = hasBaseUrls ? baseUrls![urlIndex] : undefined;

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
          limit,
          baseUrl: baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl,
        };

        // 3. Resolve the template (it can be dynamic based on variables/options)
        const dynamicTemplate = this.getTemplate(variables, options);

        // 4. Inject variables into the template
        const templateWithOptions = injectVariables(dynamicTemplate, variables);

        // 5. Merge runtime options
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { actions: _ignoredUserActions, ...userOptionsNoActions } = options;
        const currentOptions = defaultsDeep({}, templateWithOptions, userOptionsNoActions) as FetcherOptions;

        // 6. Prepare Actions
        const actions: FetchActionOptions[] = [];
        const templateActions = currentOptions.actions || [];

        // Handling navigation logic
        if (page === (options.startPage || 0) || this.pagination?.type === 'url-param') {
          if (currentOptions.url) {
            const hasExplicitGoto = templateActions.some(
              a => (a.id ?? a.name ?? a.action) === 'goto' && a.params?.url === currentOptions.url
            );

            if (!hasExplicitGoto) {
              actions.push({ id: 'goto', params: { url: currentOptions.url } });
            }
          }
        } else if (this.pagination?.type === 'click-next' && this.pagination.nextButtonSelector) {
          actions.push({ id: 'click', params: { selector: this.pagination.nextButtonSelector } });
          actions.push({ id: 'waitFor', params: { networkIdle: true, ms: 500 } });
        }

        // Append template actions
        actions.push(...templateActions);

        // 7. Execute the fetch actions
        if (currentOptions.engine && this.context.engine !== currentOptions.engine && currentOptions.engine !== 'auto') {
          // Mid-flight engine context mismatch logic
        }

        try {
          const { outputs } = await this.executeAll(actions, options as any);
          const context: SearchContext = { ...options, query, page, baseUrl, engine: engineName };

          // 8. Extract and transform results
          let results = await this.transform(outputs, context);

          // Apply user-level transform if provided
          if (options.transform) {
            results = await options.transform(results, context);
          }

          // 9. VALIDATOR HOOK
          let isValid = true;
          if (this.validateFetchResult) {
            isValid = await this.validateFetchResult(results, context);
          }
          if (isValid && options.validator) {
            isValid = await options.validator(results, context);
          }

          if (!isValid) {
            throw new Error(`Results validation failed for engine: ${engineName}, url: ${baseUrl}`);
          }

          if (!results || results.length === 0) {
            // Exhausted! No more results from this engine.
            exhausted = true;
          } else {
            for (const res of results) {
              if (res.url && !seenUrls.has(res.url)) {
                seenUrls.add(res.url);
                allResults.push(res);
              }
            }
          }

          pageSuccess = true;
          break; // Success! Break out of the attempts loop.

        } catch (error) {
          lastError = error;
          // Failed. Try next baseUrl.
          if (hasBaseUrls) {
            urlIndex = (urlIndex + 1) % baseUrls!.length;
            (this.constructor as any).currentInstanceIndex = urlIndex; // Update global state
          }
          attempts++;
        }
      }

      if (!pageSuccess) {
        // All instances failed for this page!
        throw lastError || new Error(`All instances failed for engine: ${engineName}`);
      }

      if (exhausted) break; // Engine returned no results, stop paginating this engine

      if (allResults.length >= limit || !this.pagination) break;

      page++;
      if (page >= maxPages) break;
    }

    return allResults.slice(0, limit);
  }

  /**
   * Hook for subclasses to validate fetched results before they are accepted.
   * If this returns false, the instance manager will consider the fetch a failure
   * and automatically switch to the next available baseUrl (if any).
   *
   * @param results - The extracted results.
   * @param context - Context including the current baseUrl and page.
   * @returns A promise resolving to true if valid, false otherwise.
   */
  protected async validateFetchResult(
    results: StandardSearchResult[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: SearchContext
  ): Promise<boolean> {
    return true;
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
