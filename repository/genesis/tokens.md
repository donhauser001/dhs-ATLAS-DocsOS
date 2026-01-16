---
version: "1.0"
document_type: facts
created: 2025-01-01T00:00:00.000Z
author: system
slug: doc-anfd5j
---

# Design Tokens

> Design Tokens 是 ATLAS 语义系统的基础。
> 所有视觉属性（颜色、图标、状态）都在这里定义。
> 
> 其他文档通过 `{ token: xxx }` 引用这些语义定义，
> 而不是直接写字面量值。

---

## Token 角色分类

Phase 3.0 将 Token 分为三类角色：

| 类型 | 示例 | 作用 |
|------|------|------|
| **Semantic Token** | `brand.primary` | 业务语义 - 表达品牌、业务概念 |
| **UI Role Token** | `block.header.bg` | 显现角色 - 定义 UI 组件的视觉属性 |
| **System Token** | `status.draft` | 状态语义 - 表达系统状态、类型 |

---

## 颜色系统

### 品牌色 {#color-brand}

```yaml
type: token_group
id: color.brand
status: active
title: 品牌色系统
tokens:
  primary:
    value: "#8B5CF6"
    description: 品牌主色 - 紫色
  secondary:
    value: "#3B82F6"
    description: 品牌辅色 - 蓝色
  accent:
    value: "#EC4899"
    description: 强调色 - 粉色
```

品牌色是整个视觉体系的核心。`primary` 用于主要交互元素，`secondary` 用于次要信息，`accent` 用于需要突出的内容。

---

### 状态色 {#color-status}

```yaml
type: token_group
id: color.status
status: active
title: 状态色系统
tokens:
  active:
    value: "#22C55E"
    bg: "#DCFCE7"
    text: "#166534"
    description: 激活/启用状态
  draft:
    value: "#F59E0B"
    bg: "#FEF3C7"
    text: "#92400E"
    description: 草稿/待定状态
  archived:
    value: "#64748B"
    bg: "#F1F5F9"
    text: "#475569"
    description: 归档/禁用状态
  error:
    value: "#EF4444"
    bg: "#FEE2E2"
    text: "#991B1B"
    description: 错误/危险状态
  info:
    value: "#3B82F6"
    bg: "#DBEAFE"
    text: "#1E40AF"
    description: 信息/提示状态
```

状态色用于表示对象的当前状态。每个状态包含三个变体：
- `value`: 主色（用于图标、边框）
- `bg`: 背景色（用于标签背景）
- `text`: 文字色（用于标签文字）

---

### 类型色 {#color-type}

```yaml
type: token_group
id: color.type
status: active
title: 类型色系统
tokens:
  service:
    value: "#3B82F6"
    bg: "#DBEAFE"
    text: "#1E40AF"
    description: 服务类型
  category:
    value: "#8B5CF6"
    bg: "#EDE9FE"
    text: "#6D28D9"
    description: 分类类型
  event:
    value: "#F97316"
    bg: "#FFEDD5"
    text: "#C2410C"
    description: 事件类型
  contact:
    value: "#06B6D4"
    bg: "#CFFAFE"
    text: "#0E7490"
    description: 联系人类型
  project:
    value: "#10B981"
    bg: "#D1FAE5"
    text: "#047857"
    description: 项目类型
  token_group:
    value: "#6366F1"
    bg: "#E0E7FF"
    text: "#4338CA"
    description: Token组类型
```

类型色用于区分不同业务类型的对象，帮助用户快速识别。

---

## 图标系统

### 通用图标 {#icon-general}

```yaml
type: token_group
id: icon.general
status: active
title: 通用图标
tokens:
  palette:
    lucide: Palette
    description: 调色板 - 用于设计相关
  monitor:
    lucide: Monitor
    description: 显示器 - 用于数字产品
  book:
    lucide: BookOpen
    description: 书本 - 用于出版/阅读
  building:
    lucide: Building2
    description: 建筑 - 用于公司/组织
  users:
    lucide: Users
    description: 用户组 - 用于团队/群组
  briefcase:
    lucide: Briefcase
    description: 公文包 - 用于项目/商务
  file:
    lucide: FileText
    description: 文件 - 用于文档
  folder:
    lucide: Folder
    description: 文件夹 - 用于分类
  settings:
    lucide: Settings
    description: 设置 - 用于配置
  user:
    lucide: User
    description: 用户 - 用于联系人
  calendar:
    lucide: Calendar
    description: 日历 - 用于日期/事件
  tag:
    lucide: Tag
    description: 标签 - 用于分类标记
  star:
    lucide: Star
    description: 星标 - 用于收藏/重要
  check:
    lucide: Check
    description: 勾选 - 用于完成状态
```

通用图标覆盖常见的 UI 场景，使用 Lucide Icons 库。

---

### 状态图标 {#icon-status}

```yaml
type: token_group
id: icon.status
status: active
title: 状态图标
tokens:
  active:
    lucide: CheckCircle
    description: 激活状态图标
  draft:
    lucide: PenLine
    description: 草稿状态图标
  archived:
    lucide: Archive
    description: 归档状态图标
  error:
    lucide: AlertCircle
    description: 错误状态图标
  info:
    lucide: Info
    description: 信息状态图标
```

状态图标与状态色配合使用，提供视觉一致性。

---

### 类型图标 {#icon-type}

```yaml
type: token_group
id: icon.type
status: active
title: 类型图标
tokens:
  service:
    lucide: Briefcase
    description: 服务类型图标
  category:
    lucide: FolderTree
    description: 分类类型图标
  event:
    lucide: CalendarDays
    description: 事件类型图标
  contact:
    lucide: Users
    description: 联系人类型图标
  project:
    lucide: LayoutGrid
    description: 项目类型图标
  token_group:
    lucide: Palette
    description: Token组类型图标
```

类型图标用于在列表和卡片中标识对象类型。

---

## 间距系统

### 基础间距 {#spacing-base}

```yaml
type: token_group
id: spacing
status: active
title: 间距系统
tokens:
  xs:
    value: "4px"
    tailwind: "1"
    description: 极小间距
  sm:
    value: "8px"
    tailwind: "2"
    description: 小间距
  md:
    value: "16px"
    tailwind: "4"
    description: 中等间距
  lg:
    value: "24px"
    tailwind: "6"
    description: 大间距
  xl:
    value: "32px"
    tailwind: "8"
    description: 极大间距
```

间距系统基于 4px 网格，与 Tailwind CSS 兼容。

---

## UI 角色 Token（Phase 3.0）

### Block 显现角色 {#ui-block}

```yaml
type: token_group
id: ui.block
status: active
title: Block 显现角色
role: ui_role
tokens:
  header.bg:
    value: "#F8FAFC"
    description: Block 头部背景色
  header.border:
    value: "#E2E8F0"
    description: Block 头部边框色
  body.bg:
    value: "#FFFFFF"
    description: Block 内容区背景色
  body.border:
    value: "#E2E8F0"
    description: Block 边框色
  hover.bg:
    value: "#F1F5F9"
    description: Block 悬停背景色
  selected.border:
    value: "#8B5CF6"
    description: Block 选中边框色
```

Block 显现角色定义了 Block 卡片的视觉属性，确保所有 Block 具有一致的外观。

---

### 字段显现角色 {#ui-field}

```yaml
type: token_group
id: ui.field
status: active
title: 字段显现角色
role: ui_role
tokens:
  label.color:
    value: "#64748B"
    description: 字段标签颜色
  value.color:
    value: "#1E293B"
    description: 字段值颜色
  input.bg:
    value: "#FFFFFF"
    description: 输入框背景色
  input.border:
    value: "#CBD5E1"
    description: 输入框边框色
  input.focus.border:
    value: "#8B5CF6"
    description: 输入框聚焦边框色
  readonly.bg:
    value: "#F8FAFC"
    description: 只读字段背景色
  changed.bg:
    value: "#FEF3C7"
    description: 已修改字段背景色
  changed.border:
    value: "#F59E0B"
    description: 已修改字段边框色
```

字段显现角色定义了表单字段的视觉属性，包括正常态、聚焦态、只读态和修改态。

---

### 导航显现角色 {#ui-nav}

```yaml
type: token_group
id: ui.nav
status: active
title: 导航显现角色
role: ui_role
tokens:
  sidebar.bg:
    value: "#1E293B"
    description: 侧边栏背景色
  sidebar.text:
    value: "#CBD5E1"
    description: 侧边栏文字色
  sidebar.active.bg:
    value: "#334155"
    description: 侧边栏激活项背景色
  sidebar.active.text:
    value: "#FFFFFF"
    description: 侧边栏激活项文字色
  breadcrumb.text:
    value: "#64748B"
    description: 面包屑文字色
  breadcrumb.separator:
    value: "#CBD5E1"
    description: 面包屑分隔符颜色
  breadcrumb.current:
    value: "#1E293B"
    description: 面包屑当前项颜色
```

导航显现角色定义了侧边栏和面包屑导航的视觉属性。

---

### Proposal 显现角色 {#ui-proposal}

```yaml
type: token_group
id: ui.proposal
status: active
title: Proposal 显现角色
role: ui_role
tokens:
  pending.bg:
    value: "#FEF3C7"
    description: 待审批 Proposal 背景色
  pending.border:
    value: "#F59E0B"
    description: 待审批 Proposal 边框色
  approved.bg:
    value: "#DCFCE7"
    description: 已批准 Proposal 背景色
  approved.border:
    value: "#22C55E"
    description: 已批准 Proposal 边框色
  rejected.bg:
    value: "#FEE2E2"
    description: 已拒绝 Proposal 背景色
  rejected.border:
    value: "#EF4444"
    description: 已拒绝 Proposal 边框色
  diff.added.bg:
    value: "#DCFCE7"
    description: Diff 新增内容背景色
  diff.removed.bg:
    value: "#FEE2E2"
    description: Diff 删除内容背景色
```

Proposal 显现角色定义了变更提案相关的视觉属性。

---

## 文档说明

本文档定义了 ATLAS 系统的所有 Design Tokens。

### 使用方式

在其他文档中，通过语义引用使用这些 tokens：

```yaml
$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.palette }
```

而不是直接写字面量：

```yaml
# 不推荐
color: "#8B5CF6"
icon: palette
```

### 新增 Token

1. 在对应的 token_group 中添加新条目
2. 运行 `POST /api/tokens/rebuild` 重建缓存
3. 其他文档可立即使用新 token


