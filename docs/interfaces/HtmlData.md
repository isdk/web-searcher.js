[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / HtmlData

# Interface: HtmlData

Defined in: [web-searcher/src/utils/extractor/parser.ts:4](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L4)

Represents structured data extracted from an HTML document.

## Properties

### jsonLd

> **jsonLd**: `any`[]

Defined in: [web-searcher/src/utils/extractor/parser.ts:8](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L8)

Array of parsed JSON-LD objects found in the document.

***

### meta

> **meta**: `Record`\<`string`, `string`\>

Defined in: [web-searcher/src/utils/extractor/parser.ts:6](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L6)

Map of meta tag names/properties to their content. Keys are lowercase.

***

### time

> **time**: `object`[]

Defined in: [web-searcher/src/utils/extractor/parser.ts:10](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L10)

Array of data from HTML <time> tags.

#### datetime

> **datetime**: `string` \| `null`

The value of the 'datetime' attribute, if present.

#### text

> **text**: `string`

The text content within the <time> tag, with HTML stripped.
