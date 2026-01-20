[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / SearchOptions

# Interface: SearchOptions

Defined in: [web-searcher/src/types.ts:120](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L120)

Options provided when executing a search.

## Indexable

\[`key`: `string`\]: `any`

Any other custom variables to be injected into the template.

## Properties

### category?

> `optional` **category**: [`SearchCategory`](../type-aliases/SearchCategory.md)

Defined in: [web-searcher/src/types.ts:144](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L144)

The category of results to return.
Default: 'all' (web search)

***

### language?

> `optional` **language**: `string`

Defined in: [web-searcher/src/types.ts:154](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L154)

Language code (ISO 639-1) for the interface or results (e.g., 'en', 'zh-CN').

***

### limit?

> `optional` **limit**: `number`

Defined in: [web-searcher/src/types.ts:122](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L122)

The maximum number of results to retrieve.

***

### maxPages?

> `optional` **maxPages**: `number`

Defined in: [web-searcher/src/types.ts:132](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L132)

The maximum number of pages (fetch cycles) allowed to reach the requested `limit`.

This is a safety guard. If the `limit` is high but each page has few results, 
the searcher will stop once this page count is reached.

If not provided, it defaults to the value in `PaginationConfig` or 10.

***

### region?

> `optional` **region**: `string`

Defined in: [web-searcher/src/types.ts:149](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L149)

Region code (ISO 3166-1 alpha-2) to bias results (e.g., 'US', 'CN', 'JP').

***

### safeSearch?

> `optional` **safeSearch**: [`SafeSearchLevel`](../type-aliases/SafeSearchLevel.md)

Defined in: [web-searcher/src/types.ts:160](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L160)

Safe search filtering level.
Default: engine dependent (usually 'moderate' or 'strict' by default).

***

### timeRange?

> `optional` **timeRange**: [`SearchTimeRange`](../type-aliases/SearchTimeRange.md)

Defined in: [web-searcher/src/types.ts:138](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L138)

Date range for the search results.
Default: 'all'

***

### transform()?

> `optional` **transform**: (`results`, `context`) => [`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/types.ts:166](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L166)

A custom transform function to filter or modify results at runtime.
This runs AFTER the engine-level transform.

#### Parameters

##### results

[`StandardSearchResult`](StandardSearchResult.md)[]

##### context

[`SearchContext`](SearchContext.md)

#### Returns

[`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>
