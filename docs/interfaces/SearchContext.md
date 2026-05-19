[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / SearchContext

# Interface: SearchContext

Defined in: [web-searcher/src/types.ts:91](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L91)

Context object passed to the transform function.

## Indexable

\[`key`: `string`\]: `any`

Allows for custom variables passed via search options.

## Properties

### baseUrl?

> `optional` **baseUrl**: `string`

Defined in: [web-searcher/src/types.ts:105](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L105)

The baseUrl used for this specific fetch (if multi-instance is enabled)

***

### engine?

> `optional` **engine**: `string`

Defined in: [web-searcher/src/types.ts:108](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L108)

The name of the engine executing the search

***

### limit?

> `optional` **limit**: `number`

Defined in: [web-searcher/src/types.ts:99](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L99)

The requested limit of results.

***

### page

> **page**: `number`

Defined in: [web-searcher/src/types.ts:96](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L96)

The current page index (0-based).

***

### query

> **query**: `string`

Defined in: [web-searcher/src/types.ts:93](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/types.ts#L93)

The original search query.
