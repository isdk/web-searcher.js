import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSearcher } from './searcher';
import { StandardSearchResult } from './types';

/**
 * Creates and registers a mock engine whose search() behavior is controlled by
 * the given handler. Returns the registered class (for spying).
 */
function registerMockEngine(
  name: string,
  handler: (query: string, options: any) => Promise<StandardSearchResult[]>
) {
  class MockEngine extends WebSearcher {
    get template() {
      return { url: `http://${name}.com/search?q=\${query}` };
    }
    async search(query: string, options: any): Promise<StandardSearchResult[]> {
      return handler(query, options);
    }
  }
  WebSearcher.register(MockEngine as any, name);
  return MockEngine;
}

const items = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    title: `${prefix} ${i}`,
    url: `http://${prefix}.com/${i}`,
  }));

describe('WebSearcher static search: race strategy', () => {
  beforeEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
  });

  afterEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
    ['RA', 'RB', 'RCSlow', 'RCFast', 'RErr', 'RErrOnly'].forEach(name => {
      try { WebSearcher.unregister(name); } catch (e) { }
    });
    vi.restoreAllMocks();
  });

  it('should return as soon as one engine reaches the limit and abort others', async () => {
    // Fast engine returns limit results immediately; slow engine would take 5s.
    const fast = registerMockEngine('RA', async (q, o) => items('A', o.limit));
    const slow = registerMockEngine('RB', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('B', 20)), 5000)
      )
    );

    const slowDispose = vi.spyOn(slow.prototype as any, 'dispose').mockResolvedValue(undefined);

    const start = Date.now();
    const results = await WebSearcher.search(['RA', 'RB'], 'query', {
      limit: 5,
      // No grace needed: the winner reaches the limit immediately.
    });
    const elapsed = Date.now() - start;

    expect(results).toHaveLength(5);
    // The winner is the fast engine: declaration order puts A first anyway.
    expect(results.every(r => r.url!.startsWith('http://A.com/'))).toBe(true);
    // Must not wait for the slow engine's 5s promise.
    expect(elapsed).toBeLessThan(3000);
    // Losers are disposed to free their resources.
    expect(slowDispose).toHaveBeenCalled();
  });

  it('should merge results of engines declared earlier even if a later engine finished first', async () => {
    // RB finishes first with 5 items (below limit), RA finishes later with 5.
    // Final order must still follow declaration order: [RA, RB].
    registerMockEngine('RA', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('A', 5)), 300)
      )
    );
    registerMockEngine('RB', async () => items('B', 5));

    const results = await WebSearcher.search(['RA', 'RB'], 'query', { limit: 10 });

    // All results from both engines, ordered RA first.
    expect(results).toHaveLength(10);
    expect(results[0].url).toBe('http://A.com/0');
    expect(results[4].url).toBe('http://A.com/4');
    expect(results[5].url).toBe('http://B.com/0');
    expect(results[9].url).toBe('http://B.com/4');
  });

  it('should wait the grace period when settled engines do not fill the limit', async () => {
    registerMockEngine('RA', async () => items('A', 3)); // settles immediately
    registerMockEngine('RB', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('B', 20)), 800)
      )
    );

    const start = Date.now();
    const results = await WebSearcher.search(['RA', 'RB'], 'query', {
      limit: 10,
      gracePeriodMs: 200,
    });
    const elapsed = Date.now() - start;

    // RA settled with 3 < 10, the 200ms grace expired before RB answered:
    // return what we have without waiting for RB.
    expect(results).toHaveLength(3);
    expect(elapsed).toBeGreaterThanOrEqual(150);
    expect(elapsed).toBeLessThan(700);
  });

  it('should use results that arrive during the grace period', async () => {
    registerMockEngine('RA', async () => items('A', 3));
    registerMockEngine('RB', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('B', 20)), 100)
      )
    );

    const results = await WebSearcher.search(['RA', 'RB'], 'query', {
      limit: 10,
      gracePeriodMs: 2000,
    });

    // RB answered within the grace window and topped the pool beyond the limit.
    expect(results).toHaveLength(10);
    expect(results[0].url).toBe('http://A.com/0');
    expect(results[3].url).toBe('http://B.com/0');
  });

  it('should tolerate engine failures and keep other engines results', async () => {
    const errSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    registerMockEngine('RErr', async () => {
      throw new Error('engine exploded');
    });
    registerMockEngine('RA', async () => items('A', 4));

    const results = await WebSearcher.search(['RA', 'RErr'], 'query', { limit: 5 });

    expect(results).toHaveLength(4);
    expect(results[0].url).toBe('http://A.com/0');
    errSpy.mockRestore();
  });

  it('should throw when all engines failed', async () => {
    const errSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    registerMockEngine('RErr', async () => {
      throw new Error('boom-A');
    });
    registerMockEngine('RErrOnly', async () => {
      throw new Error('boom-B');
    });

    await expect(
      WebSearcher.search(['RErr', 'RErrOnly'], 'query', { limit: 5 })
    ).rejects.toThrow('boom-A');

    errSpy.mockRestore();
  });

  it('should truncate the chain at the first engine with fillLimit: false', async () => {
    // RA (no flag) returns a few items; RB carries fillLimit:false on its own
    // defaults; RC would never have been reached in the sequential chain.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    registerMockEngine('RA', async () => items('A', 2));
    const rb = registerMockEngine('RB', async () => items('B', 3));
    rb.defaultOptions = { fillLimit: false };
    const rcSlow = registerMockEngine('RCSlow', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('C', 20)), 5000)
      )
    );

    const results = await WebSearcher.search(['RA', 'RB', 'RCSlow'], 'query', {
      limit: 10,
    });

    // Sequential semantics: the chain stops after RB (fillLimit:false), so
    // RCSlow's results are excluded even though it was started concurrently.
    expect(results).toHaveLength(5);
    expect(results.map(r => r.url!.split('//')[1].split('.')[0]).sort()).toEqual([
      'A', 'A', 'B', 'B', 'B',
    ]);
    void rcSlow;
    warnSpy.mockRestore();
  });

  it('should keep the sequential fallback when strategy is "fallback"', async () => {
    // Second engine must never be created: the first fills the limit.
    const ctorB = registerMockEngine('RB', async () => items('B', 10));
    registerMockEngine('RA', async (q, o) => items('A', o.limit));

    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const results = await WebSearcher.search(['RA', 'RB'], 'query', {
      limit: 5,
      strategy: 'fallback',
    });

    expect(results).toHaveLength(5);
    expect(createSpy.mock.calls[0][0]).toBe('RA');
    void ctorB;
  });
});

describe('grace period: empty-pool wait path', () => {
  beforeEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
  });

  afterEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
    ['GA', 'GB', 'GC'].forEach(name => {
      try { WebSearcher.unregister(name); } catch (e) { }
    });
    vi.restoreAllMocks();
  });

  it('should keep waiting when the grace expires with zero results, and return later arrivals', async () => {
    // GA succeeds with 0 items immediately (a Google anti-bot variant, e.g.);
    // GB answers after 600ms, well past the 300ms grace period.
    registerMockEngine('GA', async () => []);
    registerMockEngine('GB', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('B', 3)), 600)
      )
    );

    const start = Date.now();
    const results = await WebSearcher.search(['GA', 'GB'], 'query', {
      limit: 10,
      gracePeriodMs: 300,
    });
    const elapsed = Date.now() - start;

    // The grace expiry must NOT return the empty pool while GB is still
    // running: wait for GB and return its results instead.
    expect(results).toHaveLength(3);
    expect(elapsed).toBeGreaterThanOrEqual(500);
  });

  it('should return an empty pool (not throw) when a successful engine yields nothing and another fails after the grace', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    // GA succeeds with 0 items; GB fails for real after the grace expired.
    // GA having succeeded means the search itself worked: like the sequential
    // path (first engine returns 0 => break => return []), no throw.
    registerMockEngine('GA', async () => []);
    registerMockEngine('GB', () =>
      new Promise<StandardSearchResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('boom-late')), 600)
      )
    );

    const results = await WebSearcher.search(['GA', 'GB'], 'query', {
      limit: 5,
      gracePeriodMs: 300,
    });

    expect(results).toEqual([]);
    warnSpy.mockRestore();
  });

  it('should return later arrivals even when another engine failed earlier', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    // GA fails immediately, GB succeeds with 0 items, GC answers late with
    // items. The grace expiry (0 arrived) must keep waiting for GC.
    registerMockEngine('GA', async () => {
      throw new Error('boom-early');
    });
    registerMockEngine('GB', async () => []);
    registerMockEngine('GC', () =>
      new Promise<StandardSearchResult[]>((resolve) =>
        setTimeout(() => resolve(items('C', 3)), 600)
      )
    );

    const results = await WebSearcher.search(['GA', 'GB', 'GC'], 'query', {
      limit: 10,
      gracePeriodMs: 300,
    });

    // GA's real failure must not turn into a throw: GC succeeded.
    expect(results).toHaveLength(3);
    expect(results[0].url).toBe('http://C.com/0');
    warnSpy.mockRestore();
  });

  it('should still throw when every engine genuinely failed (none succeeded)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    registerMockEngine('GA', async () => {
      throw new Error('boom-A');
    });
    registerMockEngine('GB', () =>
      new Promise<StandardSearchResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('boom-B')), 100)
      )
    );

    await expect(
      WebSearcher.search(['GA', 'GB'], 'query', { limit: 5, gracePeriodMs: 300 })
    ).rejects.toThrow('boom-A');
    warnSpy.mockRestore();
  });
});

describe('race strategy: concurrency limit', () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));

  /** Creates an engine whose search() waits until its deferred is resolved manually. */
  function registerDeferredEngine(name: string, defs: Map<string, any>) {
    class DeferredEngine extends WebSearcher {
      get template() {
        return { url: `http://${name}.com/search?q=\${query}` };
      }
      async search(): Promise<StandardSearchResult[]> {
        const d = defs.get(name);
        if (!d) return [];
        return d.promise;
      }
    }
    WebSearcher.register(DeferredEngine as any, name);
    return DeferredEngine;
  }

  beforeEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
  });

  afterEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
    ['DA', 'DB', 'DC', 'DD'].forEach(name => {
      try { WebSearcher.unregister(name); } catch (e) { }
    });
    vi.restoreAllMocks();
  });

  it('should start engines one at a time when concurrency is 1', async () => {
    const defs = new Map<string, any>();
    for (const name of ['DA', 'DB', 'DC']) {
      defs.set(name, (() => {
        let resolve!: (v: StandardSearchResult[]) => void;
        const promise = new Promise<StandardSearchResult[]>((r) => { resolve = r; });
        return { promise, resolve };
      })());
    }
    registerDeferredEngine('DA', defs);
    registerDeferredEngine('DB', defs);
    registerDeferredEngine('DC', defs);

    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const searchPromise = WebSearcher.search(['DA', 'DB', 'DC'], 'query', {
      limit: 10,
      concurrency: 1,
    });

    await flush();
    // Only the first engine should be running.
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA']);

    // DA settles (below the limit) => DB starts.
    defs.get('DA').resolve(items('A', 2));
    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB']);

    // DB settles => DC starts.
    defs.get('DB').resolve(items('B', 3));
    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB', 'DC']);

    // DC settles => all done, merged in declaration order.
    defs.get('DC').resolve(items('C', 4));
    const results = await searchPromise;
    expect(results).toHaveLength(9);
    expect(results[0].url).toBe('http://A.com/0');
    expect(results[2].url).toBe('http://B.com/0');
    expect(results[5].url).toBe('http://C.com/0');
  });

  it('should run at most `concurrency` engines at the same time', async () => {
    const defs = new Map<string, any>();
    for (const name of ['DA', 'DB', 'DC', 'DD']) {
      defs.set(name, (() => {
        let resolve!: (v: StandardSearchResult[]) => void;
        const promise = new Promise<StandardSearchResult[]>((r) => { resolve = r; });
        return { promise, resolve };
      })());
    }
    registerDeferredEngine('DA', defs);
    registerDeferredEngine('DB', defs);
    registerDeferredEngine('DC', defs);
    registerDeferredEngine('DD', defs);

    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const searchPromise = WebSearcher.search(['DA', 'DB', 'DC', 'DD'], 'query', {
      limit: 10,
      concurrency: 2,
    });

    await flush();
    // The first two run concurrently, the rest wait.
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB']);

    // One slot freed => exactly one queued engine starts.
    defs.get('DA').resolve(items('A', 2));
    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB', 'DC']);

    defs.get('DB').resolve(items('B', 2));
    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB', 'DC', 'DD']);

    defs.get('DC').resolve(items('C', 2));
    defs.get('DD').resolve(items('D', 2));
    const results = await searchPromise;
    expect(results).toHaveLength(8);
  });

  it('should never start queued engines once the race is decided', async () => {
    const defs = new Map<string, any>();
    for (const name of ['DA', 'DB', 'DC']) {
      defs.set(name, (() => {
        let resolve!: (v: StandardSearchResult[]) => void;
        const promise = new Promise<StandardSearchResult[]>((r) => { resolve = r; });
        return { promise, resolve };
      })());
    }
    registerDeferredEngine('DA', defs);
    registerDeferredEngine('DB', defs);
    registerDeferredEngine('DC', defs);

    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

    const searchPromise = WebSearcher.search(['DA', 'DB', 'DC'], 'query', {
      limit: 2,
      concurrency: 1,
    });

    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA']);

    // DA fills the limit (2 items >= limit 2) as soon as it resolves.
    defs.get('DA').resolve(items('A', 2));
    const results = await searchPromise;    // DB/DC were queued behind DA and are never started, let alone awaited.
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA']);
    expect(results).toHaveLength(2);
    warnSpy.mockRestore();
  });

  it('should treat concurrency < 1 or invalid as unlimited', async () => {
    registerMockEngine('DA', async () => items('A', 2));
    registerMockEngine('DB', async () => items('B', 2));
    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const results = await WebSearcher.search(['DA', 'DB'], 'query', {
      limit: 10,
      concurrency: 0 as any,
    });

    // Both engines started immediately despite concurrency: 0.
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB']);
    expect(results).toHaveLength(4);
  });

  it('should start queued engines even when a previous engine failed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const defs = new Map<string, any>();
    for (const name of ['DA', 'DB']) {
      defs.set(name, (() => {
        let resolve!: (v: StandardSearchResult[]) => void;
        let reject!: (e: any) => void;
        const promise = new Promise<StandardSearchResult[]>((res, rej) => { resolve = res; reject = rej; });
        return { promise, resolve, reject };
      })());
    }
    registerDeferredEngine('DA', defs);
    registerDeferredEngine('DB', defs);
    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const searchPromise = WebSearcher.search(['DA', 'DB'], 'query', {
      limit: 10,
      concurrency: 1,
    });

    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA']);

    // DA fails for real: its slot is freed and DB must still start (the race
    // needs results from somewhere).
    defs.get('DA').reject(new Error('boom'));
    await flush();
    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA', 'DB']);

    defs.get('DB').resolve(items('B', 3));
    const results = await searchPromise;
    expect(results).toHaveLength(3);
    warnSpy.mockRestore();
  });

  it('should deduplicate identical URLs across engines, keeping declaration order', async () => {
    // RB finishes first; RA later returns overlapping URLs. The merge must
    // deduplicate by URL and order by declaration (RA items first).
    registerMockEngine('RA', async () => [
      { title: 'A shared', url: 'http://shared.com/1' },
      { title: 'A only', url: 'http://a.com/1' },
    ]);
    registerMockEngine('RB', async () => [
      { title: 'B first', url: 'http://shared.com/1' },
      { title: 'B second', url: 'http://shared.com/2' },
    ]);

    const results = await WebSearcher.search(['RA', 'RB'], 'query', { limit: 10 });

    expect(results).toHaveLength(3);
    // RA's copy of the shared URL wins (declared earlier).
    expect(results[0].title).toBe('A shared');
    expect(results[1].title).toBe('A only');
    expect(results[2].title).toBe('B second');
  });

  it('should respect strategy and gracePeriodMs set via WebSearcher.defaultOptions', async () => {
    // Global defaults: fallback strategy + generous grace. With fallback, the
    // first engine fills the limit and the second is never created.
    WebSearcher.defaultOptions = { strategy: 'fallback', gracePeriodMs: 5000, limit: 5 };
    registerMockEngine('DA', async (q, o) => items('A', o.limit));
    const createSpy = vi.spyOn(WebSearcher as any, 'createObject');

    const results = await WebSearcher.search(['DA', 'DB'], 'query', {});

    expect(createSpy.mock.calls.map(c => c[0])).toEqual(['DA']);
    expect(results).toHaveLength(5);
  });
});
