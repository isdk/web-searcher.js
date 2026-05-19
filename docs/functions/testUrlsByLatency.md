[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / testUrlsByLatency

# Function: testUrlsByLatency()

> **testUrlsByLatency**(`urls`, `options`): `Promise`\<[`VerifiedUrl`](../interfaces/VerifiedUrl.md)[]\>

Defined in: [web-searcher/src/utils/latency.ts:12](https://github.com/isdk/web-searcher.js/blob/0c4757eb75b3b7c5af0231806f11e7b3c3166736/src/utils/latency.ts#L12)

A general utility to test a list of URLs for availability and latency.
Returns a list of verified URLs sorted by response time.

## Parameters

### urls

`string`[]

### options

#### limit?

`number`

#### proxy?

`string`

#### testPath?

`string`

#### timeout?

`number`

## Returns

`Promise`\<[`VerifiedUrl`](../interfaces/VerifiedUrl.md)[]\>
