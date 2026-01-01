---
# ============================================================
# Design Tokens 定义文档
# Phase 2.5: 语言与显现校正
# ============================================================
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# Design Tokens

> Design Tokens 是 ATLAS 语义系统的基础。
> 所有视觉属性（颜色、图标、状态）都在这里定义。
> 
> 其他文档通过 `{ token: xxx }` 引用这些语义定义，
> 而不是直接写字面量值。

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


