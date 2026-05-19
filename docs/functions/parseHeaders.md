[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / parseHeaders

# Function: parseHeaders()

> **parseHeaders**(`headers`): `Record`\<`string`, `string`\>

Defined in: [web-searcher/src/utils/extractor/parser.ts:25](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L25)

Converts a Web API Headers object into a plain JavaScript record.
All header names are converted to lowercase for consistent access.

## Parameters

### headers

`Headers`

The Headers object to parse.

## Returns

`Record`\<`string`, `string`\>

A record where keys are lowercase header names.
