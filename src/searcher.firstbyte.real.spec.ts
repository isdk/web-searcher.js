import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { AddressInfo } from 'net';
import fastify, { FastifyInstance } from 'fastify';
import { WebSearcher } from './searcher';
import { StandardSearchResult } from './types';

/**
 * End-to-end firstByteMs coverage: real (local) HTTP endpoints served by
 * fastify, fetched by the real cheerio engine through the WebSearcher
 * machinery — no mocks. The point is that a request which connects but never
 * receives data must be cut at firstByteMs, both on the single-engine
 * (sequential) path and inside a race, never left to hang.
 */

const SLOW_DELAY_MS = 4000;

class LocalFastSearcher extends WebSearcher {
  static override alias = ['lfast'];
  get template() {
    return {
      engine: 'http' as const,
      url: `${(LocalFastSearcher as any).baseUrl}/fast`,
      actions: [
        {
          id: 'extract',
          storeAs: 'results',
          params: {
            type: 'array',
            selector: '.item',
            items: {
              url: { selector: 'a.u', attribute: 'href', required: true },
              title: { selector: '.t', required: true },
            },
          },
        },
      ],
    };
  }
}

class LocalSlowSearcher extends WebSearcher {
  static override alias = ['lslow'];
  get template() {
    return {
      engine: 'http' as const,
      url: `${(LocalSlowSearcher as any).baseUrl}/slow-ttfb`,
      actions: [
        {
          id: 'extract',
          storeAs: 'results',
          params: {
            type: 'array',
            selector: '.item',
            items: {
              url: { selector: 'a.u', attribute: 'href', required: true },
              title: { selector: '.t', required: true },
            },
          },
        },
      ],
    };
  }
}

describe('WebSearcher firstByteMs (real local HTTP engine)', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = fastify({ logger: false });
    server.get('/fast', async (req, reply) => {
      reply.type('text/html').send(
        '<html><body>' +
          '<div class="item"><a class="u" href="http://r.com/1"></a><span class="t">R1</span></div>' +
          '</body></html>'
      );
    });
    // Connected, but sends no byte for SLOW_DELAY_MS — the exact
    // "stuck waiting for the server to start responding" hang.
    server.get('/slow-ttfb', async (req, reply) => {
      await new Promise((r) => setTimeout(r, SLOW_DELAY_MS));
      reply.type('text/html').send('<html><body><div class="item"></div></body></html>');
    });
    await server.listen({ port: 0 });
    const baseUrl = `http://localhost:${(server.server.address() as AddressInfo).port}`;
    (LocalFastSearcher as any).baseUrl = baseUrl;
    (LocalSlowSearcher as any).baseUrl = baseUrl;
    WebSearcher.register(LocalFastSearcher as any);
    WebSearcher.register(LocalSlowSearcher as any);
  });

  afterAll(async () => {
    await server.close();
  });

  it('a single stuck engine on the sequential path fails at firstByteMs, not after the body delay', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const start = Date.now();
    await expect(
      WebSearcher.search(['lslow'], 'query', { firstByteMs: 500, timeoutMs: 20000 })
    ).rejects.toThrow();
    const elapsed = Date.now() - start;
    warnSpy.mockRestore();

    // Cut by firstByteMs (~500ms), not the 4s server delay nor the 20s
    // request timeout — and definitely not Crawlee's 300s default.
    expect(elapsed).toBeLessThan(SLOW_DELAY_MS);
  }, 30000);

  it('a race with one stuck and one healthy engine returns the healthy results at firstByteMs speed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const start = Date.now();
    const results = await WebSearcher.search(['lslow', 'lfast'], 'query', {
      limit: 5,
      firstByteMs: 500,
      timeoutMs: 20000,
      raceTimeoutMs: 30000,
      gracePeriodMs: 3000,
    });
    const elapsed = Date.now() - start;
    warnSpy.mockRestore();

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every((r: StandardSearchResult) => /^https?:\/\//.test(r.url || ''))).toBe(true);
    // The stuck engine failed on its own at firstByteMs, so the race ended
    // around then too — well before the slow endpoint would have answered.
    expect(elapsed).toBeLessThan(SLOW_DELAY_MS);
  }, 30000);
});
