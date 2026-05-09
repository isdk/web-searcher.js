import { fetchWeb } from '@isdk/web-fetcher';

export interface VerifiedUrl {
  url: string;
  latency: number;
}

/**
 * A general utility to test a list of URLs for availability and latency.
 * Returns a list of verified URLs sorted by response time.
 */
export async function testUrlsByLatency(
  urls: string[],
  options: { 
    timeout?: number; 
    limit?: number; 
    testPath?: string;
  } = {}
): Promise<VerifiedUrl[]> {
  const { timeout = 5000, limit = 20, testPath = '' } = options;

  const results = await Promise.all(
    urls.map(async (url) => {
      const start = Date.now();
      try {
        // Construct full URL properly without breaking the protocol slashes
        const fullUrl = testPath ? (url.endsWith('/') ? url.slice(0, -1) : url) + (testPath.startsWith('/') ? testPath : '/' + testPath) : url;
        
        // Use fetchWeb to perform a simple reachability test
        await fetchWeb(fullUrl, { timeoutMs: timeout });
        return { url, latency: Date.now() - start };
      } catch (e) {
        return null;
      }
    })
  );

  return results
    .filter((r): r is VerifiedUrl => r !== null)
    .sort((a, b) => a.latency - b.latency)
    .slice(0, limit);
}
