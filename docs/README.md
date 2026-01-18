**@isdk/web-searcher**

***

# Search Module

The Search module provides a high-level, class-based framework for building search engine scrapers. It is built on top of `@isdk/web-fetcher` and extends its capabilities to handle **multi-page navigation**, **session persistence**, and **result standardization**.

## 🌟 Why use the Search Module?

Building a robust search scraper involves more than just fetching a URL. You often need to:

- **Pagination**: Automatically click "Next" or modify URL parameters until you have enough results.
- **Session Management**: Maintain cookies and headers across multiple search queries.
- **Data Cleaning**: Parse raw HTML and resolve redirect links.
- **Flexibility**: Switch between HTTP (fast) and Browser (anti-bot) modes easily.

This module encapsulates these patterns into a reusable `WebSearcher` class.

## 🚀 Quick Start

### 1. One-off Search

> **⚠️ Note on `GoogleSearcher`**: The `GoogleSearcher` class used in these examples is a **demo implementation** included for educational purposes. It is not intended for production use.
>
> * It lacks advanced anti-bot handling (CAPTCHA solving, proxy rotation) required for scraping Google reliably at scale.
> * The extracted data may be **inaccurate or misaligned** due to Google's frequent DOM changes and A/B testing.

Use the static `WebSearcher.search` method for quick, disposable tasks. It automatically creates a session, fetches results, and cleans up.

```typescript
import { GoogleSearcher, WebSearcher } from '@isdk/web-fetcher';

// Register the engine (only needs to be done once)
WebSearcher.register(GoogleSearcher);

// Search!
// The 'limit' parameter ensures we fetch enough pages to get 20 results.
// Note: The engine name is case-sensitive and derived from the class name (e.g., 'GoogleSearcher' -> 'Google')
const results = await WebSearcher.search('Google', 'open source', { limit: 20 });

console.log(results);
```

### 2. Stateful Session

Since `WebSearcher` extends `FetchSession`, you can instantiate it to keep cookies and storage alive across multiple requests. This is useful for authenticated searches or avoiding bot detection by behaving like a human.

**Configuration Precedence:**
When creating a session, options are merged in the following order:

1. **Template Default**: Defined in the WebSearcher class (highest priority for structural options).
2. **User Options**: Passed to the constructor (can fill missing defaults or override if allowed).

*Note: If the template sets `engine: 'auto'` (default), user-provided `engine` option will be respected.*

```typescript
// Create a persistent session
const google = new GoogleSearcher({
  headless: false, // Override default options (e.g., show browser)
  proxy: 'http://my-proxy:8080',
  timeoutMs: 30000 // Set a global timeout for requests
});

try {
  // First query
  // You can also pass runtime options to override session defaults or inject variables
  const results1 = await google.search('term A', {
    timeoutMs: 60000, // Override timeout just for this search
    extraParam: 'value' // Can be used in template as ${extraParam}
  });

  // Second query (reuses the same browser window/cookies)
  const results2 = await google.search('term B');
} finally {
  // Always dispose to close the browser/release resources
  await google.dispose();
}
```

## 🛠️ Implementing a New Search Engine

To support a new website, create a class that extends `WebSearcher`.

### Step 1: Define the Template

To support a new website, create a class that extends `WebSearcher`. The engine name is automatically derived from the class name (e.g., `MyBlogSearcher` -> `MyBlog`), but you can customize it and add aliases using static properties.

The `template` property defines the "Blueprint" for your search. It's a standard `FetcherOptions` object but supports **variable injection**.

Supported variables:

- `${query}`: The search string.
- `${page}`: Current page number (starts at 0 or 1 based on config).
- `${offset}`: Current item offset (e.g., 0, 10, 20).
- `${limit}`: The requested limit.

```typescript
import { WebSearcher } from '@isdk/web-fetcher/search';
import { FetcherOptions } from '@isdk/web-fetcher/types';

export class MyBlogSearcher extends WebSearcher {
  static name = 'blog'; // Custom name (case-sensitive)
  static alias = ['myblog', 'news'];

  protected get template(): FetcherOptions {
    return {
      engine: 'http', // Use 'browser' if the site has anti-bot
      // Dynamic URL with variables
      url: 'https://blog.example.com/search?q=${query}&page=${page}',
      actions: [
        {
          id: 'extract',
          storeAs: 'results', // MUST store results here
          params: {
            type: 'array',
            selector: 'article.post',
            items: {
              title: { selector: 'h2' },
              url: { selector: 'a', attribute: 'href' }
            }
          }
        }
      ]
    };
  }
}
```

### Step 2: Configure Pagination

Tell the `WebSearcher` how to navigate to the next page. Implement the `pagination` getter.

#### Option A: URL Parameters (Offset/Page)

Best for stateless HTTP scraping.

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'page',
    startValue: 1, // First page is 1
    increment: 1   // Add 1 for next page
  };
}
```

#### Option B: Click "Next" Button

Best for SPAs or complex session-based sites. Requires `engine: 'browser'`.

```typescript
protected override get pagination() {
  return {
    type: 'click-next',
    nextButtonSelector: 'a.next-page-btn'
  };
}
```

### Step 3: Transform & Clean Data

Override `transform` to clean data. Since `WebSearcher` is a `FetchSession`, you can also make extra requests (like resolving redirects) using `this`.

```typescript
protected override async transform(outputs: Record<string, any>) {
  const results = outputs['results'] || [];

  // Clean data or filter
  return results.map(item => ({
    ...item,
    title: item.title.trim(),
    url: new URL(item.url, 'https://blog.example.com').href
  }));
}
```

## 🧠 Advanced Concepts

### Auto-Pagination & Filtering

The `WebSearcher` is smart. If you request `limit: 10`, but the first page only returns 5 results (or if your `transform` filters out results), it will automatically fetch the next page until the limit is met.

### User-defined Transforms

Users can provide their own `transform` when calling `search`. This runs **after** the engine's built-in transform.

```typescript
await google.search('test', {
  transform: (results) => results.filter(r => r.url.endsWith('.pdf'))
});
```

If the user filters out results, the auto-pagination logic will kick in to fetch more pages to meet the requested limit.

### Standardized Search Options

When calling `search()`, you can provide standardized options that the search engine will map to specific parameters:

```typescript
const results = await google.search('open source', {
  limit: 20,
  timeRange: 'month',       // 'day', 'week', 'month', 'year'
  // Or custom range:
  // timeRange: { from: '2023-01-01', to: '2023-12-31' },
  category: 'news',         // 'all', 'images', 'videos', 'news'
  region: 'US',             // ISO 3166-1 alpha-2
  language: 'en',           // ISO 639-1
  safeSearch: 'strict',     // 'off', 'moderate', 'strict'
});
```

To support these in your own engine, override the `formatOptions` method:

```typescript
protected override formatOptions(options: SearchOptions): Record<string, any> {
  const vars: Record<string, any> = {};
  if (options.timeRange === 'day') vars.tbs = 'qdr:d';
  // ... map other options to template variables
  return vars;
}
```

Then use these variables in your `template.url`:
`url: 'https://www.google.com/search?q=${query}&tbs=${tbs}'`

### Custom Variables

You can pass custom variables to `search()` and use them in your template.

```typescript
// Call
await google.search('test', { category: 'news' });

// Template
url: 'https://site.com?q=${query}&cat=${category}'
```

## Pagination Guide

### 1. Offset-based (e.g., Google)

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'start',
    startValue: 0,
    increment: 10 // Jump 10 items per page
  };
}
```

URL: `search?q=...&start=${offset}`

### 2. Page-based (e.g., Bing)

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'page',
    startValue: 1,
    increment: 1
  };
}
```

URL: `search?q=...&page=${page}`

### 3. Click-based (SPA)

```typescript
protected override get pagination() {
  return {
    type: 'click-next',
    nextButtonSelector: '.pagination .next'
  };
}
```

The engine will click this selector and wait for network idle before scraping the next batch.
