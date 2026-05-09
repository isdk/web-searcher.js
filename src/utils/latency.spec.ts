import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testUrlsByLatency } from './latency';
import { fetchWeb } from '@isdk/web-fetcher';

// Mock the fetchWeb module
vi.mock('@isdk/web-fetcher', () => ({
  fetchWeb: vi.fn(),
}));

describe('latency utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort URLs by latency', async () => {
    const urls = ['http://slow.com', 'http://fast.com', 'http://medium.com'];
    
    // Simulate different latencies
    // Note: mockImplementation now receives (url, options) as positional arguments
    (fetchWeb as any).mockImplementation((url: string) => {
      return new Promise((resolve) => {
        let delay = 10;
        if (url.includes('slow')) delay = 50;
        if (url.includes('medium')) delay = 30;
        
        setTimeout(() => resolve({}), delay);
      });
    });

    const results = await testUrlsByLatency(urls);

    expect(results.length).toBe(3);
    expect(results[0].url).toBe('http://fast.com');
    expect(results[1].url).toBe('http://medium.com');
    expect(results[2].url).toBe('http://slow.com');
    
    // Latencies should be in increasing order
    expect(results[0].latency).toBeLessThan(results[1].latency);
    expect(results[1].latency).toBeLessThan(results[2].latency);
  });

  it('should filter out failed URLs', async () => {
    const urls = ['http://ok.com', 'http://fail.com'];

    (fetchWeb as any).mockImplementation((url: string) => {
      if (url.includes('fail')) return Promise.reject(new Error('Network Error'));
      return Promise.resolve({});
    });

    const results = await testUrlsByLatency(urls);

    expect(results.length).toBe(1);
    expect(results[0].url).toBe('http://ok.com');
  });

  it('should respect the limit option', async () => {
    const urls = ['http://1.com', 'http://2.com', 'http://3.com'];
    (fetchWeb as any).mockResolvedValue({});

    const results = await testUrlsByLatency(urls, { limit: 2 });

    expect(results.length).toBe(2);
  });

  it('should apply testPath correctly', async () => {
    const urls = ['http://example.com'];
    const testPath = '/api/health';
    
    (fetchWeb as any).mockResolvedValue({});

    await testUrlsByLatency(urls, { testPath });

    // Expecting two arguments: the full URL string and the options object
    expect(fetchWeb).toHaveBeenCalledWith(
      'http://example.com/api/health', 
      expect.objectContaining({ timeoutMs: 5000 })
    );
  });
});
