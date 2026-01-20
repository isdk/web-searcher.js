[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / StandardSearchResult

# Interface: StandardSearchResult

Defined in: [web-searcher/src/types.ts:5](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L5)

Interface representing a standardized search result item.
This ensures consistency across different search engines.

## Indexable

\[`key`: `string`\]: `any`

Allows for engine-specific extra fields (e.g., siteIcon, category).

## Properties

### author?

> `optional` **author**: `string`

Defined in: [web-searcher/src/types.ts:22](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L22)

The author or source name of the result.

***

### date?

> `optional` **date**: `string` \| `Date`

Defined in: [web-searcher/src/types.ts:19](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L19)

The date the result was published or last updated.

***

### favicon?

> `optional` **favicon**: `string`

Defined in: [web-searcher/src/types.ts:25](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L25)

The favicon URL of the source website.

***

### image?

> `optional` **image**: `string`

Defined in: [web-searcher/src/types.ts:16](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L16)

An optional image URL associated with the result.

***

### rank?

> `optional` **rank**: `number`

Defined in: [web-searcher/src/types.ts:28](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L28)

The rank or position of the result (usually 1-indexed).

***

### snippet?

> `optional` **snippet**: `string`

Defined in: [web-searcher/src/types.ts:13](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L13)

A brief snippet or description of the result.

***

### source?

> `optional` **source**: `string`

Defined in: [web-searcher/src/types.ts:31](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L31)

The source website name (e.g., 'GitHub', 'StackOverflow').

***

### title

> **title**: `string`

Defined in: [web-searcher/src/types.ts:7](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L7)

The title of the search result.

***

### url

> **url**: `string`

Defined in: [web-searcher/src/types.ts:10](https://github.com/isdk/web-searcher.js/blob/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea/src/types.ts#L10)

The URL of the search result.
