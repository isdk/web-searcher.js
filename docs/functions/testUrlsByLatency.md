[**@isdk/web-searcher**](../README.md)

***

[@isdk/web-searcher](../globals.md) / testUrlsByLatency

# Function: testUrlsByLatency()

> **testUrlsByLatency**(`urls`, `options`): `Promise`\<[`VerifiedUrl`](../interfaces/VerifiedUrl.md)[]\>

Defined in: [web-searcher/src/utils/latency.ts:12](https://github.com/isdk/web-searcher.js/blob/955bc509edda39926bd12c6c2b8c28da7eb13ff5/src/utils/latency.ts#L12)

A general utility to test a list of URLs for availability and latency.
Returns a list of verified URLs sorted by response time.

## Parameters

### urls

`string`[]

### options

#### limit?

`number`

#### testPath?

`string`

#### timeout?

`number`

## Returns

`Promise`\<[`VerifiedUrl`](../interfaces/VerifiedUrl.md)[]\>
