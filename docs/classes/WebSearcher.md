[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / WebSearcher

# Abstract Class: WebSearcher

Defined in: [web-searcher/src/searcher.ts:31](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L31)

The abstract base class for all search engines.

It extends `FetchSession`, meaning each `WebSearcher` instance is an active session
capable of maintaining state (e.g., cookies, local storage) across multiple search queries.

Developers should extend this class to create specific search engine implementations
(e.g., Google, Bing, DuckDuckGo).

## Example

```typescript
class MySearcher extends WebSearcher {
  get template() {
    return { url: '...' };
  }
}
WebSearcher.register(MySearcher);
```

## Extends

- `FetchSession`

## Extended by

- [`GoogleSearcher`](GoogleSearcher.md)

## Constructors

### Constructor

> **new WebSearcher**(`options?`): `WebSearcher`

Defined in: web-fetcher/dist/index.d.ts:2275

Creates a new FetchSession.

#### Parameters

##### options?

`FetcherOptions`

Configuration options for the fetcher.

#### Returns

`WebSearcher`

#### Inherited from

`FetchSession.constructor`

## Properties

### closed

> `protected` **closed**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:2269

#### Inherited from

`FetchSession.closed`

***

### context

> `readonly` **context**: `FetchContext`

Defined in: web-fetcher/dist/index.d.ts:2268

The execution context for this session, containing configurations, event bus, and shared state.

#### Inherited from

`FetchSession.context`

***

### id

> `readonly` **id**: `string`

Defined in: web-fetcher/dist/index.d.ts:2264

Unique identifier for the session.

#### Inherited from

`FetchSession.id`

***

### options

> `protected` **options**: `FetcherOptions`

Defined in: web-fetcher/dist/index.d.ts:2260

#### Inherited from

`FetchSession.options`

***

### \_isFactory

> `static` **\_isFactory**: `boolean` = `false`

Defined in: [web-searcher/src/searcher.ts:33](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L33)

***

### alias?

> `static` `optional` **alias**: `string` \| `string`[]

Defined in: [web-searcher/src/searcher.ts:45](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L45)

Engine alias(es). Can be a single string or an array of strings.
Useful for registering shorthand names (e.g., 'g' for 'Google').

***

### createObject()

> `static` **createObject**: (`name`, ...`args`) => `WebSearcher`

Defined in: [web-searcher/src/searcher.ts:78](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L78)

Creates an instance of the registered search engine.

#### Parameters

##### name

`string`

The name of the engine.

##### args

...`any`[]

Arguments to pass to the constructor.

#### Returns

`WebSearcher`

An instance of the search engine.

***

### forEach()

> `static` **forEach**: (`cb`) => `void`

Defined in: [web-searcher/src/searcher.ts:85](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L85)

Iterates over all registered engines.

#### Parameters

##### cb

(`ctor`, `name`) => `void`

Callback function to invoke for each registered engine.

#### Returns

`void`

***

### get()

> `static` **get**: (`name`) => *typeof* `WebSearcher`

Defined in: [web-searcher/src/searcher.ts:69](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L69)

Retrieves a registered search engine class by name.

#### Parameters

##### name

`string`

The name of the engine (e.g., 'Google').

#### Returns

*typeof* `WebSearcher`

The search engine class constructor.

***

### name?

> `static` `optional` **name**: `string`

Defined in: [web-searcher/src/searcher.ts:40](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L40)

Custom engine name. If not provided, it is derived from the class name.
For example, `GoogleSearcher` becomes `Google`.

***

### register()

> `static` **register**: (`ctor`, `options?`) => `boolean`

Defined in: [web-searcher/src/searcher.ts:54](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L54)

Registers a search engine class.

#### Parameters

##### ctor

*typeof* `WebSearcher`

The search engine class to register.

##### options?

Registration options. If a string is provided, it is used as the registered name.

`string` | `IBaseFactoryOptions`

#### Returns

`boolean`

`true` if registration was successful.

***

### setAliases()

> `static` **setAliases**: (`ctor`, ...`aliases`) => `void`

Defined in: [web-searcher/src/searcher.ts:93](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L93)

Sets aliases for a registered engine.

#### Parameters

##### ctor

*typeof* `WebSearcher`

The search engine class.

##### aliases

...`string`[]

Aliases to add.

#### Returns

`void`

***

### unregister()

> `static` **unregister**: (`name?`) => `void`

Defined in: [web-searcher/src/searcher.ts:61](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L61)

Unregisters a search engine.

#### Parameters

##### name?

The name or class to unregister.

`string` | *typeof* `WebSearcher`

#### Returns

`void`

## Accessors

### pagination

#### Get Signature

> **get** **pagination**(): [`PaginationConfig`](../interfaces/PaginationConfig.md) \| `undefined`

Defined in: [web-searcher/src/searcher.ts:151](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L151)

Optional pagination configuration.
Defines how the searcher navigates to subsequent pages.

If undefined, the searcher will only fetch the first page.

##### Returns

[`PaginationConfig`](../interfaces/PaginationConfig.md) \| `undefined`

***

### template

#### Get Signature

> **get** `abstract` **template**(): `FetcherOptions`

Defined in: [web-searcher/src/searcher.ts:143](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L143)

The declarative template for the fetch options.

Subclasses **must** implement this getter to provide the engine configuration,
including the base URL, search parameters pattern, and extraction rules.

Supports variable injection using syntax like `${query}`, `${offset}`, etc.

##### Example

```typescript
get template() {
  return {
    url: 'https://example.com/search?q=${query}',
    actions: [ ... ]
  };
}
```

##### Returns

`FetcherOptions`

## Methods

### createContext()

> `protected` **createContext**(`options`): `FetchContext`

Defined in: [web-searcher/src/searcher.ts:155](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L155)

#### Parameters

##### options

`FetcherOptions` = `...`

#### Returns

`FetchContext`

#### Overrides

`FetchSession.createContext`

***

### dispose()

> **dispose**(): `Promise`\<`void`\>

Defined in: web-fetcher/dist/index.d.ts:2334

Disposes of the session and its associated engine.

#### Returns

`Promise`\<`void`\>

#### Remarks

This method should be called when the session is no longer needed to free up resources
(e.g., closing browser instances, purging temporary storage).

#### Inherited from

`FetchSession.dispose`

***

### execute()

> **execute**\<`R`\>(`actionOptions`, `context?`): `Promise`\<`FetchActionResult`\<`R`\>\>

Defined in: web-fetcher/dist/index.d.ts:2289

Executes a single action within the session.

#### Type Parameters

##### R

`R` *extends* `FetchReturnType` = `"response"`

The expected return type of the action.

#### Parameters

##### actionOptions

`_RequireAtLeastOne`

Configuration for the action to be executed.

##### context?

`FetchContext`

Optional context override for this specific execution. Defaults to the session context.

#### Returns

`Promise`\<`FetchActionResult`\<`R`\>\>

A promise that resolves to the result of the action.

#### Example

```ts
await session.execute({ name: 'goto', params: { url: 'https://example.com' } });
```

#### Inherited from

`FetchSession.execute`

***

### executeAll()

> **executeAll**(`actions`, `options?`): `Promise`\<\{ `outputs`: `Record`\<`string`, `any`\>; `result`: `FetchResponse` \| `undefined`; \}\>

Defined in: web-fetcher/dist/index.d.ts:2306

Executes a sequence of actions.

#### Parameters

##### actions

`_RequireAtLeastOne`\<`FetchActionProperties`, `"id"` \| `"name"` \| `"action"`\>[]

An array of action options to be executed in order.

##### options?

`Partial`\<`FetcherOptions`\> & `object`

Optional temporary configuration overrides (e.g., timeoutMs, headers) for this batch of actions.
                 These overrides do not affect the main session context.

#### Returns

`Promise`\<\{ `outputs`: `Record`\<`string`, `any`\>; `result`: `FetchResponse` \| `undefined`; \}\>

A promise that resolves to an object containing the result of the last action and all accumulated outputs.

#### Example

```ts
const { result, outputs } = await session.executeAll([
  { name: 'goto', params: { url: 'https://example.com' } },
  { name: 'extract', params: { schema: { title: 'h1' } }, storeAs: 'data' }
], { timeoutMs: 30000 });
```

#### Inherited from

`FetchSession.executeAll`

***

### formatOptions()

> `protected` **formatOptions**(`options`): `Record`\<`string`, `any`\>

Defined in: [web-searcher/src/searcher.ts:309](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L309)

Transforms standard options into engine-specific template variables.

Subclasses should override this to map standard options like 'timeRange',
'category', 'region' into the specific URL parameters required by the engine
(e.g., mapping `timeRange: 'day'` to `tbs: 'qdr:d'` for Google).

#### Parameters

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

The search options provided by the user.

#### Returns

`Record`\<`string`, `any`\>

A dictionary of variables to be injected into the template.

***

### getOutputs()

> **getOutputs**(): `Record`\<`string`, `any`\>

Defined in: web-fetcher/dist/index.d.ts:2317

Retrieves all outputs accumulated during the session.

#### Returns

`Record`\<`string`, `any`\>

A record of stored output data.

#### Inherited from

`FetchSession.getOutputs`

***

### getState()

> **getState**(): `Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

Defined in: web-fetcher/dist/index.d.ts:2323

Gets the current state of the session, including cookies and engine-specific state.

#### Returns

`Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

A promise resolving to the session state, or undefined if no engine is initialized.

#### Inherited from

`FetchSession.getState`

***

### search()

> **search**(`query`, `options`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:182](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L182)

Executes a search query.

This method handles the pagination loop, variable injection, fetching,
and result transformation.

#### Parameters

##### query

`string`

The search query string.

##### options

[`SearchOptions`](../interfaces/SearchOptions.md) = `{}`

Optional search parameters (e.g., limit, timeRange).

#### Returns

`Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

A promise resolving to an array of standardized search results.

***

### transform()

> `protected` **transform**(`outputs`, `context`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:291](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L291)

Transform and clean the raw extracted results.

Subclasses should override this method to provide engine-specific cleaning,
normalization, or post-processing of the data extracted by the fetcher.

#### Parameters

##### outputs

`Record`\<`string`, `any`\>

The complete outputs object from the fetch actions.

##### context

[`SearchContext`](../interfaces/SearchContext.md)

The search context (query, page, etc.).

#### Returns

`Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

A promise resolving to an array of standardized search results.

***

### search()

> `static` **search**(`engineName`, `query`, `options`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:106](https://github.com/isdk/web-searcher.js/blob/e17f1bcb40984e389c2901da9e3b4886a969899a/src/searcher.ts#L106)

Static helper to execute a one-off search.

It creates an instance of the specified engine, executes the search, and then
automatically disposes of the session.

#### Parameters

##### engineName

`string`

The name of the engine to use (e.g., 'Google').

##### query

`string`

The search query string.

##### options

[`SearchOptions`](../interfaces/SearchOptions.md) & `FetcherOptions` = `{}`

Combined search options and fetcher options.

#### Returns

`Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

A promise resolving to an array of standardized search results.
