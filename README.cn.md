# 搜索模块 (Search Module)

Search 模块提供了一个基于类的高级框架，用于构建搜索引擎抓取工具。它构建在 `@isdk/web-fetcher` 之上，扩展了**多页导航**、**会话持久化**和**结果标准化**的能力。

## 🌟 为什么要使用搜索模块？

构建一个健壮的搜索抓取工具不仅仅是请求一个 URL。通常你需要：

- **分页**: 自动点击“下一页”或修改 URL 参数，直到获取足够的结果。
- **会话管理**: 在多个搜索查询之间维护 Cookie 和 Header。
- **数据清洗**: 解析原始 HTML 并处理重定向链接。
- **灵活性**: 轻松切换 HTTP（快速）和 Browser（抗反爬）模式。

本模块将这些通用模式封装在一个可复用的 `WebSearcher` 类中。

## 🚀 快速开始

### 1. 一次性搜索 (One-off Search)

> **⚠️ 关于 `GoogleSearcher` 的说明**：这些示例中使用的 `GoogleSearcher` 类仅作为**演示实现**用于教学目的。它不适用于生产环境。
>
> * **严格的反爬虫检测**：目前发现，即使在 `browser` 模式下尝试模拟简单的“人类行为”（如等待几秒后自动填充搜索框并提交），仍然会被 Google 识别为自动化程序。这表明简单的操作模拟不足以通过检测。
> * **扩展性限制**：它缺乏大规模可靠抓取 Google 所需的高级反爬虫处理（如验证码破解、代理轮换）。
> * **脆弱性**：由于 Google 频繁的 DOM 变更和 A/B 测试，提取的数据可能会出现**不准确或信息错位**的情况。

使用静态方法 `WebSearcher.search` 处理快速、用完即弃的任务。它会自动创建会话、抓取结果并进行清理。

```typescript
import { GoogleSearcher, WebSearcher } from '@isdk/web-fetcher';

// 注册引擎 (只需执行一次)
WebSearcher.register(GoogleSearcher);

// 搜索！
// 'limit' 参数确保我们会自动翻页直到获取 20 条结果。
// 注意：引擎名称区分大小写，且由类名自动提取（例如：'GoogleSearcher' -> 'Google'）
const results = await WebSearcher.search('Google', 'open source', { limit: 20 });

console.log(results);
```

### 2. 有状态会话 (Stateful Session)

由于 `WebSearcher` 继承自 `FetchSession`，您可以实例化它以在多个请求之间保持 Cookie 和存储。这对于需要登录的搜索或通过模拟人类行为来避免反爬虫非常有用。

### 🧬 动态模板 (Dynamic Templates)

虽然静态 `template` 适用于简单的搜索引擎，但许多网站（如 Google）会根据搜索类别（如“网页” vs “图片” vs “新闻”）彻底改变其 HTML 结构。

为了处理这种情况，您可以重写 `getTemplate(variables, options)` 方法。

- **`variables`**: 计算后的变量（来自 `formatOptions`、分页等）。
- **`options`**: 用户提供的原始 `SearchOptions`。

```typescript
export class MyAdvancedSearcher extends WebSearcher {
  get template(): FetcherOptions {
    // 默认模板（通常用于网页搜索）
    return {
      url: '...',
      actions: [ { id: 'extract', params: { selector: '.web-result' } } ]
    };
  }

  protected override getTemplate(variables: Record<string, any>, options: SearchOptions): FetcherOptions {
    if (options.category === 'images') {
      return {
        url: 'https://site.com/images?q=${query}',
        actions: [ { id: 'extract', params: { selector: '.img-item' } } ]
      };
    }
    // 回退到默认的 template 获取器
    return super.getTemplate(variables, options);
  }
}
```

### 🛡️ 核心准则：模板即法律 (Template is Law)

`template`（或由 `getTemplate` 返回的动态模板）是权威的“蓝图”。

- **模板优先级**：如果模板定义了某个属性（如 `engine: 'browser'`、特定的 `headers` 等），该值将被**锁定**，用户选项无法覆盖。这确保了抓取逻辑的稳定性。
- **Actions 不可变性**：模板中的 `actions` 数组受到严格保护。用户无法通过 `options` 追加、替换或修改执行步骤。这防止了外部逻辑破坏爬虫的执行流程。
- **会话上下文 (Session Context)**：为了保持干净的会话，**actions 会从会话的持久化上下文中过滤掉**。它们仅在 `search()` 调用执行期间使用。这确保了会话级设置（如 Cookie 或引擎类型）得以保留，而不会被特定于搜索的提取规则所污染。
- **用户灵活性**：对于模板中**未**显式锁定的属性（如 `proxy`、`timeoutMs` 或自定义变量），用户可以在构造函数或 `search()` 方法中自由设置。

```typescript
// 创建一个持久化会话
const google = new GoogleSearcher({
  headless: false, // 如果模板中未锁定，则可以覆盖
  proxy: 'http://my-proxy:8080',
  timeoutMs: 30000 // 有效（假设 GoogleSearcher 模板未显式设置 timeoutMs）
});
```

### 🧠 智能导航 (Goto)

`WebSearcher` 会自动管理前往搜索 URL 的导航。

1. **自动注入**：如果你的模板**不**包含 `goto` 动作，搜索器会自动在动作列表开头插入一个指向解析后的 `url`（已注入查询变量）的 `goto` 动作。
2. **手动控制**：如果你在模板中显式添加了一个匹配解析后 URL 的 `goto` 动作，搜索器会检测到重复并**跳过**自动注入。这让你能完全控制导航步骤（例如添加 headers、referrer 或其他特定参数）。
3. **多步流程**：你可以在模板中定义多个 `goto` 动作（例如先访问登录页）。搜索器仍然会预置主搜索 URL 的导航，除非你的 `goto` 动作之一与之精确匹配。

```typescript
try {
  // 第一次查询
  // 您还可以传递运行时选项来覆盖会话默认值或注入变量
  const results1 = await google.search('term A', {
    timeoutMs: 60000, // 针对此次搜索覆盖超时时间
    extraParam: 'value' // 可以在模板中通过 ${extraParam} 使用
  });

  // 第二次查询 (复用同一个浏览器窗口/Cookies)
  const results2 = await google.search('term B');
} finally {
  // 务必销毁以关闭浏览器/释放资源
  await google.dispose();
}
```

## 🛠️ 实现一个新的搜索引擎

要支持一个新的网站，请创建一个继承自 `WebSearcher` 的类。

### 步骤 1: 定义模板 (Template)

要支持一个新的网站，请创建一个继承自 `WebSearcher` 的类。引擎名称默认由类名自动提取（例如：`MyBlogSearcher` -> `MyBlog`），但您可以通过静态属性自定义名称和别名。

`template` 属性定义了搜索的“蓝图”。它是一个标准的 `FetcherOptions` 对象，但支持**变量注入**。

支持的变量:

- `${query}`: 搜索关键词。
- `${page}`: 当前页码 (根据配置从 0 或 1 开始)。
- `${offset}`: 当前条目偏移量 (例如 0, 10, 20)。
- `${limit}`: 请求的限制数量。

```typescript
import { WebSearcher } from '@isdk/web-fetcher/search';
import { FetcherOptions } from '@isdk/web-fetcher/types';

export class MyBlogSearcher extends WebSearcher {
  static name = 'blog'; // 自定义名称 (区分大小写)
  static alias = ['myblog', 'news'];

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

告诉 `WebSearcher` 如何导航到下一页。实现 `pagination` 获取器。

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

重写 `transform` 以清洗数据。`context` 参数包含了当前的搜索状态以及您传递给 `search()` 的任何自定义参数。由于 `WebSearcher` 本身就是一个 `FetchSession`，您还可以使用 `this` 发起额外的请求（如解析重定向）。

```typescript
protected override async transform(outputs: Record<string, any>, context: SearchContext) {
  const results = outputs['results'] || [];

  // 您可以从 context 中访问自定义参数
  if (context.myCustomFlag) {
    // ... 逻辑
  }

  // 清洗数据或过滤
  return results.map(item => ({
    ...item,
    title: item.title.trim(),
    url: new URL(item.url, 'https://blog.example.com').href
  }));
}
```

## 🧠 高级概念

### 自动分页：`limit` 与 `maxPages` 的关系

`WebSearcher` 的设计是以结果为导向的。当您调用 `search()` 时，您只需要指定想要多少条结果，搜索器会自动处理翻页逻辑。

- **`limit`**: 您期望获取的结果总数。
- **`maxPages`**: 安全阈值。它限制了搜索器为了满足 `limit` 而允许抓取的最大页数（翻页循环次数）。

**协作逻辑示例：**
如果您请求 `{ limit: 50 }`，但每页只有 5 条结果：

1. 搜索器抓取第 1 页（得到 5 条）。
2. 发现 `5 < 50`，于是自动抓取第 2 页。
3. 循环持续，直到获取 50 条结果 **或者** 达到了 `maxPages` 的限制（默认为 10 页）。

这种机制可以防止因“下一页”选择器失效或引擎陷入死循环而导致的无限抓取，保护您的系统资源。

### 用户自定义转换 (User-defined Transforms)

用户可以在调用 `search` 时提供自己的 `transform`。它会在引擎内置的转换**之后**运行。

这在**过滤广告**或无关内容时非常强大。如果用户过滤掉了某些结果，自动分页逻辑会**自动启动**以抓取更多页面，确保最终返回给您的结果列表既满足 `limit` 数量要求，又只包含有效的条目。

```typescript
await google.search('test', {
  limit: 20,
  myCustomFlag: true,
  // 示例：过滤掉赞助商结果（广告）并只保留 PDF
  transform: (results, context) => {
    console.log('正在搜索:', context.query);
    return results.filter(r => {
      const isAd = r.isSponsored || r.url.includes('googleadservices.com');
      return !isAd && r.url.endsWith('.pdf');
    });
  }
});
```

### 标准化搜索选项

在调用 `search()` 时，您可以提供标准化的选项，搜索引擎会将其映射到特定的参数：

```typescript
const results = await google.search('open source', {
  limit: 20,
  timeRange: 'month',       // 'hour', 'day', 'week', 'month', 'year'
  // 或自定义范围:
  // timeRange: { from: '2023-01-01', to: '2023-12-31' },
  category: 'news',         // 'all', 'images', 'videos', 'news'
  region: 'US',             // ISO 3166-1 alpha-2
  language: 'en',           // ISO 639-1
  safeSearch: 'strict',     // 'off', 'moderate', 'strict'
});
```

#### 搜索选项参考

| 选项 | 类型 | 说明 |
| :--- | :--- | :--- |
| `limit` | `number` | 期望获取的结果总数。搜索器会自动翻页以达到此数量。 |
| `maxPages` | `number` | 最大抓取页数（翻页循环次数）。用于防止无限循环的安全阈值。默认值：`10`。 |
| `timeRange` | `string` \| `object` | 按时间过滤。预设值：`'all'`, `'hour'`, `'day'`, `'week'`, `'month'`, `'year'`。<br/> 或自定义范围 `{ from: Date\|string, to?: Date\|string }` |
| `category` | `string` | 搜索分类：`'all'`, `'images'`, `'videos'`, `'news'`。 |
| `region` | `string` | ISO 3166-1 alpha-2 地区代码（如 `'US'`, `'CN'`）。 |
| `language` | `string` | ISO 639-1 语言代码（如 `'en'`, `'zh-CN'`）。 |
| `safeSearch` | `string` | 安全搜索级别：`'off'`, `'moderate'`, `'strict'`。 |
| `transform` | `function` | 运行时自定义转换函数。在引擎内置转换之后运行。 |
| `...custom` | `any` | 任何其他键都将作为自定义变量传递给模板（例如 `${myVar}`）。 |

#### 标准搜索结果 (Standard Search Result)

返回数组中的每个结果都遵循以下结构：

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `title` | `string` | 搜索结果的标题。 |
| `url` | `string` | 结果的绝对 URL。 |
| `snippet` | `string` | 简短摘要或描述。 |
| `image` | `string` | (可选) 缩略图或相关图片的 URL。 |
| `date` | `string`\|`Date` | (可选) 发布日期。 |
| `author` | `string` | (可选) 作者或来源名称。 |
| `favicon` | `string` | (可选) 来源网站的 Favicon URL。 |
| `rank` | `number` | (可选) 在结果中的排名（从 1 开始）。 |
| `source` | `string` | (可选) 来源网站名称（如 'GitHub'）。 |

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
