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
> * **Strict Anti-Bot Detection**: Currently, it has been found that even when attempting to simulate simple "human behavior" in `browser` mode (such as waiting for a few seconds before automatically filling in the search box and submitting), it is still detected as an automated program by Google. This indicates that simple operation simulation is not enough to pass the detection.
> * **Scalability Limitations**: It lacks advanced countermeasures like CAPTCHA solving, fingerprint spoofing, or high-quality proxy rotation required for reliable scraping.
> * **Fragility**: The extracted data may be **inaccurate or misaligned** due to Google's frequent DOM changes and A/B testing.

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

### 🛡️ Core Principle: Template is Law

The `template` defined in the `WebSearcher` subclass acts as the authoritative "blueprint".

- **Template Priority**: If the template defines a property (e.g., `engine: 'browser'`, `headers`), that value is **locked** and cannot be overridden by user options. This ensures engine stability.
- **Immutable Actions**: The `actions` array in the template is strictly protected. Users cannot append, replace, or modify the execution steps via `options`. This prevents external logic from breaking the scraper's flow.
- **User Flexibility**: Properties **not** explicitly defined in the template (such as `proxy`, `timeoutMs`, or custom variables) can be freely set by the user in the constructor or `search()` method.

```typescript
// Create a persistent session
const google = new GoogleSearcher({
  headless: false, // Override if not locked in template
  proxy: 'http://my-proxy:8080',
  timeoutMs: 30000 // Set a global timeout (valid if template doesn't define it)
});
```

### 🧠 Intelligent Navigation (Goto)

The `WebSearcher` automatically manages navigation to the search URL.

1. **Auto-Injection**: If your template does **not** include a `goto` action, the searcher automatically inserts one at the beginning of the action list, pointing to the resolved `url` (with query variables injected).
2. **Manual Control**: If you explicitly add a `goto` action in your template that matches the resolved URL, the searcher detects this duplicate and **skips** the automatic injection. This gives you full control to add headers, referrer, or other specific parameters to the navigation step if needed.
3. **Multi-Step Flows**: You can define multiple `goto` actions in your template (e.g., visit a login page first). The searcher will still prepend the main search URL navigation unless one of your `goto` actions matches it exactly.

```typescript
try {
  // First query
  // You can also pass runtime options to override session defaults or inject variables
  const results1 = await google.search('term A', {
    timeoutMs: 60000, // Override session timeout just for this search
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

Override `transform` to clean data. The `context` parameter contains the current search state and any custom parameters you passed to `search()`. Since `WebSearcher` is a `FetchSession`, you can also make extra requests (like resolving redirects) using `this`.

```typescript
protected override async transform(outputs: Record<string, any>, context: SearchContext) {
  const results = outputs['results'] || [];

  // You can access custom parameters from context
  if (context.myCustomFlag) {
    // ... logic
  }

  // Clean data or filter
  return results.map(item => ({
    ...item,
    title: item.title.trim(),
    url: new URL(item.url, 'https://blog.example.com').href
  }));
}
```

### 🧠 Advanced Concepts

### Auto-Pagination: `limit` vs `maxPages`

The `WebSearcher` is designed to be result-oriented. When you call `search()`, you specify how many results you want, and the searcher handles the pagination logic.

- **`limit`**: Your target number of total results.
- **`maxPages`**: The safety threshold. It limits how many pages (fetch cycles) the searcher is allowed to navigate to satisfy your `limit`.

**Example Logic:**
If you request `{ limit: 50 }` but each page only has 5 results:

1. The searcher fetches page 1 (5 results).
2. It sees `5 < 50`, so it fetches page 2.
3. It continues until it has 50 results **OR** it reaches `maxPages` (default 10).

This prevent infinite loops if the "Next" button selector is broken or if the search engine keeps returning the same results.

### User-defined Transforms

Users can provide their own `transform` when calling `search`. This runs **after** the engine's built-in transform.

This is extremely powerful for **filtering out ads** or irrelevant content. If the user filters out results, the auto-pagination logic will automatically kick in to fetch more pages to ensure the final result list meets your requested `limit` with only valid entries.

```typescript
await google.search('test', {
  limit: 20,
  myCustomFlag: true,
  // Example: Filter out sponsored results and only keep PDFs
  transform: (results, context) => {
    console.log('Searching for:', context.query);
    return results.filter(r => {
      const isAd = r.isSponsored || r.url.includes('googleadservices.com');
      return !isAd && r.url.endsWith('.pdf');
    });
  }
});
```

### Standardized Search Options

When calling `search()`, you can provide standardized options that the search engine will map to specific parameters:

```typescript
const results = await google.search('open source', {
  limit: 20,
  timeRange: 'month',       // 'hour', 'day', 'week', 'month', 'year'
  // Or custom range:
  // timeRange: { from: '2023-01-01', to: '2023-12-31' },
  category: 'news',         // 'all', 'images', 'videos', 'news'
  region: 'US',             // ISO 3166-1 alpha-2
  language: 'en',           // ISO 639-1
  safeSearch: 'strict',     // 'off', 'moderate', 'strict'
});
```

#### Search Options Reference

| Option | Type | Description |
| :--- | :--- | :--- |
| `limit` | `number` | The target number of total results to retrieve. The searcher will automatically paginate to reach this number. |
| `maxPages` | `number` | The maximum number of pages (fetch cycles) to fetch. Safety threshold to prevent infinite loops. Default: `10`. |
| `timeRange` | `string` \| `object` | Filter by time. Presets: `'all'`, `'hour'`, `'day'`, `'week'`, `'month'`, `'year'`. <br/> Or `{ from: Date\|string, to?: Date\|string }` |
| `category` | `string` | Search category: `'all'`, `'images'`, `'videos'`, `'news'`. |
| `region` | `string` | ISO 3166-1 alpha-2 region code (e.g., `'US'`, `'CN'`). |
| `language` | `string` | ISO 639-1 language code (e.g., `'en'`, `'zh-CN'`). |
| `safeSearch` | `string` | Safe search level: `'off'`, `'moderate'`, `'strict'`. |
| `transform` | `function` | A custom function to filter or modify results at runtime. Runs after the engine's built-in transform. |
| `...custom` | `any` | Any other keys are passed as custom variables to the template (e.g., `${myVar}`). |

#### Standard Search Result

Each result in the returned array follows this structure:

| Field | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | The title of the search result. |
| `url` | `string` | The absolute URL of the result. |
| `snippet` | `string` | A brief snippet or description. |
| `image` | `string` | (Optional) URL of a thumbnail or associated image. |
| `date` | `string`\|`Date` | (Optional) Publication date. |
| `author` | `string` | (Optional) Author or source name. |
| `favicon` | `string` | (Optional) Favicon URL of the source website. |
| `rank` | `number` | (Optional) 1-indexed position in the results. |
| `source` | `string` | (Optional) Source website name (e.g., 'GitHub'). |

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
