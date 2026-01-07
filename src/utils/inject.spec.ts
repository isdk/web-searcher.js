import { describe, it, expect } from 'vitest';
import { injectVariables } from './inject';

describe('injectVariables', () => {
  it('should replace variables in a string', () => {
    const template = 'Hello ${name}!';
    const result = injectVariables(template, { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should replace multiple variables', () => {
    const template = '${greeting} ${name}';
    const result = injectVariables(template, { greeting: 'Hi', name: 'Gemini' });
    expect(result).toBe('Hi Gemini');
  });

  it('should handle missing variables by replacing with empty string', () => {
    const template = 'Hello ${missing}';
    const result = injectVariables(template, {});
    expect(result).toBe('Hello ');
  });

  it('should recursively replace variables in an object', () => {
    const template = {
      url: 'https://example.com?q=${query}',
      params: {
        value: '${value}'
      },
      list: ['${item1}', 'static']
    };
    const result = injectVariables(template, { query: 'test', value: '123', item1: 'first' });
    expect(result).toEqual({
      url: 'https://example.com?q=test',
      params: {
        value: '123'
      },
      list: ['first', 'static']
    });
  });
});
