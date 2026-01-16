# ADL Spec v0.3

**Atlas Document Language 规范 · 第三版（收敛版）**

> Phase 3.0: 形态与语言收敛期
> 
> 本规范的目标是将 ADL 从"能用"升级为"好用、稳定、可预测"。
> 不再增加新特性，而是明确边界、禁止歧义、冻结核心语法。

---

## 0. 版本说明

| 版本 | 阶段 | 重点 |
|------|------|------|
| v1.0 | Phase 0 | 语言定义、基本语法 |
| v1.1 | Phase 1 | Query 语言、Proposal 闭环 |
| **v0.3** | **Phase 3** | **语义分层、语法冻结、禁止写法** |

v0.3 的版本号有意低于 v1.x，表示这是一次"收敛"而非"扩展"。

---

## 1. 语义分层（Semantic Layers）

ADL 的字段被组织为四个明确的语义层级。每一层有不同的职责和约束。

```
ADL 语义分层
├─ Structural Layer（结构层）
│  └─ heading / anchor / block / frontmatter
│
├─ Semantic Layer（语义层）
│  └─ type / id / status / title / category / role
│
├─ Presentation Layer（显现层）
│  └─ $display / color / icon / layout_hint
│
└─ Operational Layer（操作层）
   └─ $constraints / editable / readonly / lifecycle
```

### 1.1 结构层（Structural Layer）

**定义文档的物理结构，由解析器直接处理。**

| 元素 | 说明 | 来源 |
|------|------|------|
| `heading` | Block 标题文本 | Markdown 标题行 |
| `anchor` | Block 稳定定位标识 | `{#anchor}` 语法 |
| `level` | 标题级别 (1-6) | `#` 数量 |
| `frontmatter` | 文档元数据 | YAML frontmatter |
| `body` | 人类叙述区 | Markdown 正文 |

**规则**：
- 结构层元素由解析器自动提取，不在 Machine Block 中定义
- `anchor` 一旦创建，永不可变
- `heading` 和 `body` 可自由编辑

### 1.2 语义层（Semantic Layer）

**定义 Block 的业务含义，是 ADL 的核心。**

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `type` | ✅ | string | Block 类型，决定渲染方式 |
| `id` | ✅ | string | 业务标识，同类型内唯一 |
| `status` | ✅ | enum | 状态：active / draft / archived |
| `title` | ✅ | string | 显示标题 |
| `category` | ❌ | ref | 所属分类的引用 |
| `role` | ❌ | string | 对象角色（如 primary / secondary） |
| `description` | ❌ | string | 简短描述 |

**规则**：
- 必填字段缺失时，解析器必须报错
- `type` 必须是已注册的类型（见 2.1）
- `status` 只能是三个值之一

### 1.3 显现层（Presentation Layer）

**定义 Block 的视觉呈现，给渲染器的指令。**

| 字段 | 说明 | 示例 |
|------|------|------|
| `$display.color` | 主色引用 | `{ token: color.brand.primary }` |
| `$display.icon` | 图标引用 | `{ token: icon.general.palette }` |
| `$display.bgColor` | 背景色引用 | `{ token: color.status.active.bg }` |
| `$display.layout` | 布局提示 | `card` / `row` / `grid` |

**规则**：
- 显现层字段以 `$display` 命名空间组织
- 所有颜色/图标必须使用 Token 引用，禁止字面量
- 显现层不影响业务逻辑，只影响渲染

### 1.4 操作层（Operational Layer）

**定义 Block 的行为约束，给编辑器的指令。**

| 字段 | 说明 | 示例 |
|------|------|------|
| `$constraints.editable` | 可编辑字段列表 | `[status, title, price]` |
| `$constraints.readonly` | 只读字段列表 | `[type, id]` |
| `$constraints.required` | 必填字段列表 | `[title, status]` |
| `$constraints.lifecycle` | 生命周期规则 | `draft → active → archived` |

**规则**：
- 操作层字段以 `$constraints` 命名空间组织
- 约束在 Proposal 校验时强制执行
- 违反约束的变更必须被拒绝

---

## 2. 类型系统（Type System）

### 2.1 内置类型

ADL v0.3 定义以下内置类型：

| 类型 | 说明 | 核心字段 |
|------|------|---------|
| `service` | 服务定义 | price, category |
| `category` | 分类定义 | $display |
| `contact` | 联系人 | name, email, role |
| `project` | 项目 | client, services, timeline |
| `event` | 事件记录 | timestamp, actor |
| `token_group` | Token 定义组 | tokens |
| `principal` | 登录主体 | display_name, identity, profiles |
| `profile` | 业务档案 | profile_type, principal_ref |
| `registry` | 类型注册表 | registry_type, types |
| `client` | 客户 | address, category, rating |

#### Principal（登录主体）

Principal 是系统中的统一登录身份，一个人对应一个 Principal。

```yaml
type: principal
id: u-wang
display_name: 王编辑
status: active

identity:
  emails: ["wang@example.com"]
  phones: ["138-0000-0001"]
  avatar: { token: avatar.default }
  handles:
    wechat: wang_editor

profiles:
  - { ref: "#p-employee-u-wang" }
  - { ref: "#p-client-contact-u-wang" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `display_name` | ✅ | string | 显示名称 |
| `identity` | ✅ | object | 身份信息（emails, phones, avatar, handles） |
| `profiles` | ❌ | array | 关联的业务档案引用列表 |

#### Profile（业务档案）

Profile 是 Principal 在特定业务语境下的身份投影。一个 Principal 可以有多个 Profile。

```yaml
type: profile
profile_type: employee
id: p-employee-u-wang
principal_ref: { ref: "#u-wang" }
status: active

employee:
  employee_no: DHS-0001
  department: 设计部
  title: 创意总监

$display:
  color: { token: color.status.active }
  icon: { token: icon.general.user }
```

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `profile_type` | ✅ | string | 档案类型（employee, client_contact 等） |
| `principal_ref` | ✅ | ref | 所属 Principal 的引用 |

**Profile Types（档案类型）**:
- `employee` - 员工档案，包含 employee_no, department, title
- `client_contact` - 客户联系人档案，包含 client_ref, role_title

#### Registry（类型注册表）

Registry 用于定义和管理 Profile Types 等可扩展类型。

```yaml
type: registry
registry_type: profile_types
id: profile-type-registry
title: Profile 类型注册表
status: active

types:
  employee:
    title: 员工档案
    required_fields: [principal_ref, employee.employee_no]
  client_contact:
    title: 客户联系人档案
    required_fields: [principal_ref, client_ref]
```

| 字段 | 必填 | 类型 | 说明 |
|------|------|------|------|
| `registry_type` | ✅ | string | 注册表类型（profile_types 等） |
| `types` | ✅ | object | 类型定义映射 |

### 2.2 自定义类型

用户可以通过 `genesis/types.md` 定义新类型：

```yaml
type: type_definition
id: invoice
title: 发票
extends: null
fields:
  - name: amount
    type: number
    required: true
  - name: due_date
    type: date
    required: true
  - name: paid
    type: boolean
    default: false
```

### 2.3 类型约束

每个类型可以定义：
- 必填字段
- 字段类型
- 默认值
- 验证规则

---

## 3. 字段分类（Field Classification）

### 3.1 必填字段

所有 Block 必须包含：

```yaml
type: string      # Block 类型
id: string        # 业务标识
status: enum      # active | draft | archived
title: string     # 显示标题
```

缺少任何一个必填字段，解析器必须报错。

### 3.2 可选字段

业务相关的可选字段：

```yaml
category: ref        # 分类引用
description: string  # 描述
price: object        # 价格信息
tags: array          # 标签列表
refs: object         # 关联引用
```

### 3.3 系统保留字段

以 `$` 开头的字段为系统保留：

| 命名空间 | 说明 |
|---------|------|
| `$display` | 显现提示 |
| `$constraints` | 操作约束 |
| `$meta` | 元数据（系统生成） |
| `$computed` | 计算字段（只读） |

**规则**：
- 用户不得自定义 `$` 开头的字段
- 系统保留字段有特殊处理逻辑

### 3.4 禁止的写法

以下写法在 ADL v0.3 中明确禁止：

| 禁止写法 | 原因 | 正确写法 |
|---------|------|---------|
| 任意深度嵌套 | 不可预测 | 最多 2 层嵌套 |
| 动态字段名 | 无法校验 | 使用固定字段名 |
| 字面量颜色 | 无语义 | 使用 Token 引用 |
| 字面量图标 | 无语义 | 使用 Token 引用 |
| 裸字符串引用 | 类型不明 | 使用 `{ ref: "#anchor" }` |
| 计算表达式 | 副作用 | 在应用层计算 |

---

## 4. 引用语法（Reference Syntax）

### 4.1 Token 引用

引用 Design Token 系统中的语义值：

```yaml
$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.palette }
```

**规则**：
- Token 路径必须存在于 `genesis/tokens.md`
- 未定义的 Token 必须报错
- 不允许 fallback 到字面量

### 4.2 Anchor 引用

引用其他 Block：

```yaml
category: { ref: "#cat-brand-design" }
related:
  - { ref: "#svc-S-002" }
  - { ref: "#svc-S-003" }
```

**规则**：
- 引用的 Anchor 必须存在
- 可以跨文档引用
- 引用目标删除时必须报错

### 4.3 外部引用

引用外部资源（保留，暂不实现）：

```yaml
external: { url: "https://example.com/doc" }
```

---

## 5. Block 语法规范

### 5.1 完整示例

```markdown
### S-001 品牌VI设计 {#svc-S-001}

```yaml
# === 语义层（必填） ===
type: service
id: S-001
status: active
title: 品牌VI设计

# === 语义层（可选） ===
category: { ref: "#cat-brand-design" }
description: 完整的视觉识别体系设计
price:
  base: 50000
  unit: 项目
  currency: CNY

# === 显现层 ===
$display:
  color: { token: color.type.service }
  icon: { token: icon.type.service }

# === 操作层 ===
$constraints:
  editable: [status, title, price, description]
  readonly: [type, id]
```

品牌VI设计是我们的核心服务，包含 Logo 设计、色彩系统、字体规范等。
```

### 5.2 最小有效 Block

```markdown
### 示例 {#example}

```yaml
type: note
id: example
status: draft
title: 示例
```
```

### 5.3 解析规则

1. **Heading 解析**：`### Title {#anchor}` 格式
2. **YAML 提取**：` ```yaml ` 到 ` ``` ` 之间的内容
3. **Body 提取**：YAML 块之后到下一个 Block 之前的内容
4. **必填校验**：type, id, status, title 必须存在

---

## 6. Frontmatter 规范

### 6.1 必填字段

```yaml
---
version: "1.0"
document_type: facts | templates | staging | ledger
created: 2025-01-01
author: string
---
```

### 6.2 可选字段

```yaml
---
# ... 必填字段 ...
updated: 2025-01-15
tags: [design, brand]
visibility: public | internal | private
---
```

---

## 7. 错误定义

### 7.1 解析错误

| 错误码 | 说明 | 示例 |
|--------|------|------|
| `E001` | 缺少必填字段 | "Block #svc-S-001 missing required field: status" |
| `E002` | 无效的类型 | "Unknown type: 'servcie' (did you mean 'service'?)" |
| `E003` | 无效的状态值 | "Invalid status: 'actve' (must be active/draft/archived)" |
| `E004` | 重复的 Anchor | "Duplicate anchor: #svc-S-001" |
| `E005` | 重复的 ID | "Duplicate id 'S-001' for type 'service'" |

### 7.2 引用错误

| 错误码 | 说明 | 示例 |
|--------|------|------|
| `E101` | Token 不存在 | "Token 'color.brand.invalid' not found" |
| `E102` | Anchor 不存在 | "Referenced anchor '#svc-XXXX' not found" |
| `E103` | 循环引用 | "Circular reference detected: A → B → A" |

### 7.3 约束错误

| 错误码 | 说明 | 示例 |
|--------|------|------|
| `E201` | 只读字段变更 | "Cannot modify readonly field: type" |
| `E202` | 必填字段删除 | "Cannot delete required field: title" |
| `E203` | 类型不匹配 | "Field 'price.base' must be number, got string" |

---

## 8. 兼容性说明

### 8.1 向后兼容

v0.3 与 v1.0/v1.1 的主要变化：

| 变化 | v1.x 写法 | v0.3 写法 |
|------|----------|----------|
| 颜色 | `color: "#8B5CF6"` | `$display.color: { token: ... }` |
| 图标 | `icon: palette` | `$display.icon: { token: ... }` |
| 引用 | `category: cat-xxx` | `category: { ref: "#cat-xxx" }` |

### 8.2 迁移指南

1. 将字面量颜色/图标替换为 Token 引用
2. 将裸字符串引用替换为 `{ ref: "#anchor" }` 格式
3. 添加 `$display` 命名空间组织显现字段
4. 运行 `POST /api/adl/validate` 检查合规性

---

## 9. 附录

### A. 保留字列表

以下字符串不能用作 type 或 id：

```
block, document, anchor, heading, body, frontmatter,
type, id, status, title, null, true, false,
$display, $constraints, $meta, $computed
```

### B. Anchor 命名规范

```
{type-prefix}-{identifier}
```

| 类型 | 前缀 | 示例 |
|------|------|------|
| service | svc | svc-S-001 |
| category | cat | cat-brand-design |
| contact | con | con-zhang-san |
| project | prj | prj-P-001 |
| event | evt | evt-2025-01-01 |
| principal | u | u-wang |
| profile | p | p-employee-u-wang |
| registry | reg | reg-profile-types |
| client | client | client-zhongxin |

### C. 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.3.1 | 2025-01-01 | 新增 principal/profile/registry/client 类型 |
| v0.3 | 2025-01-01 | 语义分层、字段分类、禁止写法 |
| v1.1 | 2024-12-01 | Query 语言、Proposal reason |
| v1.0 | 2024-11-01 | 初始规范 |

---

**文档结束**

> 本规范的核心原则：
> 
> **ADL 的价值不在于"它能描述多少"，而在于"它禁止描述什么"。**

