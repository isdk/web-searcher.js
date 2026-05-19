[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / FetchExtractorOptions

# Interface: FetchExtractorOptions

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:4](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/fetcher.ts#L4)

Options for network requests.

## Extended by

- [`ExtractOptions`](ExtractOptions.md)

## Properties

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:8](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/fetcher.ts#L8)

Custom HTTP headers to include in the request.

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:6](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/fetcher.ts#L6)

Timeout in milliseconds. Defaults vary by function (5s to 10s).
