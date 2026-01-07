import { describe, it, expect } from 'vitest';
import { WebSearcher } from '../searcher';
import { GoogleSearcher } from './google';

// Run this test only if the environment variable RunNetworkTests is set to 'true'
const runRealNetworkTests = process.env.RunNetworkTests === 'true';

describe.skipIf(!runRealNetworkTests)('Google Search Engine (Live)', () => {
  it('should fetch real results from Google', async () => {
    // Register the engine (optional if we use class directly, but good for completeness)
    WebSearcher.register(GoogleSearcher);

    console.log('Fetching Google results for "hello world"...');

    // Execute search using the static helper
    // We pass { engine: 'http' } to override the default 'auto' if desired,
    // but GoogleSearcher defaults to 'auto' which is fine.
    // Setting a timeout is good practice.
    const results = await WebSearcher.search('google', 'hello world', {
      limit: 5,
      timeoutMs: 30000
    });

    console.log(`Successfully fetched ${results.length} results.`);
    if (results.length > 0) {
      console.log('First result:', results[0]);
    }

    expect(results.length).toBeGreaterThan(0);

    const first = results[0];
    expect(first.title).toBeDefined();
    expect(first.url).toMatch(/^https?:\/\//);
    expect(first.url).not.toContain('/url?q=');
  }, 60000);
});
