[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / PaginationConfig

# Interface: PaginationConfig

Defined in: [web-searcher/src/types.ts:41](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L41)

Configuration for pagination strategies.
Defines how the searcher should navigate to the next page of results.

## Properties

### increment?

> `optional` **increment**: `number`

Defined in: [web-searcher/src/types.ts:68](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L68)

The increment step for each page.
- If the parameter represents an item offset (like Google's 'start'), this might be 10.
- If the parameter represents a page number, this is usually 1.

#### Default

```ts
1
```

***

### maxPages?

> `optional` **maxPages**: `number`

Defined in: [web-searcher/src/types.ts:85](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L85)

The safety threshold for the maximum number of pages to fetch automatically 
in a single search call.

Even if the requested `limit` of results hasn't been reached, the searcher 
will stop after this many pages to prevent infinite loops or excessive API usage.

#### Default

```ts
10
```

***

### nextButtonSelector?

> `optional` **nextButtonSelector**: `string`

Defined in: [web-searcher/src/types.ts:74](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L74)

The CSS selector for the "Next" page button.
Required if type is 'click-next'.

***

### paramName?

> `optional` **paramName**: `string`

Defined in: [web-searcher/src/types.ts:54](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L54)

The name of the URL parameter used for pagination.
Required if type is 'url-param'.

#### Example

```ts
'start' for Google, 'page' or 'p' for others.
```

***

### startValue?

> `optional` **startValue**: `number`

Defined in: [web-searcher/src/types.ts:60](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L60)

The starting value for the pagination parameter.

#### Default

```ts
0
```

***

### type

> **type**: `"url-param"` \| `"click-next"`

Defined in: [web-searcher/src/types.ts:47](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/types.ts#L47)

The type of pagination mechanism:
- 'url-param': Pagination is handled by modifying URL parameters (e.g., `?page=2` or `?start=10`).
- 'click-next': Pagination is handled by clicking a "Next" button on the page (only works in 'browser' mode).
