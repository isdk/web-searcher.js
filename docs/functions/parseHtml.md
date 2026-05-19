[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / parseHtml

# Function: parseHtml()

> **parseHtml**(`html`): [`HtmlData`](../interfaces/HtmlData.md)

Defined in: [web-searcher/src/utils/extractor/parser.ts:49](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/extractor/parser.ts#L49)

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
