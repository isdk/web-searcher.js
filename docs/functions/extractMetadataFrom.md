[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / extractMetadataFrom

# Function: extractMetadataFrom()

> **extractMetadataFrom**(`result`, `type`): `string` \| `null`

Defined in: [web-searcher/src/utils/extractor/extractor.ts:27](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/extractor.ts#L27)

Extracts specific metadata from parsed HTML and headers based on a requested type.
Currently supports 'date' extraction with a prioritized fallback mechanism.

## Parameters

### result

An object containing the raw HTML content and response headers.

#### content

`string`

#### headers

`Headers`

### type

`string`

The type of metadata to extract.

## Returns

`string` \| `null`

The extracted and normalized value, or null if not found.
