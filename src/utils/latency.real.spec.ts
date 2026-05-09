import { describe, it, expect } from 'vitest';
import { testUrlsByLatency } from './latency';

describe('latency utility real environment', () => {
  const runRealTests = process.env.RunNetworkTests === 'true';

  it('should test real URLs and return sorted latencies', async () => {
    if (!runRealTests) {
      console.log('Skipping real network test. Set RunNetworkTests=true to run.');
      return;
    }

    // A mix of global websites to see different latencies
    const urls = [
      'https://www.google.com',
      'https://www.bing.com',
      'https://www.baidu.com',
      'https://www.github.com'
    ];

    console.log('Starting real latency test for:', urls);
    const results = await testUrlsByLatency(urls, { timeout: 10000, limit: 10 });

    console.log('Real test results (sorted by latency):');
    results.forEach(r => console.log(`- ${r.url}: ${r.latency}ms`));

    expect(results.length).toBeGreaterThan(0);
    
    // Verify results are sorted by latency ascending
    if (results.length > 1) {
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].latency).toBeLessThanOrEqual(results[i + 1].latency);
      }
    }
  }, 60000); // Higher timeout for real network requests
});
