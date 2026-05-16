[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / FetcherOptions

# Interface: FetcherOptions

Defined in: web-fetcher/dist/index.d.ts:1108

## Extends

- `BaseFetcherProperties`

## Properties

### actions?

> `optional` **actions**: `_RequireAtLeastOne`\<`FetchActionProperties`, `"name"` \| `"id"` \| `"action"`\>[]

Defined in: web-fetcher/dist/index.d.ts:1109

***

### antibot?

> `optional` **antibot**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1048

#### Inherited from

`BaseFetcherProperties.antibot`

***

### blockResources?

> `optional` **blockResources**: `string`[]

Defined in: web-fetcher/dist/index.d.ts:1061

#### Inherited from

`BaseFetcherProperties.blockResources`

***

### browser?

> `optional` **browser**: `object`

Defined in: web-fetcher/dist/index.d.ts:1071

#### engine?

> `optional` **engine**: `BrowserEngine`

浏览器引擎，默认为 playwright

- `playwright`: 使用 Playwright 引擎
- `puppeteer`: 使用 Puppeteer 引擎

#### headless?

> `optional` **headless**: `boolean`

#### launchOptions?

> `optional` **launchOptions**: `Record`\<`string`, `any`\>

#### waitUntil?

> `optional` **waitUntil**: `"load"` \| `"domcontentloaded"` \| `"networkidle"` \| `"commit"`

#### Inherited from

`BaseFetcherProperties.browser`

***

### cache?

> `optional` **cache**: `FetchCacheOptions`

Defined in: web-fetcher/dist/index.d.ts:1069

Cache configuration for persistent HTTP caching.

#### Inherited from

`BaseFetcherProperties.cache`

***

### cookies?

> `optional` **cookies**: `Cookie`[]

Defined in: web-fetcher/dist/index.d.ts:1051

#### Inherited from

`BaseFetcherProperties.cookies`

***

### debug?

> `optional` **debug**: `string` \| `boolean` \| `string`[]

Defined in: web-fetcher/dist/index.d.ts:1049

#### Inherited from

`BaseFetcherProperties.debug`

***

### delayBetweenRequestsMs?

> `optional` **delayBetweenRequestsMs**: `number`

Defined in: web-fetcher/dist/index.d.ts:1091

#### Inherited from

`BaseFetcherProperties.delayBetweenRequestsMs`

***

### enableSmart?

> `optional` **enableSmart**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1044

#### Inherited from

`BaseFetcherProperties.enableSmart`

***

### engine?

> `optional` **engine**: `string`

Defined in: web-fetcher/dist/index.d.ts:1043

抓取模式

- `http`: 使用 HTTP 进行抓取
- `browser`: 使用浏览器进行抓取
- `auto`: auto 会走“智能探测”选择 http 或 browser, 但是如果没有启用 smart，并且在站点注册表中没有，那么则等价为 http.

#### Inherited from

`BaseFetcherProperties.engine`

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: web-fetcher/dist/index.d.ts:1050

#### Inherited from

`BaseFetcherProperties.headers`

***

### http?

> `optional` **http**: `object`

Defined in: web-fetcher/dist/index.d.ts:1083

#### body?

> `optional` **body**: `any`

#### method?

> `optional` **method**: `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"`

#### Inherited from

`BaseFetcherProperties.http`

***

### ignoreSslErrors?

> `optional` **ignoreSslErrors**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1070

#### Inherited from

`BaseFetcherProperties.ignoreSslErrors`

***

### maxConcurrency?

> `optional` **maxConcurrency**: `number`

Defined in: web-fetcher/dist/index.d.ts:1089

#### Inherited from

`BaseFetcherProperties.maxConcurrency`

***

### maxRequestsPerMinute?

> `optional` **maxRequestsPerMinute**: `number`

Defined in: web-fetcher/dist/index.d.ts:1090

#### Inherited from

`BaseFetcherProperties.maxRequestsPerMinute`

***

### onPause?

> `optional` **onPause**: `OnFetchPauseCallback`

Defined in: web-fetcher/dist/index.d.ts:1110

***

### output?

> `optional` **output**: `object`

Defined in: web-fetcher/dist/index.d.ts:1056

#### cookies?

> `optional` **cookies**: `boolean`

#### sessionState?

> `optional` **sessionState**: `boolean`

#### Inherited from

`BaseFetcherProperties.output`

***

### overrideSessionState?

> `optional` **overrideSessionState**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1054

#### Inherited from

`BaseFetcherProperties.overrideSessionState`

***

### proxy?

> `optional` **proxy**: `string` \| `string`[]

Defined in: web-fetcher/dist/index.d.ts:1060

#### Inherited from

`BaseFetcherProperties.proxy`

***

### requestHandlerTimeoutSecs?

> `optional` **requestHandlerTimeoutSecs**: `number`

Defined in: web-fetcher/dist/index.d.ts:1088

#### Inherited from

`BaseFetcherProperties.requestHandlerTimeoutSecs`

***

### retries?

> `optional` **retries**: `number`

Defined in: web-fetcher/dist/index.d.ts:1092

#### Inherited from

`BaseFetcherProperties.retries`

***

### sessionPoolOptions?

> `optional` **sessionPoolOptions**: `SessionPoolOptions`

Defined in: web-fetcher/dist/index.d.ts:1053

#### Inherited from

`BaseFetcherProperties.sessionPoolOptions`

***

### sessionState?

> `optional` **sessionState**: `any`

Defined in: web-fetcher/dist/index.d.ts:1052

#### Inherited from

`BaseFetcherProperties.sessionState`

***

### sites?

> `optional` **sites**: `FetchSite`[]

Defined in: web-fetcher/dist/index.d.ts:1093

#### Inherited from

`BaseFetcherProperties.sites`

***

### storage?

> `optional` **storage**: `StorageOptions`

Defined in: web-fetcher/dist/index.d.ts:1065

Storage configuration for session isolation and persistence.

#### Inherited from

`BaseFetcherProperties.storage`

***

### syncStateOnUpgrade?

> `optional` **syncStateOnUpgrade**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1045

#### Inherited from

`BaseFetcherProperties.syncStateOnUpgrade`

***

### throwHttpErrors?

> `optional` **throwHttpErrors**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1055

#### Inherited from

`BaseFetcherProperties.throwHttpErrors`

***

### timeoutMs?

> `optional` **timeoutMs**: `number`

Defined in: web-fetcher/dist/index.d.ts:1087

#### Inherited from

`BaseFetcherProperties.timeoutMs`

***

### upgradeThresholdMs?

> `optional` **upgradeThresholdMs**: `number`

Defined in: web-fetcher/dist/index.d.ts:1046

#### Inherited from

`BaseFetcherProperties.upgradeThresholdMs`

***

### url?

> `optional` **url**: `string`

Defined in: web-fetcher/dist/index.d.ts:1094

#### Inherited from

`BaseFetcherProperties.url`

***

### useSiteRegistry?

> `optional` **useSiteRegistry**: `boolean`

Defined in: web-fetcher/dist/index.d.ts:1047

#### Inherited from

`BaseFetcherProperties.useSiteRegistry`
