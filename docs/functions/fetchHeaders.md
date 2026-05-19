[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / fetchHeaders

# Function: fetchHeaders()

> **fetchHeaders**(`url`, `options`): `Promise`\<`Headers` \| `null`\>

Defined in: [web-searcher/src/utils/extractor/fetcher.ts:19](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/fetcher.ts#L19)

Fetches only the HTTP headers for a given URL using a HEAD request.
Useful for checking 'last-modified' without downloading the body.

## Parameters

### url

`string`

The URL to check.

### options

[`FetchExtractorOptions`](../interfaces/FetchExtractorOptions.md) = `{}`

Request options.

## Returns

`Promise`\<`Headers` \| `null`\>

The Headers object, or null on failure.
