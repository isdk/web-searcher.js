[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / fetchPartial

# Function: fetchPartial()

> **fetchPartial**(`url`, `maxBytes`, `options`): `Promise`\<\{ `content`: `string`; `headers`: `Headers`; \} \| `null`\>

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:55](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/fetcher.ts#L55)

Fetches a partial amount of content from a URL.
Automatically handles character set detection from the Content-Type header.
Aborts the request once the specified maxBytes is reached.

## Parameters

### url

`string`

The URL to fetch.

### maxBytes

`number` = `32768`

The maximum number of bytes to read. Defaults to 32KB.

### options

[`FetchExtractorOptions`](../interfaces/FetchExtractorOptions.md) = `{}`

Request options.

## Returns

`Promise`\<\{ `content`: `string`; `headers`: `Headers`; \} \| `null`\>

An object containing the decoded content string and the response headers.
