# Phase 3.7: YAML 语义化编辑系统

## 核心目标

将 Markdown 文档中的 YAML 代码块转换为**可视化表单**，让不会写代码的用户也能直观地编辑结构化数据。

## 问题分析

### 当前痛点

```yaml
# 用户看到的是这样的代码，会感到恐惧
type: client
id: client-zhongxin
status: active
title: 中信出版社
category: 北京出版社
rating: 3
address: 北京市朝阳区惠新东街甲4号富盛大厦2座10层
invoiceType: 增值税专用发票
```

### 理想状态

用户看到的应该是：

```
┌─────────────────────────────────────────────────┐
│  🏢 客户信息                          [展开/收起] │
├─────────────────────────────────────────────────┤
│  类型     │ 客户                    [只读]       │
│  编号     │ client-zhongxin         [只读]       │
│  状态     │ ● 激活 ○ 草稿 ○ 归档      [单选]       │
│  名称     │ [中信出版社            ] [文本]       │
│  分类     │ [北京出版社        ▼]    [下拉]       │
│  评级     │ ★★★☆☆                  [星级]       │
│  地址     │ [北京市朝阳区...]        [文本]       │
│  发票类型 │ [增值税专用发票  ▼]      [下拉]       │
└─────────────────────────────────────────────────┘
```

## 架构设计

```
┌────────────────────────────────────────────────────────────┐
│                     SmartDocEditor                          │
├────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │  固定键区域 (FixedKeySection)                        │   │
│  │  version | document_type | author | created | atlas  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  内容区域 (ContentSection)                           │   │
│  │                                                      │   │
│  │  # 标题 {#anchor}                                    │   │
│  │                                                      │   │
│  │  ┌──────────────────────────────────────────────┐   │   │
│  │  │  🔧 YAML Block → SemanticYamlEditor          │   │   │
│  │  │  ┌────────────────────────────────────────┐  │   │   │
│  │  │  │  字段1: [输入框]                        │  │   │   │
│  │  │  │  字段2: [下拉框]                        │  │   │   │
│  │  │  │  字段3: [开关]                          │  │   │   │
│  │  │  └────────────────────────────────────────┘  │   │   │
│  │  └──────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  人类可读内容（Markdown 富文本）                      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## 字段类型推断

### 自动推断规则

| YAML 值类型 | 推断的控件 | 示例 |
|------------|-----------|------|
| `status: active` | 状态选择器 | ● 激活 ○ 草稿 |
| `rating: 3` | 星级评分 | ★★★☆☆ |
| `emails: [...]` | 标签列表 | [邮箱1] [邮箱2] [+] |
| `visible: true` | 开关 | 🔘 开启 |
| `date: 2025-01-01` | 日期选择 | 📅 2025-01-01 |
| `color: #8B5CF6` | 颜色选择 | 🎨 ■ |
| `ref: "path#anchor"` | 链接选择 | 🔗 选择文档... |
| `category: xxx` | 下拉选择 | [选项1 ▼] |
| 长文本 | 多行文本框 | [文本域] |
| 普通字符串 | 单行输入框 | [输入框] |

### Schema 增强（可选）

```yaml
# 在 .atlas/schemas/client.yaml 中定义
type: client
fields:
  status:
    type: enum
    options: [active, draft, archived]
    labels: [激活, 草稿, 归档]
  rating:
    type: rating
    max: 5
  category:
    type: ref
    source: categories
  invoiceType:
    type: enum
    options: [增值税专用发票, 增值税普通发票, 无需发票]
```

## 实现步骤

### Phase 3.7.1: 基础组件

1. **SemanticYamlEditor** - 核心组件
   - 解析 YAML 对象
   - 根据字段类型选择控件
   - 实时同步回 YAML 字符串

2. **字段控件库**
   - `TextField` - 文本输入
   - `SelectField` - 下拉选择
   - `StatusField` - 状态选择
   - `RatingField` - 星级评分
   - `SwitchField` - 开关
   - `DateField` - 日期选择
   - `TagsField` - 标签列表
   - `RefField` - 文档引用

3. **类型推断器**
   - `inferFieldType(key, value)` - 根据键名和值推断类型
   - 支持 Schema 覆盖

### Phase 3.7.2: 集成到编辑器

1. **BlockRenderer 改造**
   - 检测 YAML 代码块
   - 编辑模式渲染 SemanticYamlEditor
   - 阅读模式渲染美化视图

2. **双向同步**
   - 表单变更 → 更新 YAML 字符串
   - YAML 变更 → 更新表单状态

### Phase 3.7.3: 高级功能

1. **Schema 系统**
   - `.atlas/schemas/` 目录
   - 根据 `type` 字段加载 Schema
   - 验证和自动补全

2. **关联查询**
   - `ref` 类型字段支持搜索文档
   - 自动解析显示名称

## 关键文件

```
frontend/src/components/editor/
├── semantic-yaml/
│   ├── SemanticYamlEditor.tsx    # 主编辑器
│   ├── FieldRenderer.tsx         # 字段渲染分发
│   ├── fields/
│   │   ├── TextField.tsx
│   │   ├── SelectField.tsx
│   │   ├── StatusField.tsx
│   │   ├── RatingField.tsx
│   │   ├── SwitchField.tsx
│   │   ├── DateField.tsx
│   │   ├── TagsField.tsx
│   │   └── RefField.tsx
│   ├── type-inference.ts         # 类型推断逻辑
│   └── index.ts
```

## 用户体验目标

1. **零学习成本** - 用户无需了解 YAML 语法
2. **即时反馈** - 修改立即可见
3. **错误预防** - 类型约束避免错误输入
4. **渐进增强** - 高级用户仍可切换到原始 YAML

## 开发优先级

1. ⭐⭐⭐ TextField, SelectField, StatusField（覆盖 80% 场景）
2. ⭐⭐ SwitchField, RatingField, DateField
3. ⭐ TagsField, RefField, ColorField

