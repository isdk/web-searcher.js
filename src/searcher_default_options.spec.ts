import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSearcher } from './searcher';

class BaseMockSearcher extends WebSearcher {
  get template() { return { url: 'http://base.com' }; }
  // @ts-ignore
  async executeAll(actions: any, options: any) { return { outputs: { results: [{ title: 'Base', url: 'http://base.com' }] } }; }
}

class SubMockSearcher extends BaseMockSearcher {
  get template() { return { url: 'http://sub.com' }; }
  // @ts-ignore
  async executeAll(actions: any, options: any) { return { outputs: { results: [{ title: 'Sub', url: 'http://sub.com' }] } }; }
}

// Independent mock classes for fillLimit test to avoid prototype spy collision
class FillLimitMock1 extends WebSearcher {
  get template() { return { url: 'http://f1.com' }; }
  async search(q: string, options: any): Promise<any> { return [{ title: 'R1', url: 'u1' }]; }
}
class FillLimitMock2 extends WebSearcher {
  get template() { return { url: 'http://f2.com' }; }
  async search(q: string, options: any): Promise<any> { return [{ title: 'R2', url: 'u2' }]; }
}

describe('WebSearcher Default Options Logic', () => {
  beforeEach(() => {
    // Reset default options before each test
    // @ts-ignore
    delete WebSearcher._defaultOptions;
    // @ts-ignore
    delete BaseMockSearcher._defaultOptions;
    // @ts-ignore
    delete SubMockSearcher._defaultOptions;
    // @ts-ignore
    delete FillLimitMock1._defaultOptions;
    // @ts-ignore
    delete FillLimitMock2._defaultOptions;
  });

  afterEach(() => {
    // @ts-ignore
    delete WebSearcher._defaultOptions;
    // @ts-ignore
    delete BaseMockSearcher._defaultOptions;
    // @ts-ignore
    delete SubMockSearcher._defaultOptions;
    // @ts-ignore
    delete FillLimitMock1._defaultOptions;
    // @ts-ignore
    delete FillLimitMock2._defaultOptions;

    // Cleanup registrations
    ['BaseMock', 'SubMock', 'BaseMockStatic', 'F1', 'F2', 'MultiLimitBase', 'MultiLimitSub'].forEach(name => {
      try { WebSearcher.unregister(name); } catch(e) {}
    });
    vi.restoreAllMocks();
  });

  it('should use global WebSearcher.defaultOptions', async () => {
    WebSearcher.defaultOptions = { limit: 5, customVar: 'global' };
    const searcher = new BaseMockSearcher();
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    await searcher.search('test');

    const passedOptions = spy.mock.calls[0][1] as any;
    expect(passedOptions.limit).toBe(5);
    expect(passedOptions.customVar).toBe('global');
  });

  it('should merge engine-specific defaultOptions with global defaults', async () => {
    WebSearcher.defaultOptions = { limit: 5, language: 'en' };
    BaseMockSearcher.defaultOptions = { region: 'US', limit: 3 };

    const searcher = new BaseMockSearcher();
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    await searcher.search('test');

    const passedOptions = spy.mock.calls[0][1] as any;
    expect(passedOptions.limit).toBe(3);
    expect(passedOptions.language).toBe('en');
    expect(passedOptions.region).toBe('US');
  });

  it('should support prototype chain merging (Sub class)', async () => {
    WebSearcher.defaultOptions = { a: 1, b: 1, c: 1 } as any;
    BaseMockSearcher.defaultOptions = { b: 2, c: 2 } as any;
    SubMockSearcher.defaultOptions = { c: 3 } as any;

    const searcher = new SubMockSearcher();
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    await searcher.search('test');

    const passedOptions = spy.mock.calls[0][1] as any;
    expect(passedOptions.a).toBe(1);
    expect(passedOptions.b).toBe(2);
    expect(passedOptions.c).toBe(3);
  });

  it('should follow priority: Call > Instance > Static', async () => {
    WebSearcher.defaultOptions = { limit: 10, region: 'global' };
    const searcher = new BaseMockSearcher({ limit: 5, language: 'fr' } as any);
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    await searcher.search('test', { limit: 2, category: 'news' });

    let passedOptions = spy.mock.calls[0][1] as any;
    expect(passedOptions.limit).toBe(2);
    expect(passedOptions.language).toBe('fr');
    expect(passedOptions.region).toBe('global');
    expect(passedOptions.category).toBe('news');
  });

  it('should support deep merging of nested objects', async () => {
    WebSearcher.defaultOptions = { timeRange: { from: '2023-01-01' } } as any;
    const searcher = new BaseMockSearcher();
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    await searcher.search('test', { timeRange: { to: '2023-12-31' } } as any);

    const passedOptions = spy.mock.calls[0][1] as any;
    expect(passedOptions.timeRange).toEqual({
      from: '2023-01-01',
      to: '2023-12-31'
    });
  });

  it('should not mutate original objects during merging', async () => {
    const globalDefault = { timeRange: { from: '2020' } } as any;
    WebSearcher.defaultOptions = globalDefault;

    const searcher = new BaseMockSearcher();
    await searcher.search('test', { timeRange: { to: '2021' } } as any);

    expect(globalDefault.timeRange.to).toBeUndefined();
    expect(globalDefault.timeRange.from).toBe('2020');
  });

  it('should reflect dynamic updates to static defaults', async () => {
    const searcher = new BaseMockSearcher();
    const spy = vi.spyOn(searcher, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });

    WebSearcher.defaultOptions = { limit: 1 };
    await searcher.search('test');
    expect((spy.mock.calls[0][1] as any).limit).toBe(1);

    spy.mockClear();
    WebSearcher.defaultOptions = { limit: 99 };
    await searcher.search('test');
    expect((spy.mock.calls[0][1] as any).limit).toBe(99);
  });

  it('should respect static defaults in WebSearcher.search', async () => {
    WebSearcher.register(BaseMockSearcher as any, 'BaseMockStatic');
    BaseMockSearcher.defaultOptions = { limit: 7, region: 'UK' };

    const mockInstance = new BaseMockSearcher();
    const spy = vi.spyOn(mockInstance, 'executeAll' as any).mockResolvedValue({ outputs: { results: [] } });
    vi.spyOn(WebSearcher, 'createObject').mockReturnValue(mockInstance as any);

    await WebSearcher.search('BaseMockStatic', 'query', { language: 'de' });

    expect(spy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      limit: 7,
      region: 'UK',
      language: 'de'
    }));
  });

  it('should respect default fillLimit: false setting', async () => {
    WebSearcher.register(FillLimitMock1, 'F1');
    WebSearcher.register(FillLimitMock2, 'F2');

    // Set global default fillLimit to false
    WebSearcher.defaultOptions = { fillLimit: false, limit: 10 };

    const spy1 = vi.spyOn(FillLimitMock1.prototype, 'search');
    const spy2 = vi.spyOn(FillLimitMock2.prototype, 'search');

    await WebSearcher.search(['F1', 'F2'], 'query');

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).not.toHaveBeenCalled();
  });

  it('should handle different limits for different engines', async () => {
    WebSearcher.register(FillLimitMock1, 'MultiLimitBase');
    WebSearcher.register(FillLimitMock2, 'MultiLimitSub');

    FillLimitMock1.defaultOptions = { limit: 2 };
    FillLimitMock2.defaultOptions = { limit: 5 };

    const spy1 = vi.spyOn(FillLimitMock1.prototype, 'search');
    const spy2 = vi.spyOn(FillLimitMock2.prototype, 'search');

    await WebSearcher.search(['MultiLimitBase', 'MultiLimitSub'], 'query');

    expect(spy1).toHaveBeenCalledWith('query', expect.objectContaining({ limit: 2 }));
    expect(spy2).toHaveBeenCalledWith('query', expect.objectContaining({ limit: 4 }));
  });
});
