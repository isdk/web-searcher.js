import { describe, it, expect } from 'vitest';
import { GoogleSearcher } from './google';
import { SearchOptions } from '../types';

class TestGoogleSearcher extends GoogleSearcher {
  public testFormatOptions(options: SearchOptions) {
    return this.formatOptions(options);
  }
}

describe('GoogleSearcher Options', () => {
  const searcher = new TestGoogleSearcher();

  it('should map timeRange presets correctly', () => {
    expect(searcher.testFormatOptions({ timeRange: 'day' })).toEqual({ tbs: 'qdr:d' });
    expect(searcher.testFormatOptions({ timeRange: 'week' })).toEqual({ tbs: 'qdr:w' });
    expect(searcher.testFormatOptions({ timeRange: 'month' })).toEqual({ tbs: 'qdr:m' });
    expect(searcher.testFormatOptions({ timeRange: 'year' })).toEqual({ tbs: 'qdr:y' });
  });

  it('should map custom timeRange correctly', () => {
    const from = new Date('2023-01-01');
    const to = new Date('2023-12-31');
    const result = searcher.testFormatOptions({ 
      timeRange: { from, to } 
    });
    
    // cdr:1,cd_min:1/1/2023,cd_max:12/31/2023
    // Note: getMonth is 0-indexed, so +1
    expect(result['tbs']).toMatch(/cdr:1,cd_min:1\/1\/2023,cd_max:12\/31\/2023/);
  });

  it('should map custom timeRange with default "to" date', () => {
    const from = new Date('2023-01-01');
    const result = searcher.testFormatOptions({ 
      timeRange: { from } 
    });
    
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    expect(result['tbs']).toContain(`cd_min:1/1/2023`);
    expect(result['tbs']).toContain(`cd_max:${todayStr}`);
  });

  it('should map categories correctly', () => {
    expect(searcher.testFormatOptions({ category: 'images' })).toEqual({ tbm: 'isch' });
    expect(searcher.testFormatOptions({ category: 'videos' })).toEqual({ tbm: 'vid' });
    expect(searcher.testFormatOptions({ category: 'news' })).toEqual({ tbm: 'nws' });
  });

  it('should map region and language', () => {
    expect(searcher.testFormatOptions({ region: 'US', language: 'en' })).toEqual({ 
      gl: 'US', 
      hl: 'en' 
    });
  });

  it('should map safeSearch', () => {
    expect(searcher.testFormatOptions({ safeSearch: 'strict' })).toEqual({ safe: 'active' });
    expect(searcher.testFormatOptions({ safeSearch: 'off' })).toEqual({ safe: 'images' });
  });
  
  it('should handle multiple options together', () => {
    const options: SearchOptions = {
        category: 'news',
        timeRange: 'day',
        region: 'US'
    };
    const result = searcher.testFormatOptions(options);
    expect(result).toEqual({
        tbm: 'nws',
        tbs: 'qdr:d',
        gl: 'US'
    });
  });
});
