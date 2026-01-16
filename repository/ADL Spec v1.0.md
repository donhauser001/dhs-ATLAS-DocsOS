---
slug: doc-t3ltor
---
# ADL Spec v1.0

**Atlas Document Language 规范 · 第一版**

---

## 0. 语言定义

**ADL（Atlas Document Language）** 是一种以人类可读文档为载体、以结构化区块为基本单位、支持 AI 理解与操作的文档描述语言。

ADL 不是配置格式，不是数据交换协议，而是：

> **「文档原生系统」的通用描述语言**

### 范式三件套

```
DNCC（范式）    文档原生认知协作范式
    ↓
ADL（语言）     Atlas Document Language ← 本规范
    ↓
ATLAS（运行时） ADL 的运行环境
```

### 三句话定义

1. **ADL（Atlas Document Language）** 是一种描述「文档即系统」的语言。
2. **ATLAS** 是 ADL 的运行环境（Runtime），负责解析、执行与协作。
3. **任何正确实现 ADL 的运行环境，都是 ATLAS Runtime 的一种实现。**

### 核心定位

```
ADL = 结构语言 + 操作协议
```

- **结构语言**：描述文档中的事实、关系、约束
- **操作协议**：定义对文档的查询、变更、验证

### 语言与运行时的关系

| 语言体系 | 语言 | 运行环境 |
|----------|------|----------|
| Web | HTML / CSS | Browser |
| 程序 | Python | Python VM |
| 数据 | SQL | Database Engine |
| 基础设施 | HCL | Terraform Runtime |
| **文档即系统** | **ADL** | **ATLAS Runtime** |

ADL 是独立的语言规范。ATLAS 是 ADL 的运行环境（Runtime）。其他系统可以实现自己的 ADL Runtime。

---

## 1. 设计目标

ADL 必须同时满足以下六个目标：

| 目标 | 说明 |
|------|------|
| **Human-first** | 原生 Markdown 可读，不牺牲写作体验 |
| **Machine-parseable** | 结构区（Machine Zone）可 100% 稳定解析 |
| **AI-friendly** | 对象可检索、可定位、可微操作写入 |
| **Renderer-friendly** | 每个对象能被投射成 UI 组件 |
| **Git-native** | 变更最小化、冲突可控、可审计 |
| **No hidden state** | 任何业务事实必须在文档中显式存在 |

### 设计哲学

> **ADL 的价值，不在于「它能描述多少」，而在于「它禁止描述什么」。**

ADL 刻意不支持：
- ❌ 任意计算表达式
- ❌ 聚合函数（sum / avg / count）
- ❌ 跨文档副作用
- ❌ 隐式状态变更

---

## 2. 语言结构

ADL 由三个子语言组成：

```
ADL (Atlas Document Language)
├── ADL-Read    文档结构的描述语言
├── ADL-Write   文档变更的操作语言
└── ADL-Rules   文档约束的规则语言
```

**注**：ADL-Query（查询语言）计划在 v1.1 引入。

---

# Part I: ADL-Read

**文档结构的描述语言**

---

## 3. 文档层级

### 3.1 文档类型

ADL 定义四种文档类型：

| 类型 | 说明 | 可写者 |
|------|------|--------|
| **Facts** | 事实源文档，会被渲染、索引 | 人类（审批后）|
| **Templates** | 模板文档，用于生成 Facts | 人类 |
| **Staging** | 候选变更，等待审批 | AI / 人类 |
| **Ledger** | 审计记录，不可变 | 系统 |

### 3.2 单一事实源原则

```
索引、缓存、向量库、数据库 = 派生物
Facts 文档 = 唯一事实源
```

任何业务事实变更，必须最终回写到 Facts 文档。

---

## 4. Block（区块）

**Block 是 ADL 的基本单位。**

一个 Block 不是一个"段落"，而是一个**语义对象**。

### 4.1 Block 的四要素

每个 Block 必须具备：

| 要素 | 必填 | 说明 |
|------|------|------|
| **Heading** | ✅ | 标题，作为人类阅读入口 |
| **Anchor** | ✅ | 稳定定位标识，全局唯一 |
| **Machine Block** | ✅ | YAML 格式的机器区 |
| **Body** | ❌ | Markdown 格式的人类叙述区 |

### 4.2 Block 语法示例

```markdown
### S-001 品牌VI设计 {#svc-S-001}

```yaml
type: service
id: S-001
status: active
title: 品牌VI设计
category: cat-brand-design
price:
  base: 50000
  unit: 项目
refs:
  policy: pol-pricing-std
```

品牌VI设计是我们的核心服务，包含 Logo 设计、色彩系统、字体规范等完整视觉识别体系的建立。

服务周期通常为 4-6 周，根据项目复杂度可能调整。
```

### 4.3 Block 边界规则

Block 的边界由以下规则确定：

1. **起始**：带有 Anchor 的标题行
2. **结束**：下一个同级或更高级标题出现时

```markdown
### Block A {#block-a}        ← Block A 开始
...内容...

### Block B {#block-b}        ← Block A 结束，Block B 开始
...内容...

## 上级标题 {#parent}         ← Block B 结束
```

---

## 5. Anchor（锚点）

**Anchor 是 Block 的稳定地址。**

### 5.1 Anchor vs ID

| 属性 | Anchor | ID |
|------|--------|-----|
| 用途 | 系统定位 | 业务标识 |
| 唯一性 | 全局唯一 | 同类型内唯一 |
| 可变性 | **永不可变** | 可能变更 |
| 示例 | `svc-S-001` | `S-001` |

### 5.2 Anchor 命名规范

```
{prefix}-{identifier}
```

标准前缀：

| 前缀 | 类型 | 示例 |
|------|------|------|
| `svc-` | 服务 | `svc-S-001` |
| `cat-` | 分类 | `cat-brand-design` |
| `prj-` | 项目 | `prj-P-2025-001` |
| `tsk-` | 任务 | `tsk-001` |
| `ctr-` | 合同 | `ctr-C-2025-001` |
| `inv-` | 发票 | `inv-I-2025-001` |
| `usr-` | 人类用户 | `usr-Aiden` |
| `ai-` | AI 用户 | `ai-DesignAssistant` |
| `room-` | 聊天室 | `room-prj-P-2025-001` |
| `pol-` | 政策 | `pol-pricing-std` |
| `flow-` | 流程 | `flow-service-std` |
| `evt-` | 事件 | `evt-20250101-001` |

### 5.3 Anchor 语法

使用 Markdown 扩展的 Heading ID 语法：

```markdown
### 标题文本 {#anchor-id}
```

---

## 6. Machine Block（机器区）

**Machine Block 是 Block 中可被机器解析的结构化数据区。**

### 6.1 语法

使用 YAML fenced code block：

````markdown
```yaml
type: service
id: S-001
status: active
...
```
````

### 6.2 通用字段

所有 Machine Block 必须包含以下字段：

| 字段 | 必填 | 说明 |
|------|------|------|
| `type` | ✅ | 对象类型（枚举值） |
| `id` | ✅ | 业务标识（同类型内唯一） |
| `status` | ✅ | 状态（active / archived / draft） |
| `title` | ✅ | 显示标题 |

可选的通用字段：

| 字段 | 说明 |
|------|------|
| `refs` | 引用关系 |
| `permissions` | 权限声明 |
| `ui` | 渲染提示 |
| `meta` | 元数据 |

### 6.3 Machine Block 规则

1. **只写事实**：不允许写长篇解释，解释放在 Body
2. **可验证**：必须符合 Type Schema
3. **可操作**：每个字段路径可被精确定位和修改

---

## 7. Type 系统

ADL 不是无限自由的 Markdown。它必须有一个 **Type Map（类型字典）**。

### 7.1 核心类型（v1.0）

| type | 说明 |
|------|------|
| `service` | 服务条目 |
| `category` | 分类 |
| `project` | 项目 |
| `task` | 任务 |
| `contact` | 联系人 |
| `company` | 公司/客户主体 |
| `contract` | 合同 |
| `invoice` | 发票 |
| `policy` | 政策 |
| `workflow` | 流程 |
| `event` | 事件（append-only） |
| `chat_room` | 聊天室 |
| `user` | 人类用户 |
| `ai_user` | AI 用户 |

### 7.2 Type Map 本身也是文档

Type Map 应定义为一份可编辑、可演进的 ADL 文档。

---

## 8. Refs（引用系统）

**Refs 是 Block 之间的关系声明。**

### 8.1 引用语法

```yaml
refs:
  policy: pol-pricing-std          # 单一引用
  workflow: flow-service-std
  related:                         # 列表引用
    - svc-S-002
    - svc-S-003
```

### 8.2 引用完整性

系统必须验证：
- 被引用的 Anchor 是否存在
- 引用是否跨越了认知边界（如果有权限控制）

### 8.3 引用类型

| 类型 | 说明 |
|------|------|
| 单一引用 | `key: anchor` |
| 列表引用 | `key: [anchor1, anchor2]` |
| 嵌套引用 | `parent.child: anchor` |

---

## 9. Event（事件模型）

**事件是不可变的事实记录。**

### 9.1 事件 Block 示例

```markdown
#### 客户反馈 {#evt-20250101-001}

```yaml
type: event
id: EVT-20250101-001
event_type: client_feedback
at: 2025-01-01T10:30:00+08:00
by: usr-CU-001
target: tsk-001
payload:
  content: 字号偏小，希望更醒目
```

客户通过邮件反馈了对初稿的意见。
```

### 9.2 事件规则

1. **Append-only**：事件只能追加，不能修改或删除
2. **必填字段**：`event_type`, `at`, `by`
3. **后续处理**：用新事件补充，不修改旧事件

---

# Part II: ADL-Write

**文档变更的操作语言**

---

## 10. Proposal（提案）

**AI 和自动化流程只能通过 Proposal 修改文档。**

### 10.1 核心原则

```
AI 永远不能直接写入 Facts 文档。
```

正确流程：

```
AI 生成 Proposal
  → 系统验证结构与格式
  → 用户审阅并授权
  → 原子写入 Facts（Git Commit）
```

### 10.2 Proposal 结构

```json
{
  "proposal_id": "CH-000123",
  "proposed_by": "ai-DesignAssistant",
  "proposed_at": "2025-01-01T10:30:00+08:00",
  "context": {
    "room": "room-prj-P-2025-001",
    "reason": "客户反馈导致价格调整"
  },
  "ops": [
    {
      "op": "update_yaml",
      "file": "服务定价/服务清单.md",
      "anchor": "svc-S-001",
      "path": "price.base",
      "value": 60000
    }
  ]
}
```

### 10.3 Proposal 存储位置

```
.staging/proposals/CH-000123.json
```

---

## 11. Operations（操作集）

ADL-Write v1.0 支持以下操作：

### 11.1 `insert_block`

在指定位置插入新 Block。

```json
{
  "op": "insert_block",
  "file": "path/to/file.md",
  "after": "svc-S-001",
  "block": {
    "heading": "### S-002 新服务 {#svc-S-002}",
    "machine": {
      "type": "service",
      "id": "S-002",
      "status": "draft",
      "title": "新服务"
    },
    "body": "服务描述..."
  }
}
```

### 11.2 `update_yaml`

修改 Machine Block 中的字段值。

```json
{
  "op": "update_yaml",
  "file": "path/to/file.md",
  "anchor": "svc-S-001",
  "path": "price.base",
  "value": 60000
}
```

支持的 path 语法：
- 简单路径：`status`
- 嵌套路径：`price.base`
- 数组索引：`refs.related[0]`

### 11.3 `append_event`

追加事件 Block。

```json
{
  "op": "append_event",
  "file": "path/to/file.md",
  "after": "evt-20250101-001",
  "event": {
    "type": "event",
    "id": "EVT-20250101-002",
    "event_type": "status_change",
    "at": "2025-01-01T11:00:00+08:00",
    "by": "ai-DesignAssistant",
    "target": "tsk-001",
    "payload": {
      "from": "draft",
      "to": "in_progress"
    }
  }
}
```

### 11.4 `update_body`

修改 Block 的 Body 内容。

```json
{
  "op": "update_body",
  "file": "path/to/file.md",
  "anchor": "svc-S-001",
  "body": "新的服务描述内容..."
}
```

### 11.5 禁止的操作

以下操作在 v1.0 中**不允许**：

| 操作 | 原因 |
|------|------|
| `replace_document` | 粒度过大，不可审计 |
| `bulk_replace` | 批量替换易出错 |
| `delete_block` | 必须通过状态变更归档 |
| `modify_event` | 事件不可变 |

---

## 12. 原子性保证

### 12.1 单一 Proposal = 单一 Commit

一个 Proposal 的所有 ops 必须在**同一个 Git commit** 中原子执行。

### 12.2 失败回滚

如果任何 op 失败，整个 Proposal 回滚，不产生任何变更。

### 12.3 冲突检测

执行前必须检查：
- 目标文件是否被修改（基于 Git hash）
- 目标 Anchor 是否存在
- 目标路径是否有效

---

# Part III: ADL-Rules

**文档约束的规则语言**

---

## 13. Schema 约束

### 13.1 Type Schema 定义

每个 type 必须有对应的 Schema 定义：

```yaml
# type-schemas/service.schema.yml
type: object
required:
  - type
  - id
  - status
  - title
  - price

properties:
  type:
    const: service
  id:
    type: string
    pattern: "^S-\\d{3}$"
  status:
    enum: [active, archived, draft]
  title:
    type: string
    minLength: 1
  price:
    type: object
    required: [base, unit]
    properties:
      base:
        type: number
        minimum: 0
      unit:
        type: string
  category:
    type: string
    pattern: "^cat-"
  refs:
    type: object
```

### 13.2 Schema 验证时机

- 解析文档时
- 执行 Proposal 前
- 保存变更后

---

## 14. 状态机约束

### 14.1 状态转换定义

```yaml
# constraints/project-states.yml
state_machine:
  type: project
  field: status
  initial: draft
  transitions:
    draft:
      - active
      - cancelled
    active:
      - completed
      - on_hold
      - cancelled
    on_hold:
      - active
      - cancelled
    completed: []      # 终态
    cancelled: []      # 终态
```

### 14.2 状态约束规则

1. 只能按定义的路径转换
2. 终态不可变更
3. 每次转换必须产生 event

---

## 15. 引用完整性约束

### 15.1 引用存在性检查

```yaml
# constraints/refs-integrity.yml
refs_constraints:
  - type: service
    field: refs.policy
    must_exist: true
    target_type: policy
    
  - type: task
    field: refs.project
    must_exist: true
    target_type: project
```

### 15.2 级联规则

当被引用的 Block 状态变为 `archived` 时：
- 检查所有引用它的 Block
- 生成警告或阻止操作（取决于配置）

---

## 16. 权限约束

### 16.1 权限声明

在 Machine Block 中声明：

```yaml
permissions:
  read: [role:staff, role:client]
  propose: [role:staff, ai:*]
  approve: [role:manager]
```

### 16.2 权限类型

| 权限 | 说明 |
|------|------|
| `read` | 可读取该 Block |
| `propose` | 可提交变更提案 |
| `approve` | 可审批并执行提案 |

---

# Part IV: 认知版图

**AI 用户的能力边界定义**

---

## 17. AI 用户定义

```markdown
### 设计助理 {#ai-DesignAssistant}

```yaml
type: ai_user
id: AI-DesignAssistant
title: 设计助理
model: gpt-4
cognitive_map:
  read:
    - 服务定价/
    - projects/P-2025-001/
  think:
    - projects/P-2025-001/
  act:
    - insert_block
    - update_yaml
    - append_event
  write:
    - .staging/proposals/
```

设计助理负责协助项目执行过程中的文档维护和客户沟通记录。
```

### 17.1 认知版图字段

| 字段 | 说明 |
|------|------|
| `read` | 可读取的文件/目录 |
| `think` | 可进行推理的范围 |
| `act` | 可执行的操作类型 |
| `write` | 可写入的目录 |

### 17.2 认知边界原则

```
不在 read 列表中的文件，对该 AI 并不存在。
```

---

# Part V: 附录

---

## A. 完整 Block 示例

```markdown
### S-001 品牌VI设计 {#svc-S-001}

```yaml
type: service
id: S-001
status: active
title: 品牌VI设计
category: cat-brand-design
price:
  base: 50000
  unit: 项目
  currency: CNY
refs:
  policy: pol-pricing-std
  workflow: flow-service-std
  related:
    - svc-S-002
    - svc-S-003
permissions:
  read: [role:staff, role:client]
  propose: [role:staff, ai:*]
  approve: [role:manager]
ui:
  card: true
  fields:
    - key: price.base
      widget: money
    - key: status
      widget: badge
meta:
  created_at: 2025-01-01T00:00:00+08:00
  created_by: usr-Aiden
  updated_at: 2025-01-15T10:30:00+08:00
```

品牌VI设计是我们的核心服务，包含 Logo 设计、色彩系统、字体规范等完整视觉识别体系的建立。

#### 服务内容

- Logo 设计（3 套方案）
- 色彩系统定义
- 字体规范
- 基础应用规范

#### 交付周期

标准周期为 4-6 周，根据项目复杂度可能调整。
```

---

## B. 完整 Proposal 示例

```json
{
  "proposal_id": "CH-000123",
  "proposed_by": "ai-DesignAssistant",
  "proposed_at": "2025-01-15T14:30:00+08:00",
  "context": {
    "room": "room-prj-P-2025-001",
    "conversation_id": "conv-20250115-001",
    "reason": "根据客户反馈和市场调研，建议调整品牌VI设计服务价格"
  },
  "ops": [
    {
      "op": "update_yaml",
      "file": "服务定价/服务清单.md",
      "anchor": "svc-S-001",
      "path": "price.base",
      "value": 60000
    },
    {
      "op": "append_event",
      "file": "服务定价/服务清单.md",
      "after": "svc-S-001",
      "event": {
        "type": "event",
        "id": "EVT-20250115-001",
        "event_type": "price_change",
        "at": "2025-01-15T14:30:00+08:00",
        "by": "ai-DesignAssistant",
        "target": "svc-S-001",
        "payload": {
          "field": "price.base",
          "from": 50000,
          "to": 60000,
          "reason": "市场调研显示同类服务平均价格上涨"
        }
      }
    }
  ],
  "validation": {
    "schema_check": "pending",
    "refs_check": "pending",
    "permission_check": "pending"
  }
}
```

---

## C. 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2025-01-01 | 初始版本，包含 Read/Write/Rules |

---

## D. 规范路线图

| 版本 | 计划内容 |
|------|----------|
| v1.1 | ADL-Query（Filter / Select） |
| v1.2 | 跨文档引用完整性 |
| v2.0 | 工具链生态、IDE 支持 |

---

**END OF ADL SPEC v1.0**

