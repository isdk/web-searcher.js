[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / normalizeDate

# Function: normalizeDate()

> **normalizeDate**(`dateStr`): `string` \| `null`

Defined in: [web-searcher/src/utils/extractor/date-normalizer.ts:9](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/date-normalizer.ts#L9)

Normalizes a date string into a standard ISO 8601 format (UTC).
It handles various formats (YYYY-MM-DD, RFC2822, etc.) and performs
aggressive cleaning and sanity checks.

## Parameters

### dateStr

The raw date string to normalize.

`string` | `null`

## Returns

`string` \| `null`

An ISO 8601 string (e.g., "2024-01-20T00:00:00.000Z") or null if invalid.
