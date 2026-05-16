[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / GoogleSearcher

# Class: GoogleSearcher

Defined in: [web-searcher/src/engines/google.ts:24](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L24)

A sample implementation of a Google Search scraper.

## Remarks

**⚠️ DEMO ONLY ⚠️**

This class serves as a **reference implementation** to demonstrate how to extend
the `WebSearcher` base class. It is **NOT intended for production use**.

Google frequently changes its HTML structure and employs sophisticated anti-bot measures.
A production-grade Google scraper would require robust proxy rotation, CAPTCHA solving,
and constant maintenance of selectors, or usage of an official API.

Use this class to understand:
1. How to define a fetch template with variable injection.
2. How to map standard options (like time range) to engine-specific URL parameters.
3. How to handle pagination.
4. How to transform and clean raw extracted data.

## Extends

- [`WebSearcher`](WebSearcher.md)

## Constructors

### Constructor

> **new GoogleSearcher**(`options?`): `GoogleSearcher`

Defined in: web-fetcher/dist/index.d.ts:1171

Creates a new FetchSession.

#### Parameters

##### options?

[`FetcherOptions`](../interfaces/FetcherOptions.md)

Configuration options for the fetcher.

#### Returns

`GoogleSearcher`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`constructor`](WebSearcher.md#constructor)

## Properties

### closed

> `protected` **closed**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1165

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`closed`](WebSearcher.md#closed)

***

### context

> `readonly` **context**: `FetchContext`

Defined in: web-fetcher/dist/index.d.ts:1164

The execution context for this session, containing configurations, event bus, and shared state.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`context`](WebSearcher.md#context)

***

### id

> `readonly` **id**: `string`

Defined in: web-fetcher/dist/index.d.ts:1160

Unique identifier for the session.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`id`](WebSearcher.md#id)

***

### options

> `protected` **options**: [`FetcherOptions`](../interfaces/FetcherOptions.md)

Defined in: web-fetcher/dist/index.d.ts:1156

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`options`](WebSearcher.md#options)

***

### \_isFactory

> `static` **\_isFactory**: `boolean` = `false`

Defined in: [web-searcher/src/searcher.ts:34](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L34)

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`_isFactory`](WebSearcher.md#_isfactory)

***

### alias

> `static` **alias**: `string`[]

Defined in: [web-searcher/src/engines/google.ts:25](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L25)

Engine alias(es). Can be a single string or an array of strings.
Useful for registering shorthand names (e.g., 'g' for 'Google').

#### Overrides

[`WebSearcher`](WebSearcher.md).[`alias`](WebSearcher.md#alias)

***

### createObject()

> `static` **createObject**: (`name`, ...`args`) => [`WebSearcher`](WebSearcher.md)

Defined in: [web-searcher/src/searcher.ts:85](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L85)

Creates an instance of the registered search engine.

#### Parameters

##### name

`string`

The name of the engine.

##### args

...`any`[]

Arguments to pass to the constructor.

#### Returns

[`WebSearcher`](WebSearcher.md)

An instance of the search engine.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`createObject`](WebSearcher.md#createobject)

***

### currentInstanceIndex?

> `static` `optional` **currentInstanceIndex**: `number`

Defined in: [web-searcher/src/searcher.ts:52](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L52)

Globally shared index for tracking the currently active instance (node) across sessions.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`currentInstanceIndex`](WebSearcher.md#currentinstanceindex)

***

### defaultBaseUrls?

> `static` `optional` **defaultBaseUrls**: `string`[]

Defined in: [web-searcher/src/searcher.ts:49](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L49)

Default base URLs for engines that support multiple instances.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`defaultBaseUrls`](WebSearcher.md#defaultbaseurls)

***

### forEach()

> `static` **forEach**: (`cb`) => `void`

Defined in: [web-searcher/src/searcher.ts:92](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L92)

Iterates over all registered engines.

#### Parameters

##### cb

(`ctor`, `name`) => `void`

Callback function to invoke for each registered engine.

#### Returns

`void`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`forEach`](WebSearcher.md#foreach)

***

### get()

> `static` **get**: (`name`) => *typeof* [`WebSearcher`](WebSearcher.md)

Defined in: [web-searcher/src/searcher.ts:76](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L76)

Retrieves a registered search engine class by name.

#### Parameters

##### name

`string`

The name of the engine (e.g., 'Google').

#### Returns

*typeof* [`WebSearcher`](WebSearcher.md)

The search engine class constructor.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`get`](WebSearcher.md#get)

***

### name?

> `static` `optional` **name**: `string`

Defined in: [web-searcher/src/searcher.ts:41](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L41)

Custom engine name. If not provided, it is derived from the class name.
For example, `GoogleSearcher` becomes `Google`.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`name`](WebSearcher.md#name)

***

### register()

> `static` **register**: (`ctor`, `options?`) => `boolean`

Defined in: [web-searcher/src/searcher.ts:61](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L61)

Registers a search engine class.

#### Parameters

##### ctor

*typeof* [`WebSearcher`](WebSearcher.md)

The search engine class to register.

##### options?

Registration options. If a string is provided, it is used as the registered name.

`string` | `IBaseFactoryOptions`

#### Returns

`boolean`

`true` if registration was successful.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`register`](WebSearcher.md#register)

***

### setAliases()

> `static` **setAliases**: (`ctor`, ...`aliases`) => `void`

Defined in: [web-searcher/src/searcher.ts:100](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L100)

Sets aliases for a registered engine.

#### Parameters

##### ctor

*typeof* [`WebSearcher`](WebSearcher.md)

The search engine class.

##### aliases

...`string`[]

Aliases to add.

#### Returns

`void`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`setAliases`](WebSearcher.md#setaliases)

***

### unregister()

> `static` **unregister**: (`name?`) => `void`

Defined in: [web-searcher/src/searcher.ts:68](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L68)

Unregisters a search engine.

#### Parameters

##### name?

The name or class to unregister.

`string` | *typeof* [`WebSearcher`](WebSearcher.md)

#### Returns

`void`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`unregister`](WebSearcher.md#unregister)

## Accessors

### pagination

#### Get Signature

> **get** **pagination**(): [`PaginationConfig`](../interfaces/PaginationConfig.md)

Defined in: [web-searcher/src/engines/google.ts:61](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L61)

Configures pagination for Google Search results.
Uses the 'start' URL parameter, incrementing by 10 for each page.

##### Returns

[`PaginationConfig`](../interfaces/PaginationConfig.md)

#### Overrides

[`WebSearcher`](WebSearcher.md).[`pagination`](WebSearcher.md#pagination)

***

### template

#### Get Signature

> **get** **template**(): [`FetcherOptions`](../interfaces/FetcherOptions.md)

Defined in: [web-searcher/src/engines/google.ts:32](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L32)

Defines the fetch template for Google Search.

##### Returns

[`FetcherOptions`](../interfaces/FetcherOptions.md)

The fetcher configuration including the URL pattern and extraction rules.

#### Overrides

[`WebSearcher`](WebSearcher.md).[`template`](WebSearcher.md#template)

## Methods

### \_logDebug()

> `protected` **\_logDebug**(`category`, ...`args`): `void`

Defined in: web-fetcher/dist/index.d.ts:1172

#### Parameters

##### category

`string`

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`_logDebug`](WebSearcher.md#_logdebug)

***

### createContext()

> `protected` **createContext**(`options`): `FetchContext`

Defined in: [web-searcher/src/searcher.ts:216](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L216)

#### Parameters

##### options

[`FetcherOptions`](../interfaces/FetcherOptions.md) = `...`

#### Returns

`FetchContext`

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`createContext`](WebSearcher.md#createcontext)

***

### dispose()

> **dispose**(): `Promise`\<`void`\>

Defined in: web-fetcher/dist/index.d.ts:1231

Disposes of the session and its associated engine.

#### Returns

`Promise`\<`void`\>

#### Remarks

This method should be called when the session is no longer needed to free up resources
(e.g., closing browser instances, purging temporary storage).

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`dispose`](WebSearcher.md#dispose)

***

### execute()

> **execute**\<`R`\>(`actionOptions`, `context?`): `Promise`\<`FetchActionResult`\<`R`\>\>

Defined in: web-fetcher/dist/index.d.ts:1186

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

[`WebSearcher`](WebSearcher.md).[`execute`](WebSearcher.md#execute)

***

### executeAll()

> **executeAll**(`actions`, `options?`): `Promise`\<\{ `outputs`: `Record`\<`string`, `any`\>; `result`: `FetchResponse` \| `undefined`; \}\>

Defined in: web-fetcher/dist/index.d.ts:1203

Executes a sequence of actions.

#### Parameters

##### actions

`_RequireAtLeastOne`\<`FetchActionProperties`, `"name"` \| `"id"` \| `"action"`\>[]

An array of action options to be executed in order.

##### options?

`Partial`\<[`FetcherOptions`](../interfaces/FetcherOptions.md)\> & `object`

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

[`WebSearcher`](WebSearcher.md).[`executeAll`](WebSearcher.md#executeall)

***

### formatOptions()

> `protected` **formatOptions**(`options`): `Record`\<`string`, `any`\>

Defined in: [web-searcher/src/engines/google.ts:82](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L82)

Maps standard `SearchOptions` to Google's specific URL parameters.

- `timeRange` -> `tbs` (e.g., 'qdr:d' for day)
- `category` -> `tbm` (e.g., 'isch' for images)
- `region` -> `gl`
- `language` -> `hl`
- `safeSearch` -> `safe`

#### Parameters

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

The user-provided search options.

#### Returns

`Record`\<`string`, `any`\>

A map of variables to inject into the URL template.

#### Overrides

[`WebSearcher`](WebSearcher.md).[`formatOptions`](WebSearcher.md#formatoptions)

***

### getOutputs()

> **getOutputs**(): `Record`\<`string`, `any`\>

Defined in: web-fetcher/dist/index.d.ts:1214

Retrieves all outputs accumulated during the session.

#### Returns

`Record`\<`string`, `any`\>

A record of stored output data.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`getOutputs`](WebSearcher.md#getoutputs)

***

### getState()

> **getState**(): `Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

Defined in: web-fetcher/dist/index.d.ts:1220

Gets the current state of the session, including cookies and engine-specific state.

#### Returns

`Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

A promise resolving to the session state, or undefined if no engine is initialized.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`getState`](WebSearcher.md#getstate)

***

### getTemplate()

> `protected` **getTemplate**(`variables`, `options`): [`FetcherOptions`](../interfaces/FetcherOptions.md)

Defined in: [web-searcher/src/searcher.ts:212](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L212)

Dynamically retrieves the fetch template based on current variables and search options.

Subclasses can override this method to return different extraction rules (actions)
or URL patterns based on the search category, region, or other parameters.

#### Parameters

##### variables

`Record`\<`string`, `any`\>

The calculated variables (from formatOptions, pagination, etc.).

##### options

[`SearchOptions`](../interfaces/SearchOptions.md)

The original search options provided by the user.

#### Returns

[`FetcherOptions`](../interfaces/FetcherOptions.md)

The fetcher configuration to be used for the current request.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`getTemplate`](WebSearcher.md#gettemplate)

***

### search()

> **search**(`query`, `options`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:246](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L246)

Executes a search query.

This method handles the pagination loop, multi-instance failover, variable injection,
fetching, and result transformation.

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

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`search`](WebSearcher.md#search)

***

### transform()

> `protected` **transform**(`outputs`): `Promise`\<`any`[]\>

Defined in: [web-searcher/src/engines/google.ts:145](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/engines/google.ts#L145)

Cleans and normalizes the extracted results.
Specifically, it unwraps Google's redirect URLs (starting with `/url?q=`).

#### Parameters

##### outputs

`Record`\<`string`, `any`\>

The raw outputs from the fetcher.

#### Returns

`Promise`\<`any`[]\>

An array of cleaned search results.

#### Overrides

[`WebSearcher`](WebSearcher.md).[`transform`](WebSearcher.md#transform)

***

### validateFetchResult()

> `protected` **validateFetchResult**(`results`, `context`): `Promise`\<`boolean`\>

Defined in: [web-searcher/src/searcher.ts:421](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L421)

Hook for subclasses to validate fetched results before they are accepted.
If this returns false, the instance manager will consider the fetch a failure
and automatically switch to the next available baseUrl (if any).

#### Parameters

##### results

[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]

The extracted results.

##### context

[`SearchContext`](../interfaces/SearchContext.md)

Context including the current baseUrl and page.

#### Returns

`Promise`\<`boolean`\>

A promise resolving to true if valid, false otherwise.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`validateFetchResult`](WebSearcher.md#validatefetchresult)

***

### search()

> `static` **search**(`engineNames`, `query`, `options`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:113](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L113)

Static helper to execute a one-off search or a fallback chain.

It creates an instance of the specified engine(s), executes the search, and automatically
falls back to the next engine in the list if the current one fails or is exhausted.

#### Parameters

##### engineNames

The name(s) of the engine(s) to use (e.g., 'Google' or ['SearXNG', 'Google']).

`string` | `string`[]

##### query

`string`

The search query string.

##### options

[`SearchOptions`](../interfaces/SearchOptions.md) & [`FetcherOptions`](../interfaces/FetcherOptions.md) = `{}`

Combined search options and fetcher options.

#### Returns

`Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

A promise resolving to an array of standardized search results.

#### Inherited from

[`WebSearcher`](WebSearcher.md).[`search`](WebSearcher.md#search-2)
