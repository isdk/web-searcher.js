[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / parseHtml

# Function: parseHtml()

> **parseHtml**(`html`): [`HtmlData`](../interfaces/HtmlData.md)

Defined in: [web-searcher/src/utils/extractor/parser.ts:49](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/extractor/parser.ts#L49)

Parses an HTML string to extract generic metadata structures (Meta tags, JSON-LD, Time tags).

This function does not perform field-specific logic (like finding a date); it simply

collects available structured data.

## Parameters

### html

`string`

The raw HTML content to parse.

## Returns

[`HtmlData`](../interfaces/HtmlData.md)

An object containing grouped metadata from the HTML.
