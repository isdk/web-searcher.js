# 搜索模块 (Search Module)

Search 模块提供了一个基于类的高级框架，用于构建搜索引擎抓取工具。它构建在 `@isdk/web-fetcher` 之上，扩展了**多页导航**、**会话持久化**和**结果标准化**的能力。

## 🌟 为什么要使用搜索模块？

构建一个健壮的搜索抓取工具不仅仅是请求一个 URL。通常你需要：

- **分页**: 自动点击“下一页”或修改 URL 参数，直到获取足够的结果。
- **会话管理**: 在多个搜索查询之间维护 Cookie 和 Header。
- **数据清洗**: 解析原始 HTML 并处理重定向链接。
- **灵活性**: 轻松切换 HTTP（快速）和 Browser（抗反爬）模式。

本模块将这些通用模式封装在一个可复用的 `Searcher` 类中。

## 🚀 快速开始

### 1. 一次性搜索 (One-off Search)

使用静态方法 `Searcher.search` 处理快速、用完即弃的任务。它会自动创建会话、抓取结果并进行清理。

```typescript
import { Searcher } from '@isdk/web-fetcher/search';
import { GoogleSearcher } from '@isdk/web-fetcher/search/engines/google';

// 注册引擎 (只需执行一次)
Searcher.register(GoogleSearcher);

// 搜索！
// 'limit' 参数确保我们会自动翻页直到获取 20 条结果。
const results = await Searcher.search('google', 'open source', { limit: 20 });

console.log(results);
```

### 2. 有状态会话 (Stateful Session)

由于 `Searcher` 继承自 `FetchSession`，您可以实例化它以在多个请求之间保持 Cookie 和存储。这对于需要登录的搜索或通过模拟人类行为来避免反爬虫非常有用。

```typescript
// 创建一个持久化会话
const google = new GoogleSearcher({
  headless: false, // 覆盖默认选项 (例如显示浏览器)
  proxy: 'http://my-proxy:8080'
});

try {
  // 第一次查询
  const results1 = await google.search('term A');

  // 第二次查询 (复用同一个浏览器窗口/Cookies)
  const results2 = await google.search('term B');
} finally {
  // 务必销毁以关闭浏览器/释放资源
  await google.dispose();
}
```

## 🛠️ 实现一个新的搜索引擎

要支持一个新的网站，请创建一个继承自 `Searcher` 的类。

### 步骤 1: 定义模板 (Template)

`template` 属性定义了搜索的“蓝图”。它是一个标准的 `FetcherOptions` 对象，但支持**变量注入**。

支持的变量:

- `${query}`: 搜索关键词。
- `${page}`: 当前页码 (根据配置从 0 或 1 开始)。
- `${offset}`: 当前条目偏移量 (例如 0, 10, 20)。
- `${limit}`: 请求的限制数量。

```typescript
import { Searcher } from '@isdk/web-fetcher/search';
import { FetcherOptions } from '@isdk/web-fetcher/types';

export class MyBlogSearcher extends Searcher {
  static readonly engineName = 'my-blog';

  protected get template(): FetcherOptions {
    return {
      engine: 'http', // 如果网站有反爬虫，请使用 'browser'
      // 带有变量的动态 URL
      url: 'https://blog.example.com/search?q=${query}&page=${page}',
      actions: [
        {
          id: 'extract',
          storeAs: 'results', // 必须将结果存储在这里
          params: {
            type: 'array',
            selector: 'article.post',
            items: {
              title: { selector: 'h2' },
              url: { selector: 'a', attribute: 'href' }
            }
          }
        }
      ]
    };
  }
}
```

### 步骤 2: 配置分页 (Pagination)

告诉 `Searcher` 如何导航到下一页。实现 `pagination` 获取器。

#### 方案 A: URL 参数 (Offset/Page)

最适合无状态的 HTTP 抓取。

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'page',
    startValue: 1, // 第一页是 1
    increment: 1   // 下一页加 1
  };
}
```

#### 方案 B: 点击“下一页”按钮

最适合 SPA 或复杂的基于会话的网站。需要 `engine: 'browser'`。

```typescript
protected override get pagination() {
  return {
    type: 'click-next',
    nextButtonSelector: 'a.next-page-btn'
  };
}
```

### 步骤 3: 转换与清洗数据 (Transform)

重写 `transform` 以清洗数据。由于 `Searcher` 本身就是一个 `FetchSession`，您还可以使用 `this` 发起额外的请求（如解析重定向）。

```typescript
protected override async transform(outputs: Record<string, any>) {
  const results = outputs['results'] || [];

  // 清洗数据或过滤
  return results.map(item => ({
    ...item,
    title: item.title.trim(),
    url: new URL(item.url, 'https://blog.example.com').href
  }));
}
```

## 🧠 高级概念

### 自动分页与过滤

`Searcher` 是智能的。如果您请求 `limit: 10`，但第一页只返回了 5 条结果（或者如果您的 `transform` 过滤掉了一些结果），它会自动抓取下一页，直到满足限制。

### 用户自定义转换 (User-defined Transforms)

用户可以在调用 `search` 时提供自己的 `transform`。它会在引擎内置的转换**之后**运行。

```typescript
await google.search('test', {
  transform: (results) => results.filter(r => r.url.endsWith('.pdf'))
});
```

如果用户过滤掉了结果，自动分页逻辑会启动以抓取更多页面来满足请求的 limit。

### 标准化搜索选项

在调用 `search()` 时，您可以提供标准化的选项，搜索引擎会将其映射到特定的参数：

```typescript
const results = await google.search('open source', {
  limit: 20,
  timeRange: 'month',       // 'day', 'week', 'month', 'year'
  // 或自定义范围:
  // timeRange: { from: '2023-01-01', to: '2023-12-31' },
  category: 'news',         // 'all', 'images', 'videos', 'news'
  region: 'US',             // ISO 3166-1 alpha-2
  language: 'en',           // ISO 639-1
  safeSearch: 'strict',     // 'off', 'moderate', 'strict'
});
```

要在您自己的引擎中支持这些选项，请重写 `formatOptions` 方法：

```typescript
protected override formatOptions(options: SearchOptions): Record<string, any> {
  const vars: Record<string, any> = {};
  if (options.timeRange === 'day') vars.tbs = 'qdr:d';
  // ... 将其他选项映射到模板变量
  return vars;
}
```

然后在您的 `template.url` 中使用这些变量：
`url: 'https://www.google.com/search?q=${query}&tbs=${tbs}'`

### 自定义变量

您可以向 `search()` 传递自定义变量并在模板中使用它们。

```typescript
// 调用
await google.search('test', { category: 'news' });

// 模板
url: 'https://site.com?q=${query}&cat=${category}'
```

## 分页指南

### 1. 基于偏移量 (Offset-based) - 如 Google

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'start',
    startValue: 0,
    increment: 10 // 每页跳过 10 条
  };
}
```

URL: `search?q=...&start=${offset}`

### 2. 基于页码 (Page-based) - 如 Bing

```typescript
protected override get pagination() {
  return {
    type: 'url-param',
    paramName: 'page',
    startValue: 1,
    increment: 1
  };
}
```

URL: `search?q=...&page=${page}`

### 3. 基于点击 (Click-based) - SPA

```typescript
protected override get pagination() {
  return {
    type: 'click-next',
    nextButtonSelector: '.pagination .next'
  };
}
```

引擎将点击此选择器并等待网络空闲，然后抓取下一批数据。
