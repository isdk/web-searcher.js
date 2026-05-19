[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / SearchOptions

# Interface: SearchOptions

Defined in: [web-searcher/src/types.ts:129](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L129)

Options provided when executing a search.

## Indexable

\[`key`: `string`\]: `any`

Any other custom variables to be injected into the template.

## Properties

### baseUrls?

> `optional` **baseUrls**: `string`[] \| `Record`\<`string`, `string`[]\>

Defined in: [web-searcher/src/types.ts:187](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L187)

Allows the user to dynamically specify or override the base URLs for the engines.
Can be an array of URLs for a single engine, or a map of engine names to URL arrays.

***

### category?

> `optional` **category**: `string`

Defined in: [web-searcher/src/types.ts:153](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L153)

The category of results to return.
Default: 'all' (web search)

***

### fillLimit?

> `optional` **fillLimit**: `boolean`

Defined in: [web-searcher/src/types.ts:204](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L204)

If true (default), the searcher will attempt to fulfill the requested `limit`
by falling back to subsequent engines in the chain if previous ones are exhausted.
If false, it will stop after the first successful engine regardless of whether 
the limit was reached.

***

### language?

> `optional` **language**: `string`

Defined in: [web-searcher/src/types.ts:163](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L163)

Language code (ISO 639-1) for the interface or results (e.g., 'en', 'zh-CN').

***

### limit?

> `optional` **limit**: `number`

Defined in: [web-searcher/src/types.ts:131](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L131)

The maximum number of results to retrieve.

***

### maxPages?

> `optional` **maxPages**: `number`

Defined in: [web-searcher/src/types.ts:141](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L141)

The maximum number of pages (fetch cycles) allowed to reach the requested `limit`.

This is a safety guard. If the `limit` is high but each page has few results,
the searcher will stop once this page count is reached.

If not provided, it defaults to the value in `PaginationConfig` or 10.

***

### region?

> `optional` **region**: `string`

Defined in: [web-searcher/src/types.ts:158](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L158)

Region code (ISO 3166-1 alpha-2) to bias results (e.g., 'US', 'CN', 'JP').

***

### safeSearch?

> `optional` **safeSearch**: [`SafeSearchLevel`](../type-aliases/SafeSearchLevel.md)

Defined in: [web-searcher/src/types.ts:169](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L169)

Safe search filtering level.
Default: engine dependent (usually 'moderate' or 'strict' by default).

***

### startPage?

> `optional` **startPage**: `number`

Defined in: [web-searcher/src/types.ts:211](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L211)

Specifies which page index to start the search from.
Useful when delegating pagination across different sessions.

#### Default

```ts
0
```

***

### timeRange?

> `optional` **timeRange**: [`SearchTimeRange`](../type-aliases/SearchTimeRange.md)

Defined in: [web-searcher/src/types.ts:147](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L147)

Date range for the search results.
Default: 'all'

***

### transform()?

> `optional` **transform**: (`results`, `context`) => [`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/types.ts:175](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L175)

A custom transform function to filter or modify results at runtime.
This runs AFTER the engine-level transform.

#### Parameters

##### results

[`StandardSearchResult`](StandardSearchResult.md)[]

##### context

[`SearchContext`](SearchContext.md)

#### Returns

[`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>

***

### validator()?

> `optional` **validator**: (`results`, `context`) => `boolean` \| `Promise`\<`boolean`\>

Defined in: [web-searcher/src/types.ts:193](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L193)

User-defined callback to validate the fetched results for a page.
If it returns false, the fetch is considered a failure, triggering the retry/failover mechanism.

#### Parameters

##### results

[`StandardSearchResult`](StandardSearchResult.md)[]

##### context

[`SearchContext`](SearchContext.md)

#### Returns

`boolean` \| `Promise`\<`boolean`\>
