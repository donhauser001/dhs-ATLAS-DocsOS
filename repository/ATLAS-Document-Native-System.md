---
slug: doc-jw1szi
---
# ATLAS Runtime

**ADL 语言的运行环境**

---

## 0. 范式三件套

```
DNCC（范式）    文档原生认知协作范式
    ↓
ADL（语言）     Atlas Document Language
    ↓
ATLAS（运行时） ADL 的运行环境
```

### 三句话定义

1. **ADL（Atlas Document Language）** 是一种描述「文档即系统」的语言。
2. **ATLAS** 是 ADL 的运行环境（Runtime），负责解析、执行与协作。
3. **任何正确实现 ADL 的运行环境，都是 ATLAS Runtime 的一种实现。**

---

## 1. 核心定位

### ATLAS 不是产品，是 Runtime

如果 ADL 是一种语言，那么 ATLAS 不是产品，而是它的**运行环境（Runtime）**。

这不是比喻，这是系统分层上的精确定义：

| 语言体系 | 语言 | 运行环境 |
|----------|------|----------|
| Web | HTML / CSS | Browser |
| 程序 | Python | Python VM |
| 数据 | SQL | Database Engine |
| 基础设施 | HCL | Terraform Runtime |
| **文档即系统** | **ADL** | **ATLAS Runtime** |

### Runtime 的职责边界

ATLAS 作为 Runtime：

- ❌ 不定义「你要写什么」
- ❌ 不定义「业务长什么样」
- ✅ 只负责：解析、执行、约束、投射、协作

**判断标准**：「这是否属于 Runtime 该做的事？」如果答案是否定的，就不该进 ATLAS。

---

## 2. Runtime 的六大模块

```
ATLAS Runtime
├── Parser          解析器
├── Validator       验证器
├── Renderer        投射器
├── Executor        执行器
├── Collaboration   协作引擎
└── Cognitive       认知沙箱
```

---

### 2.1 Parser（解析器）

**职责**：将 ADL 文档解析为可操作的结构

- 解析 Markdown 文本
- 识别 Block / Anchor / Machine Zone
- 构建 ADL AST（抽象语法树）
- 提取 Type、Refs、Permissions

**类比**：HTML Parser / SQL Parser

```
ADL Document → Parser → ADL AST
```

---

### 2.2 Validator（验证器）

**职责**：确保文档符合 ADL 规范和业务约束

- 校验 Machine Zone 是否符合 Type Schema
- 校验引用完整性（Refs 指向的 Anchor 是否存在）
- 校验状态机约束（状态转换是否合法）
- 校验权限约束

**类比**：Type Checker / Schema Validator

```
ADL AST → Validator → Valid / Errors
```

---

### 2.3 Renderer（投射器）

**职责**：将 ADL 结构投射为用户界面

- Block → UI 面板 / 卡片
- 字段 → 控件（输入框、下拉框、标签等）
- 目录结构 → 导航与布局
- 交互模式切换（Read / Edit / Action）

**类比**：Browser Layout Engine

```
ADL AST → Renderer → UI
```

**核心原则**：

> UI 不是设计出来的，而是从文档结构中被投射出来的。
> 改变文档结构，即改变界面结构。

---

### 2.4 Executor（执行器）

**职责**：执行对文档的变更操作

- 执行 ADL-Write Proposal
- 应用 Patch 到目标 Block
- 生成 Git Commit（原子性保证）
- 处理冲突检测与回滚

**类比**：Transaction Engine

```
Proposal → Executor → Git Commit
```

**核心原则**：

> 所有变更必须可追溯、可否决、可回滚。

---

### 2.5 Collaboration Engine（协作引擎）

**职责**：管理人类与 AI 之间的协作

- Chat-as-Workspace（聊天室即工作空间）
- 事件流管理
- @Human / @AI 的上下文注入
- Proposal 审批流程
- 共识沉淀（聊天 → 文档）

**类比**：Message Loop / Event System

```
Chat → Collaboration → Proposal → Document
```

**核心原则**：

> 聊天是协作入口，文档是事实终点。
> @ 不是调用功能，而是邀请一个认知角色进入当前语境。

---

### 2.6 Cognitive Sandbox（认知沙箱）

**职责**：为每个用户（人类 / AI）提供受限的认知视图

- 控制 Read 边界（可读范围）
- 控制 Think 边界（可推理范围）
- 控制 Act 边界（可执行操作）
- 控制 Write 边界（可写入范围，仅限 staging）

**这是 AI 时代 Runtime 独有的模块。**

```
User → Cognitive Sandbox → Filtered ADL View
```

**核心原则**：

> 不在 read 列表中的文件，对该用户并不存在。
> AI 是 Runtime 中的一个「执行体（Agent）」，不是插件或 API。

---

## 3. 为什么必须是 Runtime

### 3.1 为什么 ATLAS 不应该有「后台配置」

**因为**：Runtime 不应该有「业务设置」，就像浏览器不该有「网页结构设置」。

业务存在于 ADL 文档中，而不是 ATLAS 本身。

---

### 3.2 为什么 ATLAS 可以极度通用却不空洞

**因为**：

- 语言负责表达世界
- Runtime 负责让世界「发生」

ATLAS 的通用性，来自它**不碰语义，只碰结构与行为规则**。

---

### 3.3 为什么 AI 必须是 Runtime 的一等公民

在传统系统里：
- AI 是插件
- AI 是 API
- AI 是外挂

在 ATLAS 中：

> **AI 是 Runtime 中的一个「执行体（Agent）」。**

就像：
- 浏览器里有 JS 引擎
- 数据库里有 Query Planner

ATLAS Runtime 中：
- 有 Human Agent
- 有 AI Agent

**ADL 是它们共同理解的「字节码 / AST」。**

---

## 4. Runtime 不做的事

ATLAS Runtime 严格不做以下事情：

| 禁止项 | 原因 |
|--------|------|
| 定义业务模型 | 业务在 ADL 文档中 |
| 持有独立状态 | 文档是唯一事实源 |
| 提供配置后台 | 配置即文档 |
| 直接写入 Facts | 必须通过 Proposal |
| 绕过 Validator | 所有变更必须校验 |
| 超越文档能力 | UI 不拥有额外能力 |

---

## 5. 多种 Runtime 实现

**ATLAS 可以有多个实现**，只要它们：

- ✅ 正确解析 ADL
- ✅ 正确执行 ADL-Write
- ✅ 正确遵守 ADL-Rules

它们就都是「合法实现」。

### 可能的实现形态

| 实现 | 特点 |
|------|------|
| **ATLAS Runtime**（官方） | 完整功能，Web UI |
| **Local Runtime** | 精简版，本地运行 |
| **Serverless Runtime** | 云原生，按需扩展 |
| **Headless Runtime** | 只给 AI 用，无 UI |
| **Embedded Runtime** | 嵌入其他应用 |

**这才是语言真正活起来的标志。**

---

## 6. 与其他系统的对比

```
HTML + Browser     →  Web
SQL  + Database    →  数据应用
HCL  + Terraform   →  基础设施即代码
ADL  + ATLAS       →  文档即系统
```

---

## 7. 不可破坏的设计约束

1. **任何功能不得绕过文档事实源**
2. **UI 不得持有独立业务状态**
3. **AI 永远不能直接写入事实源**
4. **所有变更必须可追溯、可否决**
5. **系统复杂度必须低于文档复杂度**
6. **Runtime 不定义业务，只执行语言**

---

## 8. 宣言

**ATLAS 是 ADL 的运行环境。**

它解析文档、验证约束、投射界面、执行变更、管理协作。

人与 AI 以 Agent 身份共存于同一个 Runtime 中，
共同阅读、理解、操作同一套 ADL 文档。

系统不拥有数据，只守护文档的秩序。
系统不定义业务，只让语言成为现实。

---

## 9. 结语

一旦你承认「ATLAS 是 Runtime」，很多困惑会自动消失。

你不需要再问：
- 「要不要做这个功能」
- 「算不算管理系统」
- 「会不会太抽象」

你只需要问一句：

> **「这是否属于 Runtime 该做的事？」**

如果答案是否定的，就不该进 ATLAS。

---

**END OF ATLAS RUNTIME SPECIFICATION**
