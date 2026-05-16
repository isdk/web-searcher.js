[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / extractDate

# Function: extractDate()

> **extractDate**(`url`, `options`): `Promise`\<`string` \| `null`\>

Defined in: [web-searcher/src/utils/extractor/date-extractor.ts:30](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/date-extractor.ts#L30)

High-level convenience function to extract the publication or modification date from a URL.
It performs a partial fetch of the content and applies multiple extraction rules
(LD+JSON, Meta tags, Time tags, Headers) to find the most reliable date.

## Parameters

### url

`string`

The web page URL to analyze.

### options

[`ExtractOptions`](../interfaces/ExtractOptions.md) = `{}`

Fetch and extraction options.

## Returns

`Promise`\<`string` \| `null`\>

An ISO 8601 date string, or null if no valid date could be found.

## Example

```ts
const date = await extractDate('https://example.com/article');
console.log(date); // "2024-01-20T12:00:00.000Z"
```
