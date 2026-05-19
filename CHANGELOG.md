# Changelog

All notable changes to this project will be documented in this file. See [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) for commit guidelines.

## [0.1.6](https://github.com/isdk/web-searcher.js/compare/v0.1.5...v0.1.6) (2026-05-19)


### Features

* support default search parameters via static and instance options ([e0df186](https://github.com/isdk/web-searcher.js/commit/e0df186729f6f20b71c74d9e1056fd0bf6f83c9d))
* **testUrlsByLatency:** add proxy option and change to no limit by default ([21cfe81](https://github.com/isdk/web-searcher.js/commit/21cfe81f7fd0ebbd5f72394f4e941c47c4781778))


### Bug Fixes

* **latency:** fetchWeb should simple effective ([e91baed](https://github.com/isdk/web-searcher.js/commit/e91baedc6d820df60dd1a4468d8fdef02c829842))

## [0.1.5](https://github.com/isdk/web-searcher.js/compare/v0.1.4...v0.1.5) (2026-05-16)


### Features

* 新增多引擎瀑布流搜索与多实例故障转移支持 ([955bc50](https://github.com/isdk/web-searcher.js/commit/955bc509edda39926bd12c6c2b8c28da7eb13ff5))
* add a simple metadata extractor util ([edda510](https://github.com/isdk/web-searcher.js/commit/edda5109b84d896b20f269be9e52e2879917e7f5))
* include user options in transform context and update documentation ([59f3b08](https://github.com/isdk/web-searcher.js/commit/59f3b08bdfbfc0b6c3b000d1d4c3293e76eb9a26))
* support dynamic template selection and variable injection ([cfab88d](https://github.com/isdk/web-searcher.js/commit/cfab88d9e587b56c8a65a9dfd58fb1aa24f90a52))
* **utils:** testUrlsByLatency a general utility to test a list of URLs for availability and latency. ([287c1ee](https://github.com/isdk/web-searcher.js/commit/287c1eef81de2e2056f42e51cbc06763611f989d))


### Refactor

* make 'template' optional in WebSearcher subclasses ([0e55546](https://github.com/isdk/web-searcher.js/commit/0e55546dcd7dcd9f7727a6d7c61f95f56c232abc))
* rename FetchOptions to FetchExtractorOptions ([cd3b820](https://github.com/isdk/web-searcher.js/commit/cd3b820838a4ffa952c83a8763804dd12a2c5990))

## [0.1.4](https://github.com/isdk/web-searcher.js/compare/v0.1.3...v0.1.4) (2026-01-20)


### Refactor

* enhance search action merging and intelligent navigation ([7bcd8cc](https://github.com/isdk/web-searcher.js/commit/7bcd8cca4a3a7fc201a5cf3e3b4283f267eadcea))

## [0.1.3](https://github.com/isdk/web-searcher.js/compare/v0.1.2...v0.1.3) (2026-01-19)


### Features

* enhance StandardSearchResult and add maxPages safety threshold for search ([e17f1bc](https://github.com/isdk/web-searcher.js/commit/e17f1bcb40984e389c2901da9e3b4886a969899a))


### Bug Fixes

* **build:** only use current tsconfig.spec.json to test ([ef4bedf](https://github.com/isdk/web-searcher.js/commit/ef4bedfe25f2359a56f93bb74802b3ad4bfd3986))

## [0.1.2](https://github.com/isdk/web-searcher.js/compare/v0.1.1...v0.1.2) (2026-01-18)

## 0.1.1 (2026-01-18)


### Features

* add standardized search options ([c0482b0](https://github.com/isdk/web-searcher.js/commit/c0482b0ccf724743225802742b1c60fb8156f133))
* **search:** refine configuration precedence and runtime options merge ([90e0ccd](https://github.com/isdk/web-searcher.js/commit/90e0ccd323324d3bfb746ecc75e7b9ceb5883ffd))


### Refactor

* **search:** switch to 'static alias' to avoid naming conflicts ([ff78473](https://github.com/isdk/web-searcher.js/commit/ff784738bcb38e658df80feeab2a441ded9bf868))
* **search:** use custom-factory for engine registration ([8bee375](https://github.com/isdk/web-searcher.js/commit/8bee375c5bb599b618821a4e5b476f733cc68b40))
