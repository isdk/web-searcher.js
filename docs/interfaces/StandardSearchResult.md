[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / StandardSearchResult

# Interface: StandardSearchResult

Defined in: [web-searcher/src/types.ts:5](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L5)

Interface representing a standardized search result item.
This ensures consistency across different search engines.

## Indexable

\[`key`: `string`\]: `any`

Allows for engine-specific extra fields (e.g., rank, author, date).

## Properties

### image?

> `optional` **image**: `string`

Defined in: [web-searcher/src/types.ts:16](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L16)

An optional image URL associated with the result.

***

### snippet?

> `optional` **snippet**: `string`

Defined in: [web-searcher/src/types.ts:13](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L13)

A brief snippet or description of the result.

***

### title

> **title**: `string`

Defined in: [web-searcher/src/types.ts:7](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L7)

The title of the search result.

***

### url

> **url**: `string`

Defined in: [web-searcher/src/types.ts:10](https://github.com/isdk/web-searcher.js/blob/e9a6e5ec9526780489427743389b927a5c16db5c/src/types.ts#L10)

The URL of the search result.
