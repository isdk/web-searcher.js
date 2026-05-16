[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / ExtractOptions

# Interface: ExtractOptions

Defined in: [web-searcher/src/utils/extractor/date-extractor.ts:7](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/date-extractor.ts#L7)

Options for the extractDate function.

## Extends

- [`FetchExtractorOptions`](FetchExtractorOptions.md)

## Properties

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:8](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/fetcher.ts#L8)

Custom HTTP headers to include in the request.

#### Inherited from

[`FetchExtractorOptions`](FetchExtractorOptions.md).[`headers`](FetchExtractorOptions.md#headers)

***

### maxBytes?

> `optional` **maxBytes**: `number`

Defined in: [web-searcher/src/utils/extractor/date-extractor.ts:12](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/date-extractor.ts#L12)

Maximum number of bytes to download from the URL.
Defaults to 32768 (32KB), which is usually enough for the HTML <head>.

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:6](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/fetcher.ts#L6)

Timeout in milliseconds. Defaults vary by function (5s to 10s).

#### Inherited from

[`FetchExtractorOptions`](FetchExtractorOptions.md).[`timeout`](FetchExtractorOptions.md#timeout)
