import { FetchActionOptions, FetcherOptions, FetchSession } from "@isdk/web-fetcher";
import { addBaseFactoryAbility, IBaseFactoryOptions } from "custom-factory";
import { PaginationConfig, SearchContext, SearchOptions, StandardSearchResult } from "./types";
import { injectVariables } from "./utils/inject";
import { isRegExpStr, toRegExp } from 'util-ex';
import { cloneDeep, defaultsDeep } from "lodash-es";

/**
 * Constructor definition for Searcher subclasses.
 */
export type SearcherConstructor = new (options?: FetcherOptions) => WebSearcher;
export type { FetcherOptions };

/**
 * Checks whether a URL matches an exclude pattern.
 * String patterns require an exact match; RegExp patterns are tested against the URL.
 */
function matchExcludeUrl(url: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0; // avoid stateful `.test()` when the regex carries the 'g' flag
    return pattern.test(url);
  }
  return pattern === url;
}

/**
 * Checks whether an error represents a cancellation we initiated ourselves
 * (e.g. aborting loser engines after the race has been decided), as opposed to
 * a real engine failure.
 */
function isAbortLikeError(error: any): boolean {
  if (!error) return false;
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
  if (error.code === 499 /* ErrorCode.Aborted */) return true;
  if (typeof error.code === 'string' && error.code.toUpperCase().includes('ABORT')) return true;
  const msg = typeof error.message === 'string' ? error.message : '';
  return /abort|cancel/i.test(msg);
}

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
   * Static helper to execute a one-off search, a concurrent race, or a fallback
   * chain across multiple engines.
   *
   * When `engineNames` is an array (and `options.strategy` is not `'fallback'`),
   * all engines are started concurrently (`strategy: 'race'`, the default):
   *
   * - Every engine runs with the full requested `limit`.
   * - The first engine whose results reach the `limit` wins: the remaining
   *   engines are aborted and the results are returned immediately.
   * - Otherwise, once engines have settled without reaching the `limit`, the
   *   race waits up to `options.gracePeriodMs` (default 2000) for the remaining
   *   engines, then returns whatever has been collected.
   * - Results are merged in `engineNames` declaration order and deduplicated by
   *   URL, mirroring the sequential fallback order.
   *
   * With `strategy: 'fallback'` (or a single engine name), engines are tried one
   * by one in order: the next engine is only used when the previous one fails or
   * is exhausted.
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
    const strategy = options.strategy ??
      (this.getDefaultOptions() as any).strategy ?? 'race';
    if (engines.length > 1 && strategy !== 'fallback') {
      return this._searchRace(engines, query, options);
    }

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
  /**
   * Concurrent race across all engines (`strategy: 'race'`).
   *
   * Every engine runs with the full requested `limit`. Settled engines are
   * merged into a shared, URL-deduplicated pool in declaration order. The race
   * ends as soon as:
   * - the pool reaches the `limit` (remaining engines are aborted), or
   * - `fillLimit === false` and the first engine returned any result, or
   * - the grace period (`gracePeriodMs`) expires after the first settle, or
   * - all engines have settled (the pool is returned as-is).
   *
   * At most `options.concurrency` engines run simultaneously; the rest wait in
   * declaration order for a free slot (queued engines are never started once
   * the race has been decided).
   *
   * If every engine failed and at least one error was not caused by our own
   * cancellation, the first such error is rethrown (mirrors the sequential
   * fallback behavior).
   *
   * @internal
   */
  private static async _searchRace(
    engines: string[],
    query: string,
    options: SearchOptions & FetcherOptions
  ): Promise<StandardSearchResult[]> {
    // Resolve the effective limit from the first engine's defaults (same as sequential).
    const firstCtor = (this as any).get(engines[0]);
    const firstDefaults = firstCtor
      ? firstCtor.getDefaultOptions()
      : (this as any).getDefaultOptions();
    const firstEffective = defaultsDeep({}, options, firstDefaults) as SearchOptions;
    const limit = firstEffective.limit || 10;
    const gracePeriodMs = (options.gracePeriodMs ??
      (this.getDefaultOptions() as any).gracePeriodMs ?? 2000) as number;
    const concurrencyOption = (options as any).concurrency ??
      (this.getDefaultOptions() as any).concurrency;
    const concurrency =
      typeof concurrencyOption === 'number' && concurrencyOption >= 1
        ? Math.floor(concurrencyOption)
        : Infinity;
    interface RaceRunner {
      engineName: string;
      engineIndex: number;
      promise: Promise<StandardSearchResult[]>;
      /** Aborts the in-flight search (if any) and disposes the engine session. */
      abort: () => Promise<void>;
      /** Starts the engine search (concurrency scheduler entry point). */
      start: () => void;
      /** True once the runner has been started by the scheduler. */
      started: boolean;
      /** The engine instance once created; undefined while still creating. */
      instance?: WebSearcher;
      /** URL-deduplicated results, kept per runner for the ordered final merge. */
      results?: StandardSearchResult[];
      /** This engine's effective fillLimit === false flag (from its own defaults). */
      fillLimitFalse: boolean;
      /** True once cancellation has been requested for this runner. */
      abortRequested: boolean;
      /** True once the runner promise has settled. */
      settled: boolean;
      /** True when the runner settled without an error (even with zero items). */
      succeeded?: boolean;
    }

    const runners: RaceRunner[] = engines.map((engineName, engineIndex) => {
      const runner: RaceRunner = {
        engineName,
        engineIndex,
        promise: undefined as any,
        abort: undefined as any,
        start: undefined as any,
        fillLimitFalse: false,
        abortRequested: false,
        settled: false,
        started: false,
      };

      runner.start = () => {
        if (runner.started) return;
        runner.started = true;
        runner.promise = (async (): Promise<StandardSearchResult[]> => {
          const engineCtor = (this as any).get(engineName);
          const engineDefaults = engineCtor
            ? engineCtor.getDefaultOptions()
            : (this as any).getDefaultOptions();
          // Final effective options for this engine: Call Options > Engine Defaults.
          // Each competitor uses its own effective limit and fillLimit.
          const currentOptions = defaultsDeep({}, options, engineDefaults);
          runner.fillLimitFalse = (currentOptions as any).fillLimit === false;
          const instanceOptions = { ...options, ...currentOptions } as SearchOptions & FetcherOptions;
          const instance = (this as any).createObject(engineName, instanceOptions) as WebSearcher;
          if (!instance) {
            throw new Error(`Search engine not found: ${engineName}`);
          }
          runner.instance = instance;
          if (runner.abortRequested) {
            // The race was decided while we were creating the instance.
            await instance.dispose().catch(() => { });
            return [];
          }
          try {
            return await instance.search(query, instanceOptions);
          } catch (error: any) {
            if (runner.abortRequested) {
              // A cancelled loser is never a real failure, whatever the shape of
              // the underlying cancellation error.
              return [];
            }
            throw error;
          }
        })();
        runner.promise.then(
          (results) => settle(runner, results),
          (error) => settle(runner, undefined, error)
        );
      };

      runner.abort = async () => {
        if (runner.abortRequested) return;
        runner.abortRequested = true;
        const instance = runner.instance;
        if (!instance) return; // not created yet; the runner self-disposes
        try {
          const session = instance as any;
          if (typeof session.abort === 'function') {
            // web-fetcher with abort support: cancel in-flight work (rejecting
            // pending requests/queued actions), then free the resources.
            await session.abort('race: superseded by another engine');
          } else {
            // Older web-fetcher: best-effort disposal only.
            await instance.dispose();
          }
        } catch {
          // Loser cleanup must never escape the race.
        }
      };

      return runner;
    });

    const errors: Array<{ engineName: string; error: any }> = [];
    let pendingCount = runners.length;
    let exitDecided = false;
    let graceTimer: ReturnType<typeof setTimeout> | undefined;
    // Set when the grace period expired with an empty pool: instead of
    // returning nothing, wait for the remaining engines to settle on their own
    // (bounded by their own timeouts). Returning zero results while competitors
    // are still running is almost never what the caller wants.
    let waitAllSettled = false;
    // Set when the exit was decided by fillLimit:false: in the sequential path
    // the chain stops after the first successful engine whose effective
    // fillLimit is false, so under the race we only merge the results of engines
    // declared at or before that one.
    let fillLimitCutIndex: number | undefined;
    // True when at least one engine was still running when the race ended
    // (i.e. it got cancelled by us); its cancellation is not a real failure.
    let hasAbortedLosers = false;
    // Incremental deduplicated count across all settled runners, used only for
    // the exit decision; the final ordered merge happens after the race ends.
    let arrivedCount = 0;
    const arrivedUrls = new Set<string>();

    let resolveExit!: () => void;
    const exitPromise = new Promise<void>((resolve) => { resolveExit = resolve; });

    const decideExit = () => {
      if (exitDecided) return;
      exitDecided = true;
      if (graceTimer !== undefined) {
        clearTimeout(graceTimer);
        graceTimer = undefined;
      }
      // Cancel every still-running loser. Their rejections are swallowed by the
      // runner itself (abort-like errors) and cleanup is idempotent.
      for (const runner of runners) {
        if (!runner.settled) {
          hasAbortedLosers = true;
          runner.abort();
        }
      }
      resolveExit();
    };

    const armGraceIfNeeded = () => {
      if (exitDecided || graceTimer !== undefined) return;
      if (gracePeriodMs <= 0) {
        decideExit();
        return;
      }
      graceTimer = setTimeout(() => {
        graceTimer = undefined;
        if (exitDecided) return;
        if (arrivedCount === 0) {
          // Empty pool: keep waiting for the remaining engines instead of
          // returning zero results (bounded by their own timeouts).
          waitAllSettled = true;
          return;
        }
        decideExit();
      }, gracePeriodMs);
      // Don't keep the event loop alive just for the grace period.
      (graceTimer as any)?.unref?.();
    };

    const settle = (runner: RaceRunner, results?: StandardSearchResult[], error?: any) => {
      runner.settled = true;
      runner.succeeded = error === undefined;
      if (error !== undefined) {
        if (!exitDecided && !isAbortLikeError(error)) {
          errors.push({ engineName: runner.engineName, error });
          console.warn(`[WebSearcher] Engine '${runner.engineName}' failed:`, error);
        }
      } else {
        // Always keep completed results (even when the exit was already
        // decided): the final merge runs after the exit, ordered by engine
        // declaration, so nothing that completed successfully is lost.
        if (results && results.length > 0) {
          const fresh: StandardSearchResult[] = [];
          for (const res of results) {
            if (res.url && !arrivedUrls.has(res.url)) {
              arrivedUrls.add(res.url);
              fresh.push(res);
              arrivedCount += 1;
            }
          }
          runner.results = fresh;
        }
        if (!exitDecided) {
          if (runner.fillLimitFalse) {
            // The chain would have stopped right here in the sequential path.
            fillLimitCutIndex = runner.engineIndex;
            decideExit();
          } else if (arrivedCount >= limit) {
            decideExit();
          }
        }
      }
      pendingCount -= 1;
      if (exitDecided) return;
      if (pendingCount === 0) {
        // Everything settled without reaching the limit.
        decideExit();
      } else if (!waitAllSettled) {
        // Give the remaining engines a chance to top up the pool.
        armGraceIfNeeded();
      }
      // Free slot: the next queued engine may start now. No-op after the exit
      // is decided (queued engines are never started once the race is over).
      pump();
    };

    // Concurrency scheduler: engines start in declaration order, at most
    // `concurrency` at a time. Invariant: active = startedCount - settledCount
    // (only started runners can settle).
    let nextStartIndex = 0;
    let startedCount = 0;
    const pump = () => {
      if (exitDecided) return;
      const settledCount = runners.length - pendingCount;
      while (
        nextStartIndex < runners.length &&
        startedCount - settledCount < concurrency
      ) {
        runners[nextStartIndex++].start();
        startedCount += 1;
      }
    };

    pump();

    await exitPromise;

    // Dispose every engine session (winners included; losers were aborted above).
    await Promise.all(runners.map(async (runner) => {
      try {
        await runner.instance?.dispose().catch(() => { });
      } catch {
        // Ignore disposal failures.
      }
    }));

    // Final merge in engineNames declaration order: mirrors the sequential
    // fallback ordering, regardless of which engine answered first.
    // With fillLimit:false the chain is truncated at the first successful
    // engine (in declaration order) carrying that flag.
    const cutIndex = fillLimitCutIndex ?? runners.length - 1;
    const collected: StandardSearchResult[] = [];
    const seenUrls = new Set<string>();
    for (const runner of runners) {
      if (runner.engineIndex > cutIndex) break;
      for (const res of runner.results || []) {
        if (res.url && !seenUrls.has(res.url)) {
          seenUrls.add(res.url);
          collected.push(res);
        }
      }
    }

    if (
      collected.length === 0 &&
      errors.length > 0 &&
      !hasAbortedLosers &&
      runners.every((runner) => !runner.succeeded)
    ) {
      // Only treat failures as fatal when every engine genuinely failed on its
      // own. An engine that settled successfully (even with zero items) means
      // the search itself worked — like the sequential path, just return the
      // (possibly empty) pool. And if any engine was still running when we
      // gave up (grace period expired), those cancellations are not failures
      // either.
      throw errors[0].error;
    }

    return collected.slice(0, limit);
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

          // A page that produced no raw results at all means the engine is
          // exhausted. This check runs before validation/filtering: results that
          // are all filtered out later (e.g. by excludeUrls) still count as
          // produced, so the searcher keeps fetching the next page until the
          // limit is reached.
          exhausted = !results || results.length === 0;

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

          // 10. Filter results (the base implementation enforces excludeUrls).
          // This runs after validation so that subclass validateFetchResult
          // overrides and user validators always see the raw page results, and
          // an all-excluded page never triggers the failover mechanism.
          results = await this.filterResults(results, context);

          if (results && results.length > 0) {
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
   * Note: result exclusion via the `excludeUrls` search option is handled by
   * the {@link filterResults} hook, not this one, so overriding this hook does
   * not affect it.
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
   * Filters the results of a page before they are collected.
   *
   * The base implementation enforces the `excludeUrls` search option: results
   * whose URL matches an entry in `context.excludeUrls` are removed.
   * - Plain string entries are matched by exact URL equality.
   * - Entries in the `/pattern/flags` form (e.g. `/example\.com\//i`) are
   *   treated as RegExp.
   *
   * Subclasses can override this hook to customize filtering, or call
   * `super.filterResults(...)` to keep the default behavior.
   *
   * @param results - The results to filter (after validation).
   * @param context - Context including the current baseUrl and page.
   * @returns A promise resolving to the filtered results.
   */
  protected async filterResults(
    results: StandardSearchResult[],
    context: SearchContext
  ): Promise<StandardSearchResult[]> {
    const excludeUrls = context.excludeUrls;
    if (results && excludeUrls && excludeUrls.length > 0) {
      const patterns = excludeUrls.map(url => (isRegExpStr(url) ? toRegExp(url) : url));
      return results.filter(
        item => !item.url || !patterns.some(pattern => matchExcludeUrl(item.url, pattern))
      );
    }
    return results;
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
