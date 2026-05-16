[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / parseHeaders

# Function: parseHeaders()

> **parseHeaders**(`headers`): `Record`\<`string`, `string`\>

Defined in: [web-searcher/src/utils/extractor/parser.ts:25](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/parser.ts#L25)

Converts a Web API Headers object into a plain JavaScript record.
All header names are converted to lowercase for consistent access.

## Parameters

### headers

`Headers`

The Headers object to parse.

## Returns

`Record`\<`string`, `string`\>

A record where keys are lowercase header names.
