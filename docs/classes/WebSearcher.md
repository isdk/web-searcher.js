[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / WebSearcher

# Abstract Class: WebSearcher

Defined in: [web-searcher/src/searcher.ts:32](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L32)

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

Defined in: web-fetcher/dist/index.d.ts:1171

Creates a new FetchSession.

#### Parameters

##### options?

[`FetcherOptions`](../interfaces/FetcherOptions.md)

Configuration options for the fetcher.

#### Returns

`WebSearcher`

#### Inherited from

`FetchSession.constructor`

## Properties

### closed

> `protected` **closed**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1165

#### Inherited from

`FetchSession.closed`

***

### context

> `readonly` **context**: `FetchContext`

Defined in: web-fetcher/dist/index.d.ts:1164

The execution context for this session, containing configurations, event bus, and shared state.

#### Inherited from

`FetchSession.context`

***

### id

> `readonly` **id**: `string`

Defined in: web-fetcher/dist/index.d.ts:1160

Unique identifier for the session.

#### Inherited from

`FetchSession.id`

***

### options

> `protected` **options**: [`FetcherOptions`](../interfaces/FetcherOptions.md)

Defined in: web-fetcher/dist/index.d.ts:1156

#### Inherited from

`FetchSession.options`

***

### \_isFactory

> `static` **\_isFactory**: `boolean` = `false`

Defined in: [web-searcher/src/searcher.ts:34](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L34)

***

### alias?

> `static` `optional` **alias**: `string` \| `string`[]

Defined in: [web-searcher/src/searcher.ts:46](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L46)

Engine alias(es). Can be a single string or an array of strings.
Useful for registering shorthand names (e.g., 'g' for 'Google').

***

### createObject()

> `static` **createObject**: (`name`, ...`args`) => `WebSearcher`

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

`WebSearcher`

An instance of the search engine.

***

### currentInstanceIndex?

> `static` `optional` **currentInstanceIndex**: `number`

Defined in: [web-searcher/src/searcher.ts:52](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L52)

Globally shared index for tracking the currently active instance (node) across sessions.

***

### defaultBaseUrls?

> `static` `optional` **defaultBaseUrls**: `string`[]

Defined in: [web-searcher/src/searcher.ts:49](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L49)

Default base URLs for engines that support multiple instances.

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

***

### get()

> `static` **get**: (`name`) => *typeof* `WebSearcher`

Defined in: [web-searcher/src/searcher.ts:76](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L76)

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

Defined in: [web-searcher/src/searcher.ts:41](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L41)

Custom engine name. If not provided, it is derived from the class name.
For example, `GoogleSearcher` becomes `Google`.

***

### register()

> `static` **register**: (`ctor`, `options?`) => `boolean`

Defined in: [web-searcher/src/searcher.ts:61](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L61)

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

Defined in: [web-searcher/src/searcher.ts:100](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L100)

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

Defined in: [web-searcher/src/searcher.ts:68](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L68)

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

Defined in: [web-searcher/src/searcher.ts:198](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L198)

Optional pagination configuration.
Defines how the searcher navigates to subsequent pages.

If undefined, the searcher will only fetch the first page.

##### Returns

[`PaginationConfig`](../interfaces/PaginationConfig.md) \| `undefined`

***

### template

#### Get Signature

> **get** **template**(): [`FetcherOptions`](../interfaces/FetcherOptions.md)

Defined in: [web-searcher/src/searcher.ts:188](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L188)

The declarative template for the fetch options.

Subclasses can implement this getter to provide the engine configuration,
including the base URL, search parameters pattern, and extraction rules.

This getter is **optional** if you override [getTemplate](#gettemplate).

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

[`FetcherOptions`](../interfaces/FetcherOptions.md)

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

`FetchSession._logDebug`

***

### createContext()

> `protected` **createContext**(`options`): `FetchContext`

Defined in: [web-searcher/src/searcher.ts:216](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L216)

#### Parameters

##### options

[`FetcherOptions`](../interfaces/FetcherOptions.md) = `...`

#### Returns

`FetchContext`

#### Overrides

`FetchSession.createContext`

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

`FetchSession.dispose`

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

`FetchSession.execute`

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

`FetchSession.executeAll`

***

### formatOptions()

> `protected` **formatOptions**(`options`): `Record`\<`string`, `any`\>

Defined in: [web-searcher/src/searcher.ts:457](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L457)

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

Defined in: web-fetcher/dist/index.d.ts:1214

Retrieves all outputs accumulated during the session.

#### Returns

`Record`\<`string`, `any`\>

A record of stored output data.

#### Inherited from

`FetchSession.getOutputs`

***

### getState()

> **getState**(): `Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

Defined in: web-fetcher/dist/index.d.ts:1220

Gets the current state of the session, including cookies and engine-specific state.

#### Returns

`Promise`\<\{ `cookies`: `Cookie`[]; `sessionState?`: `any`; \} \| `undefined`\>

A promise resolving to the session state, or undefined if no engine is initialized.

#### Inherited from

`FetchSession.getState`

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

***

### transform()

> `protected` **transform**(`outputs`, `context`): `Promise`\<[`StandardSearchResult`](../interfaces/StandardSearchResult.md)[]\>

Defined in: [web-searcher/src/searcher.ts:439](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/searcher.ts#L439)

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
