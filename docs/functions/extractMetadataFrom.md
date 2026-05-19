[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / extractMetadataFrom

# Function: extractMetadataFrom()

> **extractMetadataFrom**(`result`, `type`): `string` \| `null`

Defined in: [web-searcher/src/utils/extractor/extractor.ts:27](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/extractor.ts#L27)

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
