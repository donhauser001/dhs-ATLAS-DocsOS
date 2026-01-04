---
title: ATLAS 4.0.2 测试文档
version: 1
document_type: article
author: aiden
atlas:
  function: article
  display:
    - article.single
    - article.double
    - article.zen
  capabilities:
    - crud
    - export
    - share
    - comment
_properties:
  tags:
    label: 关键词
    type: tags
    config:
      placeholder: 添加标签...
_values:
  tags:
    - 测试
    - Phase-4.0.2
_customOrder:
  - tags
created_at: "2026-01-04T00:00:00.000Z"
tags:
  - 测试
  - Phase-4.0.2
updated_at: "2026-01-04T00:00:00.000Z"
---







# ATLAS 4.0.2 渲染效果测试

这是一个完整的 Markdown 渲染测试文档，包含各种常见元素，用于验证单栏文章渲染器的显示效果。

---

## 标题层级测试

### 三级标题 - 功能模块

#### 四级标题 - 子功能

正文段落内容。这是一段普通的中文段落，用于测试基本的排版效果。好的排版应该有舒适的行高、适当的字间距，以及清晰的段落分隔。

---

## 文本格式测试

这是**粗体文本**，这是*斜体文本*，这是***粗斜体文本***。

这是 `行内代码` 的显示效果，常用于表示变量名如 `documentType`、函数调用如 `formatDate()` 或命令如 `npm install`。

这是一个[超链接示例](https://github.com)，点击可以跳转到外部页面。

---

## 引用块测试

> 单行引用：文档即数据，数据即文档。

> **多行引用测试**
> 
> ATLAS 系统的核心理念是将文档视为结构化数据。每个文档都有其本质（是什么）、功能（能做什么）、显现（如何呈现）和能力（具备什么）四个维度。
> 
> — ATLAS 系统宪法

---

## 列表测试

### 无序列表

- 第一项内容
- 第二项内容
- 第三项内容，这是一段较长的内容，用于测试列表项换行时的缩进效果

### 有序列表

1. 首先，完成需求分析
2. 其次，进行技术设计
3. 然后，开始编码实现
4. 最后，执行测试验收

### 嵌套列表

- 前端开发
  - React 组件开发
  - 状态管理
  - 样式系统
- 后端开发
  - API 设计
  - 数据库操作
  - 认证授权
- 运维部署
  - CI/CD 配置
  - 监控告警

### 任务列表

- [x] 完成 DocumentInfoCard 组件
- [x] 完成 ViewSwitcher 组件
- [x] 实现单栏文章渲染器
- [ ] 实现双栏文章渲染器
- [ ] 实现禅模式渲染器

---

## 表格测试

### 简单表格

| 功能 | 状态 | 负责人 |
|------|------|--------|
| 属性面板 | 已完成 | Alice |
| 视图切换 | 进行中 | Bob |
| 数据导出 | 待开始 | Carol |

### 复杂表格

| 维度 | 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|------|--------|------|
| 本质层 | `document_type` | string | ✓ | - | 文档的本质类型 |
| 功能层 | `atlas.function` | string | ✓ | - | 文档的功能定位 |
| 显现层 | `atlas.display` | array | ✗ | `['default']` | 支持的显现模式 |
| 能力层 | `atlas.capabilities` | array | ✗ | `[]` | 文档具备的能力 |

### 数据表格

| 项目名称 | 进度 | 开始日期 | 结束日期 | 状态 |
|----------|------|----------|----------|------|
| ATLAS Core | 85% | 2025-10-01 | 2026-02-28 | 进行中 |
| DocsOS Frontend | 70% | 2025-11-15 | 2026-03-15 | 进行中 |
| Plugin System | 30% | 2026-01-01 | 2026-04-30 | 规划中 |

---

## 代码块测试

### TypeScript 代码

```typescript
interface DocumentConfig {
  documentType: string;
  atlas: {
    function: string;
    display: string[];
    capabilities: string[];
  };
}

export function getDisplayRenderer(mode: string): React.ComponentType {
  const renderers: Record<string, React.ComponentType> = {
    'article.single': ArticleSingleRenderer,
    'article.double': ArticleDoubleRenderer,
    'article.zen': ArticleZenRenderer,
  };
  
  return renderers[mode] ?? renderers['article.single'];
}
```

### JSON 配置

```json
{
  "document_type": "article",
  "atlas": {
    "function": "article",
    "display": ["article.single", "article.double"],
    "capabilities": ["crud", "export", "share"]
  }
}
```

### Shell 命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### CSS 样式

```css
.article-single {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  line-height: 1.75;
}

.article-single h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}
```

---

## 混合内容测试

下面是一个包含多种元素的真实场景示例：

### 用户认证流程

系统采用 **JWT** 进行用户认证，流程如下：

1. 用户提交登录凭证（用户名 + 密码）
2. 服务端验证凭证，生成 `accessToken` 和 `refreshToken`
3. 客户端存储 token，后续请求携带 `Authorization` 头

> **安全提示**：请勿在前端代码中硬编码任何敏感信息。

相关 API 端点：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/refresh` | POST | 刷新 token |
| `/api/auth/logout` | POST | 用户登出 |

示例代码：

```typescript
async function login(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  if (!response.ok) {
    throw new Error('登录失败');
  }
  
  return response.json();
}
```

---

## 长段落测试

这是一段较长的中文段落，用于测试文章渲染器对长文本的处理能力。在实际的文档场景中，用户经常会撰写大段的文字内容，好的排版应该能够让读者舒适地阅读这些内容。行高不宜过小，否则文字会显得拥挤；也不宜过大，否则会影响阅读的连贯性。字间距同样需要适中，中文排版一般不需要额外的字间距，但也不能太紧凑。段落之间应该有明显的间距，让读者能够清晰地区分不同的段落。

另一个重要的考量是响应式设计。在不同的屏幕尺寸下，文章的宽度应该有所调整，以保证每行的字数在一个舒适的范围内。一般来说，中文排版每行 30-40 个字是比较理想的。如果每行字数过多，读者的眼睛需要移动较长的距离，容易疲劳；如果每行字数过少，则会频繁换行，影响阅读节奏。

---

## 结语

如果你能看到这个文档的完整内容，并且各种元素都正确渲染，说明 **Phase 4.0.2** 的单栏文章渲染器基本功能正常。

接下来的工作：

- [ ] 优化移动端适配
- [ ] 实现双栏布局
- [ ] 实现禅模式
- [ ] 添加目录导航
- [ ] 支持代码高亮主题切换
