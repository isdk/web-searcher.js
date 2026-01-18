[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / SearchOptions

# Interface: SearchOptions

Defined in: [web-searcher/src/types.ts:94](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L94)

Options provided when executing a search.

## Indexable

\[`key`: `string`\]: `any`

Any other custom variables to be injected into the template.

## Properties

### category?

> `optional` **category**: [`SearchCategory`](../type-aliases/SearchCategory.md)

Defined in: [web-searcher/src/types.ts:108](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L108)

The category of results to return.
Default: 'all' (web search)

***

### language?

> `optional` **language**: `string`

Defined in: [web-searcher/src/types.ts:118](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L118)

Language code (ISO 639-1) for the interface or results (e.g., 'en', 'zh-CN').

***

### limit?

> `optional` **limit**: `number`

Defined in: [web-searcher/src/types.ts:96](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L96)

The maximum number of results to retrieve.

***

### region?

> `optional` **region**: `string`

Defined in: [web-searcher/src/types.ts:113](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L113)

Region code (ISO 3166-1 alpha-2) to bias results (e.g., 'US', 'CN', 'JP').

***

### safeSearch?

> `optional` **safeSearch**: [`SafeSearchLevel`](../type-aliases/SafeSearchLevel.md)

Defined in: [web-searcher/src/types.ts:124](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L124)

Safe search filtering level.
Default: engine dependent (usually 'moderate' or 'strict' by default).

***

### timeRange?

> `optional` **timeRange**: [`SearchTimeRange`](../type-aliases/SearchTimeRange.md)

Defined in: [web-searcher/src/types.ts:102](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L102)

Date range for the search results.
Default: 'all'

***

### transform()?

> `optional` **transform**: (`results`, `context`) => [`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/types.ts:130](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L130)

A custom transform function to filter or modify results at runtime.
This runs AFTER the engine-level transform.

#### Parameters

##### results

[`StandardSearchResult`](StandardSearchResult.md)[]

##### context

[`SearchContext`](SearchContext.md)

#### Returns

[`StandardSearchResult`](StandardSearchResult.md)[] \| `Promise`\<[`StandardSearchResult`](StandardSearchResult.md)[]\>
