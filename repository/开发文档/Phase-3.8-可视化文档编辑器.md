---
slug: doc-una72h
---
# Phase 3.8: 可视化文档编辑器

> **代号**: Visual Doc Editor  
> **目标**: 打造一个真正的"小白友好型"文档编辑器，让普通用户无需了解 Markdown 即可创建和编辑结构化文档

## 背景与动机

### 问题回顾

在 Phase 3.7 中，我们实现了 CodeMirror 编辑器，提供了语法高亮、搜索替换等功能。但这仍然是一个**面向开发者**的编辑器：

```markdown
---
version: "1.0"
document_type: facts
atlas:
  function: entity_list
  entity_type: client
  field_config:
    category:
      type: select
      options:
        - 图书出版
        - 教育出版
---

### 中信出版社 {#client-3}

```yaml
type: client
id: client-3
status: active
category: 图书出版
```
```

**普通用户看到这个会说什么？**

> "这是什么？我只想记录一个客户信息，为什么要写这么多代码？"

### 乔布斯哲学

> **"简单是终极的复杂。用户不应该看到技术细节，系统应该像魔法一样工作。"**

真正的"文档即系统"，不是让用户写配置文件，而是让用户写他们能理解的内容，系统自动理解该怎么做。

## 设计理念

### 三层分离

| 层 | 对用户呈现 | 对系统存储 |
|---|----------|-----------|
| **UI 层** | 可视化表单、控件 | - |
| **编辑层** | 所见即所得 | - |
| **存储层** | 用户不可见 | Markdown + YAML |

### 对标产品

- **Obsidian** - Properties 面板 + Live Preview
- **Notion** - Database Properties + 富文本编辑
- **Airtable** - 字段类型系统

### 核心原则

1. **用户永远不需要看到 Markdown 源码**（除非他想）
2. **配置通过 UI 完成，而非手写 YAML**
3. **属性定义一次，到处引用**
4. **组件化、可扩展、插件友好**

---

## 🚨 不可违背原则（Iron Rules）

> 以下原则是系统的"宪法"，任何功能设计都不得违背。
> 违背这些原则会导致 6-12 个月后系统不可维护。

### Iron Rule 1: 属性是单一真源（SSOT）

```
┌─────────────────────────────────────────────────────────┐
│  一个属性在一个文档中，只有一个真实值。                   │
│  所有插入点都是同一个值的不同呈现。                       │
└─────────────────────────────────────────────────────────┘
```

**正文中的属性不是"值"，而是"视图"。**

| 概念 | 说明 |
|-----|------|
| **属性（Property）** | 定义在属性面板中，是唯一真源 |
| **属性视图（Property View）** | 正文中的 `{{属性名}}`，是对属性的引用 |
| **渲染** | 属性视图渲染时，从属性面板读取当前值 |

**禁止的场景**：
- ❌ "我想在这个段落用一个不同的客户分类"
- ❌ "这里我想临时改一下发票类型，不影响顶部"
- ❌ 允许属性视图有"局部值"或"覆盖值"

**一旦允许"局部值"，整个数据模型会直接裂成两套，系统将不可信。**

---

### Iron Rule 2: Key 与 Label 必须分离

```
┌─────────────────────────────────────────────────────────┐
│  系统 Key 永远不暴露给用户，但永远存在。                  │
│  用户只看到 Label，系统只认 Key。                        │
└─────────────────────────────────────────────────────────┘
```

**三层命名模型**：

| 层 | 用途 | 可改 | 示例 |
|---|------|-----|------|
| `key` | 系统唯一标识，用于引用、存储、插件 | ❌ 永不可改 | `client_category` |
| `label` | 用户看到的显示名称 | ✅ 可随时改 | `客户分类` |
| `description` | 给小白的说明文字（可选） | ✅ 可随时改 | `选择客户所属行业` |

**存储格式**：

```yaml
_properties:
  client_category:           # ← key（系统用）
    label: 客户分类          # ← label（用户看）
    description: 选择客户所属行业
    type: select
    options:
      - key: publishing
        label: 图书出版
      - key: education
        label: 教育出版
```

**正文引用**：

```markdown
- 分类：{{client_category}}      # ← 用 key 引用
```

**渲染时**：显示 label（"客户分类：图书出版"）

**为什么这么重要？**
- 改了 label → 不影响任何引用
- 插件通过 key 找字段 → 稳定
- 文档迁移 → key 不变，数据不丢

---

### Iron Rule 3: 插件组件必须可降级

```
┌─────────────────────────────────────────────────────────┐
│  任何插件组件，在插件不存在时，必须仍能渲染。             │
│  "卸载插件 → 文档打不开"是不可接受的。                   │
└─────────────────────────────────────────────────────────┘
```

**三种组件状态**：

| 状态 | 条件 | 渲染要求 |
|-----|------|---------|
| **正常态** | 插件存在，用户有权限 | 完整可编辑控件 |
| **只读态** | 插件存在，但用户无权限或组件被锁 | 显示值，不可编辑 |
| **失效态** | 插件不存在或版本不兼容 | 必须可渲染（见下） |

**失效态必须显示**：

```
┌─────────────────────────────────────────┐
│ ⚠️ 组件不可用                           │
│                                         │
│ 组件类型: plugin-gantt                  │
│ 最后保存值: { start: "2025-01", ... }   │
│                                         │
│ [安装插件] [导出原始数据]                │
└─────────────────────────────────────────┘
```

**组件接口必须包含**：

```typescript
interface PropertyComponent {
  // ... 其他方法 ...
  
  // 失效态渲染（必须实现）
  renderFallback: (lastValue: unknown, config: unknown) => ReactNode;
  
  // 序列化（用于失效态显示和数据导出）
  serialize: (value: unknown) => string;
}
```

**原则**：系统的可信度 > 插件的功能丰富度。

---

## 核心架构

```
┌──────────────────────────────────────────────────────────────┐
│  📄 客户管理                              [阅读] [编辑] [源码] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────── 属性面板 ───────────────────────────┐  │
│  │                                                        │  │
│  │  🔒 系统属性（必须 · 不可删除）                         │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┐        │  │
│  │  │ 版本     │ 文档类型  │ 创建时间  │ 更新时间  │        │  │
│  │  │ [1.0 ▾]  │ [事实型▾] │ 2025/01  │ (自动)   │        │  │
│  │  └──────────┴──────────┴──────────┴──────────┘        │  │
│  │  ┌──────────┬──────────────────────────────────┐        │  │
│  │  │ 作者     │ 功能                              │        │  │
│  │  │ aiden    │ [实体列表 ▾]                      │        │  │
│  │  └──────────┴──────────────────────────────────┘        │  │
│  │                                                        │  │
│  │  🧩 自定义属性                                          │  │
│  │  ┌──────────────────────────────────────────────┐      │  │
│  │  │ 📋 客户分类    [下拉选择]  图书出版           │ ⚙️ ✕ │  │
│  │  │ 📄 发票类型    [下拉选择]  增值税普通发票     │ ⚙️ ✕ │  │
│  │  │ ⭐ 客户评级    [星级评分]  ★★★☆☆            │ ⚙️ ✕ │  │
│  │  └──────────────────────────────────────────────┘      │  │
│  │                                                        │  │
│  │  [＋ 添加属性]                                          │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────── 正文编辑区 ──────────────────────────┐  │
│  │                                                        │  │
│  │  # 客户管理                                            │  │
│  │                                                        │  │
│  │  > 本文档管理所有客户信息                               │  │
│  │                                                        │  │
│  │  ## 中信出版社                                         │  │
│  │                                                        │  │
│  │  **基本信息**                                          │  │
│  │  - 分类：[▾ 图书出版    ]  ← 属性视图（可交互）        │  │
│  │  - 发票：[▾ 增值税普通发票]                            │  │
│  │  - 评级：[★★★★★]                                      │  │
│  │  - 地址：北京市朝阳区惠新东街甲4号                      │  │
│  │                                                        │  │
│  │  ---                                                   │  │
│  │                                                        │  │
│  │  ## 北京品雅文化有限公司                                │  │
│  │  ...                                                   │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  📍 客户管理.md  ·  112 条记录  ·  ⌘S 保存                   │
└──────────────────────────────────────────────────────────────┘
```

## 已实现功能

### 编辑器整体架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│  📄 客户管理                                    [阅读] [编辑] [源码]      │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────── 属性面板（可折叠）─────────────────────────────┐  │
│  │  🔒 系统属性（三列布局、拖拽排序）                                   │  │
│  │  ┌──────────┬──────────┬──────────┐                                │  │
│  │  │ 📅 版本   │ 📋 类型   │ 👤 作者   │                                │  │
│  │  │ [1.0 ▾]  │ [事实型▾] │ aiden    │                                │  │
│  │  └──────────┴──────────┴──────────┘                                │  │
│  │                                                                    │  │
│  │  🧩 自定义属性（dnd-kit 拖拽）                                       │  │
│  │  ┌────────────────────────────────────────────────────────────┐    │  │
│  │  │ ⋮⋮ 📋 客户分类    图书出版                              ⚙️ ✕ │    │  │
│  │  │ ⋮⋮ ⭐ 客户评级    ★★★☆☆                               ⚙️ ✕ │    │  │
│  │  └────────────────────────────────────────────────────────────┘    │  │
│  │  [＋ 添加属性]                                                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌─────────────────────── 块式编辑区 ───────────────────────┐  │
│  │ 组件  │  │                                                        │  │
│  │ 插入  │  │  ⋮⋮  # 客户管理                              [H1 ▾]    │  │
│  │ 器    │  │                                                        │  │
│  │      │  │  ⋮⋮  > 本文档管理所有客户信息                  [引用 ▾]  │  │
│  │ ┌──┐ │  │                                                        │  │
│  │ │段│ │  │  ⋮⋮  ┌────────────────────────────────────┐            │  │
│  │ │落│ │  │      │  📊 数据                            │  [数据 ▾]  │  │
│  │ ├──┤ │  │      │  ┌────────────────────────────────┐ │            │  │
│  │ │标│ │  │      │  │ 📋 类型      client            │ │            │  │
│  │ │题│ │  │      │  │ # 编号       client-1          │ │            │  │
│  │ ├──┤ │  │      │  │ ✓ 状态       active            │ │            │  │
│  │ │列│ │  │      │  │ H 标题       中信出版社         │ │            │  │
│  │ │表│ │  │      │  │ 📅 创建时间   2025-01-01       │ │            │  │
│  │ ├──┤ │  │      │  └────────────────────────────────┘ │            │  │
│  │ │数│ │  │      │  [+ 添加字段] [存为模板] [同步到所有client]      │            │  │
│  │ │据│ │  │      └────────────────────────────────────┘            │  │
│  │ └──┘ │  │                                                        │  │
│  └──────┘  └────────────────────────────────────────────────────────┘  │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│  [组件] 📍 客户管理.md  [未保存]        112 个属性 · ⌘S 保存 · [保存]    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 数据块编辑器特性

| 特性 | 说明 |
|-----|------|
| **固定字段** | type, id, status, title, createdAt, updatedAt 自动包含，不可删除 |
| **字段选择器** | 从标签映射系统选择字段，分类展示，支持搜索和刷新 |
| **字段图标** | 每个字段显示对应的标签图标 |
| **同步结构** | 将当前数据块字段结构同步到文档内所有同类型数据块 |
| **存为模板** | 保存当前数据块为可复用模板 |

### 数据模板系统

```
系统设置 → 数据模板
├── 模板分类管理（增删改）
├── 模板管理（每个分类下的模板列表）
│   ├── 模板名称
│   ├── 模板描述
│   ├── 数据类型
│   └── 字段列表
└── 编辑器集成
    ├── 存为模板按钮（数据块底部）
    └── 从模板创建（新建数据块时选择）
```

---

## 功能模块

### 1. 属性面板 (Properties Panel)

位于文档顶部，分为两个区域：

#### 1.1 系统属性区（System Properties）

**不可删除**的系统必填字段，决定系统如何渲染文档：

| 字段 | 类型 | 可编辑 | 说明 |
|------|------|--------|------|
| `version` | 下拉选择器 | ✅ | ADL 版本号 |
| `document_type` | 下拉选择器 | ✅ | 文档类型 |
| `created` | 日期时间 | ❌ | 创建时间（只读） |
| `updated` | 日期时间 | ❌ | 更新时间（自动） |
| `author` | 用户选择 | ✅ | 文档作者 |
| `atlas.function` | 下拉选择器 | ✅ | 功能声明 |
| `atlas.capabilities` | 多选标签 | ✅ | 能力声明 |

#### 1.2 自定义属性区（Custom Properties）

用户可自由添加的属性，每个属性包含：

- **属性名**：显示名称（如"客户分类"）
- **组件类型**：从组件库选择（如"下拉选择"）
- **配置项**：组件特定配置（如下拉选项列表）
- **当前值**：属性的当前值

**操作**：
- ⚙️ 编辑属性配置
- ✕ 删除属性
- 拖拽排序

### 2. 属性组件库 (Property Component Library)

#### 2.1 内置组件

| 组件 ID | 显示名称 | 用途 | 配置项 |
|---------|---------|------|--------|
| `text` | 文本 | 单行文本输入 | placeholder, maxLength |
| `textarea` | 多行文本 | 长文本输入 | placeholder, rows |
| `number` | 数字 | 数字输入 | min, max, step |
| `select` | 下拉选择 | 单选下拉 | options[] |
| `multi-select` | 多选标签 | 多选 | options[], maxSelect |
| `date` | 日期 | 日期选择 | format |
| `datetime` | 日期时间 | 日期时间选择 | format |
| `checkbox` | 复选框 | 布尔值 | - |
| `rating` | 星级评分 | 评分 | max (默认5) |
| `link` | 文档链接 | 关联其他文档 | allowedTypes[] |
| `user` | 用户 | 关联用户/principal | - |
| `file` | 文件 | 附件上传 | accept, maxSize |
| `color` | 颜色 | 颜色选择 | presets[] |
| `icon` | 图标 | 图标选择 | iconSet |
| `formula` | 公式 | 计算字段（只读） | expression |

#### 2.2 组件接口

```typescript
interface PropertyComponent {
  // === 身份标识 ===
  id: string;                    // 组件唯一标识（如 'select', 'plugin-gantt'）
  name: string;                  // 显示名称（如 '下拉选择'）
  icon: string;                  // 组件图标
  description: string;           // 组件描述
  version: string;               // 组件版本（用于兼容性检查）
  
  // === 配置定义 ===
  configSchema: JSONSchema;      // 配置项 JSON Schema
  
  // === 渲染器（全部必须实现） ===
  renderConfig: (config, onChange) => ReactNode;        // 配置面板
  renderEditor: (value, config, onChange) => ReactNode; // 编辑态
  renderView: (value, config) => ReactNode;             // 只读态
  renderInline: (value, config) => ReactNode;           // 行内引用
  
  // === ⚠️ 失效态渲染（必须实现，不可为空） ===
  renderFallback: (lastValue: unknown, config: unknown) => ReactNode;
  
  // === 验证 ===
  validate: (value, config) => ValidationResult;
  
  // === 序列化（用于存储和失效态显示） ===
  serialize: (value) => string;    // 值 → 可存储字符串
  deserialize: (str) => unknown;   // 字符串 → 值
}
```

#### 2.3 插件扩展

未来支持插件注册自定义组件：

```typescript
// 插件中注册组件
atlas.registerPropertyComponent({
  id: 'plugin-gantt',
  name: '甘特图',
  icon: 'gantt-chart',
  // ... 组件实现
});
```

### 3. 属性引用系统 (Property Reference)

#### 3.1 引用语法

在正文中引用已定义的属性：

```markdown
- 分类：{{client_category}}      # ← 用 key 引用
- 发票：{{invoice_type}}
- 评级：{{client_rating}}
```

**渲染时**：系统根据 key 找到属性定义，显示对应的 label 和值。

#### 3.2 引用渲染

| 模式 | `{{客户分类}}` 渲染为 |
|-----|---------------------|
| **编辑模式** | 可交互控件 `[▾ 图书出版]` |
| **阅读模式** | 徽标 `🏷️ 图书出版` |
| **导出 PDF** | 纯文本 `图书出版` |
| **源码模式** | `{{客户分类:图书出版}}` |

#### 3.3 插入属性

用户在正文编辑时：

1. **快捷键**: 输入 `/prop` 或 `{{`
2. **右键菜单**: 右键 → 插入属性
3. **工具栏**: 点击"插入属性"按钮

弹出属性选择器，选择后插入 `{{属性名}}`。

### 4. 富文本编辑器 (Rich Text Editor)

基于 Tiptap / ProseMirror 的所见即所得编辑器：

#### 4.1 基础功能

- **标题** - H1-H6
- **列表** - 有序/无序/任务列表
- **格式** - 粗体/斜体/删除线/代码
- **引用** - blockquote
- **分割线** - hr
- **链接** - 内部链接/外部链接
- **图片** - 上传/URL/拖拽
- **表格** - 表格编辑

#### 4.2 扩展功能

- **属性视图** - `{{属性名}}` 渲染为可交互控件
- **代码块** - 语法高亮 (保留 YAML 块)
- **嵌入** - 嵌入其他文档/视频/iframe
- **Callout** - 提示/警告/信息框

#### 4.3 斜杠命令

输入 `/` 触发命令面板：

```
/ 
├── 标题
│   ├── 一级标题
│   ├── 二级标题
│   └── 三级标题
├── 列表
│   ├── 无序列表
│   ├── 有序列表
│   └── 任务列表
├── 插入
│   ├── 属性字段      ← 插入 {{属性}}
│   ├── 分割线
│   ├── 引用块
│   ├── 代码块
│   ├── 表格
│   └── 图片
└── 模板
    └── 从模板插入...  ← 插入预定义结构
```

### 5. 模式切换

三种编辑模式：

| 模式 | 图标 | 用途 | 用户群体 |
|------|-----|------|---------|
| **阅读** | 👁️ | 只读浏览 | 所有用户 |
| **编辑** | ✏️ | 可视化编辑 | 普通用户 |
| **源码** | `</>` | Markdown 源码 | 高级用户 |

## 底层存储格式

用户界面的背后，数据仍以 Markdown 存储。

### 属性定义（遵循 Key/Label 分离原则）

```yaml
---
# 系统属性（不可删除）
version: "1.0"
document_type: facts
created: 2025-01-01T00:00:00.000Z
updated: 2026-01-03T10:30:00.000Z
author: aiden
atlas:
  function: entity_list
  entity_type: client

# 自定义属性定义（用户通过 UI 配置，不直接编辑）
_properties:
  # Key: client_category（系统用，永不改变）
  client_category:
    label: 客户分类                    # 用户看到的名称（可改）
    description: 选择客户所属的行业类别  # 说明文字（可选）
    type: select
    required: true
    options:
      - key: publishing                # 选项也用 key/label
        label: 图书出版
      - key: education
        label: 教育出版
      - key: media
        label: 文化传媒
      - key: printing
        label: 印刷发行
      - key: government
        label: 政府机构

  # Key: invoice_type
  invoice_type:
    label: 发票类型
    type: select
    options:
      - key: regular
        label: 增值税普通发票
      - key: special
        label: 增值税专用发票

  # Key: client_rating
  client_rating:
    label: 客户评级
    type: rating
    max: 5

# 属性当前值（与定义分离）
_values:
  client_category: publishing          # 存 key，不存 label
  invoice_type: special
  client_rating: 5
---
```

### 正文内容（属性视图用 key 引用）

```markdown
# 客户管理

> 本文档管理所有客户信息

## 中信出版社

**基本信息**
- 分类：{{client_category}}           # ← 渲染为「客户分类：图书出版」
- 发票：{{invoice_type}}              # ← 渲染为「发票类型：增值税专用发票」
- 评级：{{client_rating}}             # ← 渲染为「客户评级：★★★★★」
- 地址：北京市朝阳区惠新东街甲4号      # ← 普通文本，不是属性
```

> **注意**：正文中的 `{{key}}` 是属性视图，不存储值。
> 值统一存储在 frontmatter 的 `_values` 中。

## 关键文件结构

```
frontend/src/
├── components/
│   └── visual-editor/                    # 可视化编辑器
│       ├── VisualDocEditor.tsx           # 主编辑器组件（模式切换、保存、组件注入）
│       │
│       ├── PropertiesPanel/              # 属性面板（模块化）
│       │   ├── PropertiesPanel.tsx       # 属性面板主组件
│       │   ├── SystemPropertiesSection.tsx  # 系统属性区
│       │   ├── CustomPropertiesSection.tsx  # 自定义属性区
│       │   ├── SortablePropertyRow.tsx   # 可排序系统属性行
│       │   ├── SortableCustomProperty.tsx # 可排序自定义属性
│       │   ├── AddPropertyDialog.tsx     # 添加属性对话框
│       │   ├── system-config.tsx         # 系统属性配置
│       │   ├── types.ts                  # 类型定义
│       │   ├── utils.ts                  # 工具函数
│       │   └── index.ts                  # 导出
│       │
│       ├── BlockEditor/                  # 块式编辑器（Notion 风格）
│       │   ├── BlockEditor.tsx           # 块编辑器主组件
│       │   ├── BlockItem.tsx             # 单个块渲染（拖拽、类型菜单、模板选择）
│       │   ├── DataBlockEditor.tsx       # 数据块编辑器（YAML 可视化）
│       │   ├── FieldSelector.tsx         # 字段选择器（分类、搜索）
│       │   ├── FieldSettingsDialog.tsx   # 字段设置对话框（组件绑定）
│       │   ├── ComponentControls.tsx     # 组件控件渲染器
│       │   ├── StatusOptionsDialog.tsx   # 状态选项配置对话框
│       │   ├── IdConfigDialog.tsx        # 编号格式配置对话框
│       │   ├── SaveTemplateDialog.tsx    # 存为模板对话框（含组件）
│       │   ├── TemplateSelector.tsx      # 模板选择器（返回组件）
│       │   ├── parser.ts                 # Markdown → Block 解析器
│       │   ├── types.ts                  # Block 类型定义
│       │   └── index.ts                  # 导出
│       │
│       ├── ComponentPanel/               # 文档组件面板
│       │   ├── ComponentPanel.tsx        # 组件面板主组件
│       │   ├── ComponentConfigurator.tsx # 组件配置器
│       │   ├── types.ts                  # 组件类型定义
│       │   └── index.ts                  # 导出
│       │
│       ├── RichTextEditor/               # 富文本编辑器（阅读模式）
│       │   ├── RichTextEditor.tsx        # Tiptap 编辑器封装
│       │   └── index.ts                  # 导出
│       │
│       ├── ComponentInserter/            # 组件插入器（左侧栏）
│       │   ├── ComponentInserter.tsx     # 组件列表
│       │   └── index.ts                  # 导出
│       │
│       └── CodeMirrorEditor/             # 源码编辑器
│           └── CodeMirrorEditor.tsx      # CodeMirror 封装
│
├── pages/
│   └── settings/
│       └── DataTemplateSettings.tsx      # 数据模板管理页面
│
├── api/
│   └── data-templates.ts                 # 数据模板 API 客户端（含组件类型）
│
├── registry/
│   └── property-components.ts            # 属性组件全局注册
│
├── providers/
│   └── LabelProvider.tsx                 # 标签映射上下文
│
└── types/
    └── property.ts                       # 属性类型定义

backend/src/
├── api/
│   └── data-templates.ts                 # 数据模板 API 路由（含 /generate）
│
└── services/
    ├── data-template.ts                  # 数据模板服务（含组件存储）
    └── label-config.ts                   # 标签配置服务
```

## 依赖包

```json
{
  // 富文本编辑器
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-task-list": "^2.x",
  "@tiptap/extension-task-item": "^2.x",
  "@tiptap/extension-table": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-code-block-lowlight": "^2.x",
  
  // 代码高亮
  "lowlight": "^3.x",
  
  // 拖拽排序
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^8.x",
  
  // 日期选择
  "date-fns": "^3.x",
  
  // 保留现有
  "@codemirror/view": "^6.x",  // 源码模式仍用 CodeMirror
}
```

## 实施计划

### Phase 3.8.1 - 属性面板基础 ✅

- [x] 属性面板 UI 框架
- [x] 系统属性区（三列响应式布局）
- [x] 自定义属性区框架
- [x] 添加属性对话框
- [x] 拖拽排序（dnd-kit）
- [x] 标签映射系统集成

### Phase 3.8.2 - 属性组件库 ✅

- [x] 组件接口定义
- [x] 基础组件实现（text, select, rating, date, checkbox）
- [x] 组件注册中心
- [x] 组件配置面板

### Phase 3.8.3 - 块式编辑器 ✅

- [x] BlockEditor 主框架
- [x] 块类型系统（段落、标题、列表、引用、代码、数据）
- [x] Notion 风格控制界面（单手柄 + 弹出菜单）
- [x] 块拖拽排序
- [x] 块类型转换

### Phase 3.8.4 - 数据块编辑器 ✅

- [x] DataBlockEditor - YAML 数据可视化编辑
- [x] FieldSelector - 分类字段选择器
- [x] 固定字段系统（type, id, status, title, createdAt, updatedAt）
- [x] 字段图标显示（使用标签映射）
- [x] 同步数据结构功能（前端实现）
- [x] 确认对话框（同步操作）

### Phase 3.8.5 - 数据模板系统 ✅

- [x] 后端模板服务（CRUD 操作）
- [x] API 路由（/api/data-templates）
- [x] 设置页面（DataTemplateSettings）
- [x] 存为模板功能（SaveTemplateDialog）
- [x] 模板选择器（TemplateSelector）

### Phase 3.8.6 - 模式切换与完善 ✅

- [x] 阅读/编辑/源码 三模式切换
- [x] 数据双向同步（可视化 ↔ Markdown）
- [x] 底部状态栏固定
- [x] 保存功能（Cmd+S 快捷键）
- [x] 保存状态指示
- [x] 系统设置 URL 定位（/settings/:section）
- [ ] 性能优化（待优化）
- [ ] 文档迁移工具（待开发）

### Phase 3.8.7 - 文档组件系统 ✅

> **目标**：让用户在文档内定义可复用的输入组件，用于数据块字段的结构化编辑

#### 核心概念

```
┌─────────────────────────────────────────────────────────────────────┐
│  组件定义 → 存储在文档 frontmatter 的 _components 字段              │
│  组件绑定 → 在数据块内通过 _bindings 字段绑定字段与组件             │
│  组件渲染 → DataBlockEditor 检测绑定并渲染对应控件                  │
│  值存储   → 选择后存储实际值（如 "增值税普通发票"），非引用         │
└─────────────────────────────────────────────────────────────────────┘
```

#### 数据结构

```yaml
---
version: "1.0"
# 组件定义区（文档级）
_components:
  invoice_selector:
    id: invoice_selector
    type: select              # 组件类型
    label: 发票类型           # 显示名称
    options:                  # 选项列表（简化：value 即 label）
      - value: 增值税普通发票
      - value: 增值税专用发票
    
  rating_5star:
    id: rating_5star
    type: rating
    label: 评分
    max: 5
---

### 客户数据 {#client-1}

```yaml
type: client
invoiceType: 增值税普通发票   # ← 实际值
rating: 4                     # ← 实际值
# 绑定信息（数据块级）
_bindings:
  invoiceType: invoice_selector
  rating: rating_5star
# 状态选项（数据块级，用于 status 字段）
_status_options:
  - value: 活跃
    color: green
  - value: 非活跃
    color: gray
# 编号配置（数据块级，用于 id 字段）
_id_config:
  prefix: CLI
  separator: "-"
  digits: 4
  startFrom: 1
  frozen: false
```
```

#### 支持的组件类型

| 类型 | 说明 | 配置项 |
|-----|------|--------|
| `select` | 下拉选择 | options, placeholder |
| `multi-select` | 多选下拉 | options |
| `rating` | 星级评分 | max |
| `number` | 数字输入 | min, max, step |
| `date` | 日期选择 | includeTime |
| `text` | 单行文本 | placeholder |
| `textarea` | 多行文本 | placeholder, rows |

#### 特殊字段配置

| 字段 | 配置方式 | 说明 |
|-----|---------|------|
| `status` | 点击标签名 → StatusOptionsDialog | 配置该数据类型允许的状态值和颜色 |
| `id` | 点击标签名 → IdConfigDialog | 配置编号格式（前缀、分隔符、位数、起始、冻结） |

#### 已完成任务

- [x] ComponentPanel - 组件面板
  - [x] 已定义组件列表
  - [x] 添加组件按钮
  - [x] 编辑/删除组件
  - [x] 组件图标显示
- [x] ComponentConfigurator - 组件配置器
  - [x] 组件类型选择
  - [x] 通用配置（名称、标签）
  - [x] 类型特定配置（选项、范围等）
  - [x] 选项颜色和图标配置
- [x] 组件存储与解析
  - [x] frontmatter `_components` 读写
  - [x] 数据块 `_bindings` 绑定读写
- [x] DataBlockEditor 集成
  - [x] 字段设置对话框（FieldSettingsDialog）
  - [x] 检测字段是否绑定组件
  - [x] 渲染对应组件控件
  - [x] 值变化同步
  - [x] 同步结构时同步组件绑定
- [x] 组件控件实现
  - [x] SelectControl
  - [x] MultiSelectControl
  - [x] RatingControl
  - [x] NumberControl
  - [x] DateControl
  - [x] TextControl
  - [x] TextareaControl
- [x] 固定字段特殊处理
  - [x] StatusOptionsDialog - 状态选项配置
  - [x] IdConfigDialog - 编号格式配置
  - [x] 编号自动生成
  - [x] 编号冻结功能

### Phase 3.8.8 - 模板组件同步 ✅

> **目标**：保存和插入模板时同步关联的组件定义

#### 核心功能

1. **保存模板时**：将关联的组件定义、字段绑定、状态选项、编号配置一并保存
2. **插入模板时**：自动将模板中的组件注入到当前文档

#### 数据结构扩展

```typescript
interface DataTemplate {
  // ... 基础字段
  bindings?: Record<string, string>;        // 字段-组件绑定
  components?: Record<string, Component>;   // 关联的组件定义
  statusOptions?: StatusOption[];           // 状态选项配置
  idConfig?: IdConfig;                      // 编号配置
}
```

#### API 扩展

- `POST /api/data-templates/from-data` - 创建模板（包含组件）
- `GET /api/data-templates/template/:id/generate` - 生成数据块（返回 YAML + 组件）

#### 已完成任务

- [x] 扩展 DataTemplate 类型
- [x] SaveTemplateDialog 传递完整数据
- [x] 后端 API 支持存储组件
- [x] TemplateSelector 返回组件
- [x] BlockItem 注入组件回调
- [x] VisualDocEditor 合并组件

## 预期成果

| 指标 | 之前 | 之后 |
|------|------|------|
| **学习成本** | 需要懂 YAML/Markdown | 零门槛 |
| **新建文档** | 手写 frontmatter | 填表单 |
| **编辑体验** | 源码编辑 | 所见即所得 |
| **字段配置** | 写 `field_config` | 点击添加 |
| **目标用户** | 开发者 | 所有人 |

## 相关 Phase

- **Phase 3.5** - 固定键系统（系统属性基础）
- **Phase 3.6** - 场景化视图系统（阅读/表单/MD 三视图）
- **Phase 3.7** - MD 编辑器优化（源码模式基础）

---

## 🛡️ 系统可信度承诺

> **这不仅是一个编辑器功能设计，而是一个可扩展知识系统的基础设施设计。**

### 我们做的不是"把 Markdown 变好用"

我们做的是：

```
把"结构化能力"从程序员手里，交还给普通人，
而不牺牲系统确定性。
```

### 这意味着

| 承诺 | 实现方式 |
|-----|---------|
| **数据永远可读** | 底层存储是纯 Markdown，任何编辑器都能打开 |
| **系统永远可信** | 插件失效不会导致文档打不开 |
| **迁移永远可行** | Key 不变，Label 可改，引用不断 |
| **扩展不破坏核心** | 插件是一等公民，但有明确边界 |

### 为什么这很难

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   简单（用户体验）    ←──────────→    确定（系统）  │
│                                                     │
│   大多数产品只能选一边。                             │
│   我们的目标是：两边都要。                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Phase 3.8 是 ATLAS 第一次真正走向非技术用户。

**如果成功，这将是：**
- 不是另一个 Notion 模仿者
- 不是另一个 Obsidian 插件
- 而是一个真正的「文档即系统」实现

---

> **愿景**: 让每个人都能像用 Notion 一样轻松地创建结构化文档，同时保持 Markdown 的开放性和可移植性。

---

## 更新记录

### 2026-01-03 v4.0 - 编辑器稳健性优化 (Phase 3.8.9)

> 详见 [Phase-3.8.9-编辑器稳健性优化.md](./Phase-3.8.9-编辑器稳健性优化.md)

**渲染性能优化**
- 引入 `use-debounce` 实现防抖序列化
- 块失焦时立即同步，避免数据丢失
- 新增 `flushContent` API 用于保存前强制同步

**视口同步**
- 模式切换时保存当前选中块 ID
- 切回编辑模式时自动滚动到之前位置
- 为 BlockItem 添加 DOM id 用于定位

**失效态降级 (Iron Rule 3)**
- 新增 FallbackControl 组件
- 组件不可用时显示警告和原始数据
- 支持手动输入覆盖值

**Commit Buffer 提案机制**
- 新增 useCommitBuffer Hook
- 底部状态栏显示待提交变更数量
- 支持批量提交或放弃变更

### 2026-01-03 v3.0 - 组件系统完成

**文档组件系统**
- ComponentPanel - 组件面板（定义、编辑、删除）
- ComponentConfigurator - 组件配置器（类型选择、选项配置）
- FieldSettingsDialog - 字段设置对话框（组件绑定）
- ComponentControls - 组件控件渲染器（7种控件类型）

**固定字段特殊处理**
- StatusOptionsDialog - 状态选项配置（值、颜色）
- IdConfigDialog - 编号格式配置（前缀、分隔符、位数、起始、冻结）
- 编号自动生成与冻结功能
- 同步结构时同步状态选项和编号配置

**模板组件同步**
- 保存模板时保存关联组件、绑定、状态选项、编号配置
- 插入模板时自动注入组件到文档
- `/api/data-templates/template/:id/generate` 端点

**数据模型优化**
- 简化组件选项结构（value 即 label）
- 数据块级 `_bindings` 替代文档级 `_field_components`
- 数据块级 `_status_options` 和 `_id_config`

### 2026-01-03 v2.0 - 功能完成

**属性面板完善**
- 实现三列响应式布局
- 集成 dnd-kit 拖拽排序
- 系统属性使用标签映射系统
- 模块化拆分（单文件 < 300 行）

**块式编辑器实现**
- 完成 BlockEditor 主框架
- 支持 7 种块类型（paragraph, heading, list, quote, code, yaml, divider）
- Notion 风格交互（单手柄 + 弹出菜单）
- 块拖拽排序

**数据块编辑器**
- YAML 数据可视化编辑
- 字段选择器（分类、搜索、刷新）
- 固定字段系统（type, id, status, title, createdAt, updatedAt）
- 字段图标显示
- 同步数据结构功能（纯前端）

**数据模板系统**
- 后端模板服务（CRUD）
- 设置页面管理
- 存为模板 / 从模板创建

**编辑器完善**
- 底部状态栏固定
- 保存功能（Cmd+S）
- 保存状态指示

### 2026-01-03 v1.0 - 初稿

- 完成整体架构设计
- 定义三条不可违背原则（Iron Rules）
- 确定 Key/Label 分离模型
- 规范插件组件失效策略
- 设计属性组件库接口
