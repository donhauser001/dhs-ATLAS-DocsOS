# ATLAS Docs OS 系统设计文档

> A Git-Native, Document-Driven Operating System for Design Business

**版本**: v0.2  
**更新日期**: 2025-01-01  
**状态**: 概念设计阶段

---

## 一、系统概述

### 1.1 一句话定义

ATLAS Docs OS 是一个以 Git 为事实源、以文档为数据结构、以 Command 为操作核心的设计公司业务管理系统。

### 1.2 核心理念

```
文档即数据，目录即结构，提交即版本，Command 即能力。
```

- **文档即数据** — 所有业务数据以 Markdown + YAML 形式存储
- **目录即结构** — 项目是目录，不是数据库里的一行
- **提交即版本** — 每次保存是一次 Git commit，历史天然存在
- **Command 即能力** — 人和 AI 通过同一套 Command 操作系统

### 1.3 AI 原生设计原则

> **铁律：如果人能操作但 AI 不能操作，该功能视为失败。**

| 原则 | 说明 |
|-----|------|
| **AI 是一等公民** | AI 不是附加功能，而是系统的核心操作主体 |
| **Command 优先** | 先定义操作语义，再实现 AI 可调用能力，最后才封装 UI |
| **UI 是视图** | UI 只是状态的展示层，不拥有独占能力 |
| **状态机驱动** | 流程通过状态机 + 事件驱动，不依赖页面跳转 |
| **禁止假智能** | 不允许假进度条、假思考过程、事后拼装的 AI 对话 |

**自检问题**：
- "如果关掉所有 UI，AI 是否还能完成这件事？"
- "如果我是 AI 而不是人，我是否能完整、正确、无歧义地使用这个功能？"

### 1.4 目标用户

- 20 人以内的设计团队
- 内部业务协作（客户端只读，后期考虑）
- 非技术用户为主，通过表单操作
- AI Agent 作为团队成员参与协作

### 1.5 解决的问题

| 传统系统问题 | ATLAS 的解法 |
|-------------|-------------|
| 数据碎片化，散落各处 | 一个 Git 仓库，统一管理 |
| 字段贫瘠，缺乏上下文 | Markdown 承载完整语义 |
| 版本追溯困难 | Git 天然提供完整历史 |
| AI 难以理解业务 | 文档即上下文，直接可读 |
| AI 难以操作系统 | Command 层提供语义化操作 |
| 系统复杂，运维成本高 | 无数据库，极简部署 |

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     操作主体层                               │
│            Human (Browser UI)  ←→  AI Agent                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Command 层（核心）                        │
│  • 定义所有操作语义                                          │
│  • Human 和 AI 共用同一套 Command                            │
│  • 状态机驱动的流程控制                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Git Service                             │
│  • 文件读写                                                  │
│  • 自动 commit                                               │
│  • 用户认证                                                  │
│  • 定时 push 到远程                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Git Repository (本地)                        │
│              projects/ + workspace/                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ 定时 push (每小时)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Remote Repository                            │
│             GitHub / GitLab / 自建                           │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术 | 理由 |
|-----|------|-----|
| 前端 | React 18 + TypeScript | 生态丰富，shadcn/ui 原生支持 |
| UI 组件 | shadcn/ui（强制） | 唯一允许的 UI 系统 |
| 图标 | Lucide Icons（强制） | 禁止 Emoji |
| Markdown 渲染 | react-markdown + remark/rehype | 灵活可扩展 |
| 状态管理 | Zustand | 轻量、类型安全 |
| Git Service | Node.js + Express | 简单、团队熟悉 |
| Git 操作 | simple-git | 封装完善，不依赖系统命令 |
| 定时任务 | node-cron | 轻量可靠 |

### 2.3 UI 约束（强制）

| 约束 | 说明 |
|-----|------|
| 只用 shadcn/ui | 禁止自行封装类似组件体系 |
| 禁止魔改组件内部结构 | 保持组件语义完整 |
| 禁止 Emoji | 全项目禁止，用 Lucide Icons 替代 |
| 中文命名 | 文档、模板文件必须中文命名 |

---

## 三、Command 层设计

> **这是系统的核心层，Human 和 AI 通过 Command 操作系统，UI 只是 Command 的可视化封装。**

### 3.1 设计原则

```
开发顺序：定义操作语义 → 实现 AI 可调用能力 → UI 封装
```

- 每个 Command 必须有明确的语义
- 每个 Command 必须 AI 可调用
- UI 通过调用 Command 实现功能，不绕过 Command 直接操作

### 3.2 Command 定义格式

```yaml
# workspace/commands/项目.yml

commands:
  project.create:
    name: 创建项目
    description: 创建一个新的设计项目，生成项目目录结构和初始文件
    parameters:
      name:
        type: string
        required: true
        description: 项目名称
      client:
        type: string
        required: true
        description: 客户名称
      type:
        type: enum
        values: [branding, packaging, editorial, web, other]
        default: other
        description: 项目类型
      deadline:
        type: date
        required: false
        description: 截止日期
      budget:
        type: number
        required: false
        description: 项目预算（元）
      manager:
        type: string
        source: "@users"
        required: true
        description: 项目负责人
      team:
        type: array
        items: { type: string, source: "@users" }
        required: false
        description: 团队成员列表
    returns:
      project_id: { type: string, description: 项目ID }
      path: { type: string, description: 项目路径 }
    side_effects:
      - 创建项目目录结构
      - 生成 meta.yml 和 README.md
      - 创建 Git commit
    examples:
      - description: 创建品牌设计项目
        input:
          name: "某某品牌VI设计"
          client: "某某科技有限公司"
          type: "branding"
          deadline: "2025-03-15"
          budget: 50000
          manager: "zhangsan"
          team: ["zhangsan", "lisi"]
        output:
          project_id: "P-2025-0001"
          path: "projects/2025/P-2025-0001-某某科技有限公司-某某品牌VI设计"

  project.update:
    name: 更新项目
    description: 更新项目的元数据信息
    parameters:
      project_id:
        type: string
        required: true
        description: 项目ID
      updates:
        type: object
        description: 要更新的字段
        properties:
          name: { type: string }
          status: { type: enum, values: [pending, in_progress, completed, cancelled] }
          deadline: { type: date }
          budget: { type: number }
          team: { type: array, items: { type: string } }
    returns:
      success: { type: boolean }
      updated_fields: { type: array, items: { type: string } }

  project.list:
    name: 获取项目列表
    description: 获取所有项目或按条件筛选
    parameters:
      year:
        type: number
        required: false
        description: 按年份筛选
      status:
        type: enum
        values: [pending, in_progress, completed, cancelled]
        required: false
        description: 按状态筛选
      manager:
        type: string
        required: false
        description: 按负责人筛选
    returns:
      projects:
        type: array
        items:
          type: object
          properties:
            id: { type: string }
            name: { type: string }
            client: { type: string }
            status: { type: string }
            deadline: { type: date }

  project.get:
    name: 获取项目详情
    description: 获取单个项目的完整信息
    parameters:
      project_id:
        type: string
        required: true
        description: 项目ID
    returns:
      project:
        type: object
        description: 项目完整信息，包括 meta、任务统计等
```

### 3.3 任务相关 Command

```yaml
# workspace/commands/任务.yml

commands:
  task.create:
    name: 创建任务
    description: 为项目创建一个新任务
    parameters:
      project_id:
        type: string
        required: true
        description: 所属项目ID
      title:
        type: string
        required: true
        description: 任务标题
      assignee:
        type: string
        source: "@users"
        required: true
        description: 负责人
      priority:
        type: enum
        values: [low, medium, high]
        default: medium
        description: 优先级
      deadline:
        type: date
        required: false
        description: 截止日期
      description:
        type: string
        required: false
        description: 任务描述（支持 Markdown）
    returns:
      task_id: { type: string }
      path: { type: string }
    side_effects:
      - 创建任务文件
      - 创建 Git commit

  task.transition:
    name: 任务状态流转
    description: 触发任务状态变更（受状态机约束）
    parameters:
      task_id:
        type: string
        required: true
        description: 任务ID
      event:
        type: enum
        values: [start, pause, submit_review, approve, reject, reopen]
        required: true
        description: 状态流转事件
      comment:
        type: string
        required: false
        description: 流转备注
    returns:
      success: { type: boolean }
      from_status: { type: string }
      to_status: { type: string }
      error: { type: string, description: 如果流转失败，返回错误原因 }

  task.update:
    name: 更新任务
    description: 更新任务的非状态字段
    parameters:
      task_id:
        type: string
        required: true
      updates:
        type: object
        properties:
          title: { type: string }
          assignee: { type: string }
          priority: { type: enum, values: [low, medium, high] }
          deadline: { type: date }
          description: { type: string }
    returns:
      success: { type: boolean }

  task.list:
    name: 获取任务列表
    description: 获取项目的任务列表或全局任务
    parameters:
      project_id:
        type: string
        required: false
        description: 项目ID，不传则查全局
      status:
        type: enum
        values: [pending, in_progress, review, done]
        required: false
      assignee:
        type: string
        required: false
    returns:
      tasks: { type: array }

  task.get:
    name: 获取任务详情
    description: 获取单个任务的完整信息
    parameters:
      task_id:
        type: string
        required: true
    returns:
      task: { type: object }
```

### 3.4 Command 调用方式

#### HTTP API（供 UI 和外部调用）

```
POST /api/command
Content-Type: application/json

{
  "command": "project.create",
  "params": {
    "name": "某某品牌VI设计",
    "client": "某某科技有限公司",
    "type": "branding",
    "manager": "zhangsan"
  },
  "operator": {
    "type": "human",  // 或 "ai"
    "id": "zhangsan"
  }
}
```

#### 响应格式

```json
{
  "success": true,
  "result": {
    "project_id": "P-2025-0001",
    "path": "projects/2025/P-2025-0001-某某科技有限公司-某某品牌VI设计"
  },
  "commit": {
    "hash": "a1b2c3d",
    "message": "[新建项目] 某某品牌VI设计"
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "任务状态不允许从 'done' 流转到 'review'",
    "details": {
      "current_status": "done",
      "requested_event": "submit_review",
      "allowed_events": ["reopen"]
    }
  }
}
```

---

## 四、状态机设计

> **所有业务流程通过状态机驱动，禁止页面驱动流程。**

### 4.1 任务状态机

```yaml
# workspace/状态机/任务.yml

name: 任务状态机
initial: pending

states:
  pending:
    display: 待开始
    icon: Circle          # Lucide icon name
    color: gray
    transitions:
      - event: start
        target: in_progress
        description: 开始任务

  in_progress:
    display: 进行中
    icon: Play
    color: blue
    transitions:
      - event: submit_review
        target: review
        description: 提交审核
      - event: pause
        target: pending
        description: 暂停任务

  review:
    display: 待审核
    icon: Eye
    color: orange
    transitions:
      - event: approve
        target: done
        description: 审核通过
      - event: reject
        target: in_progress
        description: 审核驳回，返回修改

  done:
    display: 已完成
    icon: CheckCircle
    color: green
    transitions:
      - event: reopen
        target: in_progress
        description: 重新打开任务

# 状态流转可视化
#
#                    pause
#            ┌────────────────┐
#            ▼                │
#     ┌──────────┐     ┌──────┴─────┐     ┌──────────┐     ┌──────────┐
#     │ pending  │────▶│in_progress │────▶│  review  │────▶│   done   │
#     └──────────┘     └────────────┘     └──────────┘     └──────────┘
#        start           submit_review       approve           │
#                              ▲                │              │
#                              └────────────────┘              │
#                                   reject                     │
#                              ▲                               │
#                              └───────────────────────────────┘
#                                         reopen
```

### 4.2 项目状态机

```yaml
# workspace/状态机/项目.yml

name: 项目状态机
initial: pending

states:
  pending:
    display: 待启动
    icon: Clock
    color: gray
    transitions:
      - event: start
        target: in_progress
      - event: cancel
        target: cancelled
        guard: "no_tasks_in_progress"  # 只有没有进行中任务才能取消

  in_progress:
    display: 进行中
    icon: Loader
    color: blue
    transitions:
      - event: complete
        target: completed
        guard: "all_tasks_done"  # 所有任务完成才能结项
      - event: pause
        target: pending
      - event: cancel
        target: cancelled
        guard: "confirm_required"

  completed:
    display: 已完成
    icon: CheckCircle2
    color: green
    transitions:
      - event: reopen
        target: in_progress

  cancelled:
    display: 已取消
    icon: XCircle
    color: red
    transitions:
      - event: restore
        target: pending
```

### 4.3 提案状态机

```yaml
# workspace/状态机/提案.yml

name: 提案状态机
initial: draft

states:
  draft:
    display: 草稿
    icon: FileEdit
    color: gray
    transitions:
      - event: submit
        target: submitted

  submitted:
    display: 已提交
    icon: Send
    color: blue
    transitions:
      - event: approve
        target: approved
      - event: reject
        target: rejected
      - event: revise
        target: draft
        description: 撤回修改

  approved:
    display: 已通过
    icon: ThumbsUp
    color: green
    # 终态，无流转

  rejected:
    display: 已拒绝
    icon: ThumbsDown
    color: red
    transitions:
      - event: revise
        target: draft
        description: 修改后重新提交
```

### 4.4 状态机实现

```typescript
// 状态机引擎（简化版）
interface StateMachine {
  name: string;
  initial: string;
  states: Record<string, State>;
}

interface State {
  display: string;
  icon: string;
  color: string;
  transitions: Transition[];
}

interface Transition {
  event: string;
  target: string;
  guard?: string;
  description?: string;
}

class StateMachineEngine {
  constructor(private machine: StateMachine) {}

  canTransition(currentState: string, event: string): boolean {
    const state = this.machine.states[currentState];
    return state.transitions.some(t => t.event === event);
  }

  getAvailableEvents(currentState: string): string[] {
    const state = this.machine.states[currentState];
    return state.transitions.map(t => t.event);
  }

  transition(currentState: string, event: string): string | null {
    const state = this.machine.states[currentState];
    const trans = state.transitions.find(t => t.event === event);
    return trans ? trans.target : null;
  }
}
```

---

## 五、数据结构设计

### 5.1 仓库根目录结构

```
repository/
├── projects/                    # 所有项目
│   └── {year}/                  # 按年份分组
│       └── {project-id}/        # 单个项目目录
│
├── workspace/                   # 系统级文件
│   ├── auth/                    # 权限相关
│   │   └── users.json           # 用户列表
│   │
│   ├── commands/                # Command 定义
│   │   ├── 项目.yml
│   │   ├── 任务.yml
│   │   ├── 提案.yml
│   │   ├── 合同.yml
│   │   └── 财务.yml
│   │
│   ├── 状态机/                  # 状态机定义
│   │   ├── 项目.yml
│   │   ├── 任务.yml
│   │   └── 提案.yml
│   │
│   ├── 表单模板/                # 表单模板（中文命名）
│   │   ├── 项目.yml
│   │   ├── 任务.yml
│   │   ├── 提案.yml
│   │   ├── 合同.yml
│   │   └── 财务.yml
│   │
│   ├── index/                   # 索引文件（可选）
│   │   └── projects.yml
│   │
│   └── config.yml               # 系统配置
│
└── README.md                    # 仓库说明
```

### 5.2 项目目录结构

```
projects/2025/P-2025-0123-某某公司-品牌画册设计/
├── README.md                    # 项目概览（自动生成）
├── meta.yml                     # 项目元数据
│
├── 00_基础信息/                  # 基础信息（中文目录名）
│   └── 客户.md                  # 客户信息
│
├── 10_任务/                      # 任务管理
│   ├── T-001.md
│   ├── T-002.md
│   └── ...
│
├── 20_提案/                      # 提案管理
│   ├── P-001.md
│   └── ...
│
├── 30_合同/                      # 合同管理
│   ├── C-001.md
│   └── ...
│
├── 40_财务/                      # 财务记录
│   ├── 收入.csv                  # 收入记录
│   └── 记录.md                   # 财务说明
│
├── 50_成本/                      # 成本记录
│   └── 成本.csv
│
└── 附件/                         # 附件
    ├── 图片/
    └── 文档/
```

### 5.3 文档格式规范

#### 项目元数据 (`meta.yml`)

```yaml
id: P-2025-0123
name: 某某品牌画册设计
client: 某某公司
status: in_progress  # pending | in_progress | completed | cancelled
type: branding       # branding | packaging | editorial | web | other
created: 2025-01-15
deadline: 2025-03-15
budget: 50000
manager: zhangsan
team:
  - zhangsan
  - lisi
tags:
  - 画册
  - 品牌
```

#### 任务文档 (`10_任务/T-001.md`)

```markdown
---
id: T-001
title: 设计初稿
assignee: zhangsan
status: in_progress  # pending | in_progress | review | done
priority: high       # low | medium | high
deadline: 2025-02-15
created: 2025-01-15
updated: 2025-01-20
---

## 任务描述

完成品牌画册的初稿设计，包括：
- 封面设计
- 内页版式（3套方案）
- 配色方案

## 备注

客户偏好简约风格，参考之前沟通的 mood board。
```

#### 提案文档 (`20_提案/P-001.md`)

```markdown
---
id: P-001
title: 品牌画册设计方案
version: 1.0
status: submitted  # draft | submitted | approved | rejected
amount: 50000
submitted_at: 2025-01-20
---

## 项目背景

...

## 设计方案

...

## 报价明细

| 项目 | 单价 | 数量 | 小计 |
|-----|------|-----|------|
| 设计费 | 30000 | 1 | 30000 |
| 印刷费 | 100 | 200 | 20000 |

## 时间计划

...
```

#### 财务记录 (`40_财务/收入.csv`)

```csv
id,date,type,amount,description,invoice,status
F-001,2025-01-20,deposit,15000,首付款,INV-2025-001,received
F-002,2025-02-15,progress,20000,中期款,INV-2025-002,pending
```

---

## 六、表单模板系统

### 6.1 设计理念

- 用户通过表单输入数据
- 系统根据模板生成规范的 Markdown 文档
- 用户永远不直接编辑 Markdown 源码
- **表单模板同时生成 Command Schema**，AI 可直接调用

### 6.2 模板结构定义

```yaml
# workspace/表单模板/任务.yml

name: 任务
description: 项目任务管理
target_path: "10_任务/T-{seq:03d}.md"  # 生成路径模板
icon: ClipboardList                     # Lucide icon name
command: task.create                    # 关联的 Command

fields:
  - key: title
    label: 任务名称
    type: text
    required: true
    placeholder: "请输入任务名称"
    
  - key: assignee
    label: 负责人
    type: select
    required: true
    source: "@users"  # 从用户列表获取选项
    
  - key: status
    label: 状态
    type: radio
    required: true
    default: pending
    options:
      - value: pending
        label: 待开始
        icon: Circle
        color: gray
      - value: in_progress
        label: 进行中
        icon: Play
        color: blue
      - value: review
        label: 待审核
        icon: Eye
        color: orange
      - value: done
        label: 已完成
        icon: CheckCircle
        color: green
        
  - key: priority
    label: 优先级
    type: select
    default: medium
    options:
      - value: low
        label: 低
        icon: ArrowDown
      - value: medium
        label: 中
        icon: Minus
      - value: high
        label: 高
        icon: ArrowUp
        
  - key: deadline
    label: 截止日期
    type: date
    
  - key: description
    label: 任务描述
    type: richtext
    placeholder: "描述任务的具体内容和要求..."

# 自动填充字段（不在表单中显示）
auto_fields:
  - key: id
    value: "T-{seq:03d}"
  - key: created
    value: "{now:date}"
  - key: updated
    value: "{now:date}"
```

### 6.3 特殊字段类型

| 类型 | 说明 | 示例 |
|-----|------|-----|
| `text` | 单行文本 | 标题、名称 |
| `textarea` | 多行文本 | 简短描述 |
| `richtext` | 富文本（支持基础格式） | 详细描述 |
| `select` | 下拉选择 | 负责人、状态 |
| `radio` | 单选按钮 | 状态切换 |
| `checkbox` | 复选框 | 标签选择 |
| `date` | 日期选择器 | 截止日期 |
| `number` | 数字输入 | 金额、数量 |
| `file` | 文件上传 | 附件 |

### 6.4 数据源引用

模板中的 `source` 字段支持引用：

```yaml
source: "@users"           # 引用用户列表
source: "@projects"        # 引用项目列表
source: "@team"            # 引用当前项目的团队成员
source: "static:options"   # 静态选项（在 options 中定义）
```

---

## 七、API 设计

### 7.1 Command API（核心）

```
POST /api/command
     执行 Command
     Body: { command, params, operator }
     Response: { success, result, commit?, error? }

GET  /api/commands
     获取所有可用 Command 定义（供 AI 发现能力）

GET  /api/commands/{name}
     获取单个 Command 的完整 Schema
```

### 7.2 查询 API（只读）

```
GET  /api/projects
     获取项目列表
     Query: year, status, manager

GET  /api/projects/{id}
     获取项目详情

GET  /api/projects/{id}/tasks
     获取项目任务列表

GET  /api/tasks/{id}
     获取任务详情

GET  /api/state-machines
     获取所有状态机定义

GET  /api/state-machines/{name}
     获取单个状态机定义

GET  /api/templates
     获取所有表单模板

GET  /api/templates/{name}
     获取单个模板定义

GET  /api/users
     获取用户列表
```

### 7.3 文件 API（底层，谨慎暴露）

```
GET  /api/fs/read?path={path}
     读取单个文件

GET  /api/fs/list?path={path}&recursive={bool}
     列出目录内容

GET  /api/fs/tree?path={path}
     获取完整目录树
```

> **注意**：优先使用 Command API，文件 API 仅供调试或特殊场景。

### 7.4 自动 Commit 消息

```javascript
// 根据 Command 自动生成 commit message
const messageTemplates = {
  'project.create': '[新建项目] {name}',
  'project.update': '[更新项目] {name}',
  'task.create': '[新建任务] {project_name} / {title}',
  'task.transition': '[任务流转] {project_name} / {title}: {from_status} → {to_status}',
  'task.update': '[更新任务] {project_name} / {title}',
  'proposal.create': '[新建提案] {project_name} / {title}',
  'proposal.transition': '[提案流转] {project_name} / {title}: {from_status} → {to_status}',
  // ...
};
```

---

## 八、前端设计

### 8.1 技术约束

| 约束 | 说明 |
|-----|------|
| 框架 | React 18 + TypeScript |
| UI 组件 | shadcn/ui（强制，唯一） |
| 图标 | Lucide Icons（强制，禁止 Emoji） |
| 状态管理 | Zustand |
| 路由 | React Router |
| 表单 | React Hook Form + Zod |

### 8.2 页面结构

```
┌──────────────────────────────────────────────────────────┐
│  顶部导航                                    用户头像    │
├──────────────────────────────────────────────────────────┤
│          │                                               │
│  侧边栏   │               主内容区                        │
│          │                                               │
│  [Home]  │  ┌─────────────────────────────────────────┐ │
│  首页     │  │                                         │ │
│  [Folder]│  │         根据路由显示不同内容             │ │
│  项目     │  │                                         │ │
│  ────     │  │                                         │ │
│  [Gear]  │  └─────────────────────────────────────────┘ │
│  设置     │                                               │
│          │                                               │
└──────────────────────────────────────────────────────────┘

注：[Home]、[Folder]、[Gear] 表示 Lucide Icons
```

### 8.3 核心页面

#### 首页 / 工作台

```
┌─────────────────────────────────────────────────┐
│  欢迎回来，张三                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [ClipboardList] 我的待办 (5)   [BarChart] 概览 │
│  ┌─────────────────────┐     ┌──────────────┐  │
│  │ [ ] 设计初稿 - 2天后 │     │ 进行中: 8    │  │
│  │ [ ] 客户反馈 - 今天  │     │ 待启动: 3    │  │
│  │ [ ] 合同签署 - 明天  │     │ 本月完成: 5  │  │
│  └─────────────────────┘     └──────────────┘  │
│                                                 │
│  [Clock] 最近更新                               │
│  ┌─────────────────────────────────────────┐   │
│  │ 李四 更新了 P-2025-008 的任务状态 - 10分钟前│  │
│  │ 王五 新建了提案 P-001 - 1小时前           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 项目列表

```
┌─────────────────────────────────────────────────┐
│  项目管理                        [+ 新建项目]   │
├─────────────────────────────────────────────────┤
│  [Search] 搜索项目... 状态:[全部] 年份:[2025]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ P-2025-0123                              │   │
│  │ 某某品牌画册设计                         │   │
│  │ 客户: 某某公司 | 状态: [Loader] 进行中   │   │
│  │ 截止: 2025-03-15 | 负责人: 张三          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ P-2025-0122                              │   │
│  │ XX品牌VI升级                             │   │
│  │ ...                                      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 任务看板

```
┌─────────────────────────────────────────────────┐
│  任务管理                        [+ 新建任务]   │
├─────────────────────────────────────────────────┤
│                                                 │
│   [Circle]        [Play]          [CheckCircle] │
│   待开始          进行中          已完成        │
│  ┌────────┐     ┌────────┐     ┌────────┐     │
│  │ T-003  │     │ T-001  │     │ T-002  │     │
│  │ 印刷对接│     │ 设计初稿│     │ 需求确认│    │
│  │ [User] │     │ [User] │     │ [User] │     │
│  │ 王五   │     │ 张三   │     │ 李四   │     │
│  │[Calendar]│   │[Calendar]│   │ [Check]│     │
│  │ 2/20   │     │ 2/15   │     │ 1/18   │     │
│  └────────┘     └────────┘     └────────┘     │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 8.4 前端目录结构

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── api/                    # API 调用
│   │   ├── command.ts          # Command API（核心）
│   │   ├── query.ts            # 查询 API
│   │   └── auth.ts             # 认证
│   │
│   ├── components/             # 组件（基于 shadcn/ui）
│   │   ├── ui/                 # shadcn/ui 组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── forms/
│   │   │   ├── DynamicForm.tsx     # 动态表单渲染
│   │   │   └── FormField.tsx       # 表单字段
│   │   ├── common/
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── UserAvatar.tsx
│   │   │   └── IconWrapper.tsx     # Lucide Icons 封装
│   │   └── business/
│   │       ├── ProjectCard.tsx
│   │       ├── TaskCard.tsx
│   │       └── TaskBoard.tsx
│   │
│   ├── pages/                  # 页面
│   │   ├── Home.tsx
│   │   ├── projects/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectDetail.tsx
│   │   │   └── ProjectCreate.tsx
│   │   ├── tasks/
│   │   │   ├── TaskBoard.tsx
│   │   │   └── TaskDetail.tsx
│   │   └── settings/
│   │       └── Settings.tsx
│   │
│   ├── stores/                 # 状态管理 (Zustand)
│   │   ├── user.ts
│   │   ├── projects.ts
│   │   └── commands.ts         # Command 能力发现
│   │
│   ├── hooks/
│   │   ├── useCommand.ts        # Command 调用 hook
│   │   ├── useStateMachine.ts   # 状态机 hook
│   │   └── useQuery.ts          # 数据查询 hook
│   │
│   ├── lib/
│   │   ├── command.ts           # Command 执行器
│   │   ├── state-machine.ts     # 状态机引擎
│   │   └── utils.ts
│   │
│   └── router/
│       └── index.tsx
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── components.json              # shadcn/ui 配置
└── vite.config.ts
```

### 8.5 Command 调用示例

```typescript
// hooks/useCommand.ts
import { useMutation } from '@tanstack/react-query';
import { executeCommand } from '@/api/command';

export function useCommand<TParams, TResult>(commandName: string) {
  return useMutation({
    mutationFn: (params: TParams) => executeCommand<TResult>(commandName, params),
  });
}

// 使用示例
function CreateTaskButton({ projectId }: { projectId: string }) {
  const createTask = useCommand<TaskCreateParams, TaskCreateResult>('task.create');

  const handleCreate = async (data: TaskFormData) => {
    const result = await createTask.mutateAsync({
      project_id: projectId,
      title: data.title,
      assignee: data.assignee,
      priority: data.priority,
    });
    
    if (result.success) {
      toast.success(`任务 ${result.task_id} 创建成功`);
    }
  };

  return (
    <Button onClick={() => openForm(handleCreate)}>
      <Plus className="w-4 h-4 mr-2" />
      新建任务
    </Button>
  );
}
```

### 8.6 状态流转 UI 示例

```typescript
// components/business/TaskStatusActions.tsx
import { useCommand } from '@/hooks/useCommand';
import { useStateMachine } from '@/hooks/useStateMachine';
import { Button } from '@/components/ui/button';
import { Play, Pause, Eye, Check, RotateCcw } from 'lucide-react';

const eventIcons: Record<string, LucideIcon> = {
  start: Play,
  pause: Pause,
  submit_review: Eye,
  approve: Check,
  reject: RotateCcw,
  reopen: RotateCcw,
};

export function TaskStatusActions({ task }: { task: Task }) {
  const { getAvailableEvents } = useStateMachine('任务');
  const transition = useCommand('task.transition');

  // 根据当前状态获取可用的流转事件
  const availableEvents = getAvailableEvents(task.status);

  const handleTransition = async (event: string) => {
    const result = await transition.mutateAsync({
      task_id: task.id,
      event,
    });

    if (!result.success) {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="flex gap-2">
      {availableEvents.map((event) => {
        const Icon = eventIcons[event];
        return (
          <Button
            key={event}
            variant="outline"
            size="sm"
            onClick={() => handleTransition(event)}
            disabled={transition.isPending}
          >
            <Icon className="w-4 h-4 mr-1" />
            {getEventLabel(event)}
          </Button>
        );
      })}
    </div>
  );
}
```

---

## 九、权限设计

### 9.1 用户数据结构

```json
// workspace/auth/users.json
{
  "users": [
    {
      "id": "zhangsan",
      "name": "张三",
      "email": "zhangsan@company.com",
      "role": "admin",
      "avatar": "https://...",
      "created": "2025-01-01"
    },
    {
      "id": "lisi",
      "name": "李四",
      "email": "lisi@company.com",
      "role": "member",
      "created": "2025-01-05"
    }
  ]
}
```

### 9.2 角色定义

| 角色 | 权限 |
|-----|------|
| `admin` | 全部读写 + 用户管理 + 系统设置 |
| `member` | 项目读写（受项目团队限制） |

### 9.3 操作主体标识

```typescript
interface Operator {
  type: 'human' | 'ai';
  id: string;           // 用户ID
  name: string;
  session?: string;     // 可选，用于追踪
}

// 所有 Command 调用都必须携带 Operator 信息
// 用于 Git commit 的 author 和审计日志
// AI 操作通过 Operator.type = 'ai' 标记，便于审计
```

### 9.4 MVP 阶段简化

- 只区分 admin / member 两种角色
- 不做细粒度路径权限
- member 可读写所有项目
- AI 操作使用普通用户账号 + Operator.type='ai' 标记

---

## 十、AI 集成设计

> **AI 不是后期功能，而是从 MVP 开始就作为一等公民参与系统设计。**

### 10.1 AI 能力发现

AI Agent 通过以下接口发现系统能力：

```
GET /api/commands
```

返回：

```json
{
  "commands": [
    {
      "name": "project.create",
      "description": "创建一个新的设计项目，生成项目目录结构和初始文件",
      "parameters": { ... },
      "returns": { ... },
      "examples": [ ... ]
    },
    {
      "name": "task.create",
      "description": "为项目创建一个新任务",
      ...
    },
    {
      "name": "task.transition",
      "description": "触发任务状态变更（受状态机约束）",
      ...
    }
  ],
  "state_machines": [
    {
      "name": "任务",
      "states": ["pending", "in_progress", "review", "done"],
      "transitions": { ... }
    }
  ]
}
```

### 10.2 AI 操作示例

#### 创建项目

```json
// AI 发起的请求
POST /api/command
{
  "command": "project.create",
  "params": {
    "name": "某某品牌VI设计",
    "client": "某某科技有限公司",
    "type": "branding",
    "deadline": "2025-03-15",
    "budget": 50000,
    "manager": "zhangsan"
  },
  "operator": {
    "type": "ai",
    "id": "atlas-agent-001",
    "name": "ATLAS AI Assistant"
  }
}
```

#### 批量任务状态更新

```json
// AI 可以批量执行 Command
POST /api/command/batch
{
  "commands": [
    {
      "command": "task.transition",
      "params": { "task_id": "T-001", "event": "approve" }
    },
    {
      "command": "task.transition",
      "params": { "task_id": "T-002", "event": "start" }
    }
  ],
  "operator": {
    "type": "ai",
    "id": "atlas-agent-001",
    "name": "ATLAS AI Assistant"
  }
}
```

### 10.3 AI 约束与安全

| 约束 | 说明 |
|-----|------|
| **Command 边界** | AI 只能通过 Command 操作，不能直接写文件 |
| **状态机约束** | AI 的状态流转同样受状态机规则限制 |
| **审计追踪** | 所有 AI 操作都有 operator 标记，可追溯 |
| **确认机制** | 高风险操作（如删除）可配置需要人工确认 |

### 10.4 禁止事项

根据系统铁律，以下行为**严格禁止**：

| 禁止行为 | 说明 |
|---------|------|
| AI 模拟点击 | AI 不通过 UI 自动化操作 |
| AI 解析 DOM | AI 不猜测页面状态 |
| 假进度条 | 不展示 AI 没有实际执行的操作 |
| 假思考过程 | 不事后拼装 AI 对话 |
| 绕过 Command | 不直接调用文件 API 修改数据 |

### 10.5 AI 可用的 Query API

AI 可以通过 Query API 获取上下文：

```
GET /api/projects?status=in_progress
GET /api/projects/{id}/tasks?status=pending
GET /api/tasks?assignee=zhangsan&status=in_progress
GET /api/state-machines/任务
```

---

## 十一、MVP 功能规划

### 11.1 MVP 目标

> 用最小的功能集，跑通「Command → 文档 → Git」的核心流程
> 
> **同时确保 AI 从第一天就能操作系统**

### 11.2 功能清单

#### P0 - 必须实现（MVP 核心）

| 模块 | 功能 | Human | AI | 说明 |
|-----|------|:-----:|:--:|------|
| **Command** | Command 执行引擎 | - | - | 核心基础设施 |
| **Command** | 能力发现 API | - | ✓ | AI 必须能发现可用 Command |
| **认证** | 用户登录 | ✓ | - | 简单的用户名密码验证 |
| **认证** | AI Agent 认证 | - | ✓ | API Key 或 Token |
| **项目** | project.list | ✓ | ✓ | 获取项目列表 |
| **项目** | project.create | ✓ | ✓ | 创建项目 |
| **项目** | project.get | ✓ | ✓ | 获取项目详情 |
| **项目** | project.update | ✓ | ✓ | 更新项目 |
| **任务** | task.list | ✓ | ✓ | 获取任务列表 |
| **任务** | task.create | ✓ | ✓ | 创建任务 |
| **任务** | task.get | ✓ | ✓ | 获取任务详情 |
| **任务** | task.update | ✓ | ✓ | 更新任务 |
| **任务** | task.transition | ✓ | ✓ | 任务状态流转（状态机驱动） |
| **Git** | 自动提交 | - | - | 每次 Command 执行自动 commit |
| **Git** | 定时推送 | - | - | 每小时 push 到远程 |
| **UI** | 项目列表页 | ✓ | - | shadcn/ui 实现 |
| **UI** | 项目详情页 | ✓ | - | |
| **UI** | 任务看板 | ✓ | - | |
| **UI** | 表单弹窗 | ✓ | - | 动态表单渲染 |

#### P1 - 重要功能（MVP 后）

| 模块 | 功能 | 说明 |
|-----|------|------|
| **提案** | proposal.* | 提案管理全套 Command |
| **合同** | contract.* | 合同管理全套 Command |
| **财务** | finance.* | 财务记录 Command |
| **首页** | 工作台 | 待办事项、最近更新 |
| **Git** | 历史查看 | 查看文件修改历史 |
| **搜索** | 全局搜索 | 搜索项目、任务 |
| **批量** | command.batch | AI 批量执行 Command |

#### P2 - 锦上添花（后期）

| 模块 | 功能 | 说明 |
|-----|------|------|
| **附件** | 文件上传 | 上传附件到项目 |
| **导出** | 导出功能 | 导出项目报告 |
| **通知** | 系统通知 | 任务提醒、变更通知 |
| **客户** | 客户门户 | 客户只读访问 |
| **地图** | AI 地图 | 复杂任务的多步骤编排 |

### 11.3 MVP 开发计划

```
Phase 1: 核心基础设施 (1周)
├── Command 执行引擎
├── 状态机引擎
├── Git Service 基础 API
├── 能力发现 API（/api/commands）
└── AI Agent 认证

Phase 2: 项目模块 (1周)
├── project.create / list / get / update Command
├── 项目列表页面（shadcn/ui）
├── 项目详情页面
├── 新建/编辑项目表单
└── 验证 AI 可调用

Phase 3: 任务模块 (1周)
├── task.create / list / get / update / transition Command
├── 任务状态机
├── 任务看板页面
├── 新建/编辑任务表单
├── 状态流转 UI
└── 验证 AI 可调用

Phase 4: Git 集成 (3天)
├── 自动 commit（每次 Command 执行）
├── 定时 push
└── commit message 模板

Phase 5: 完善与测试 (3天)
├── 用户认证
├── 错误处理
├── UI 优化
├── AI 端到端测试
└── 文档更新
```

### 11.4 验收标准

每个功能必须通过以下验收：

1. **Human 可操作**：通过 UI 完成操作
2. **AI 可操作**：通过 Command API 完成相同操作
3. **可脚本化**：可通过 curl/httpie 调用
4. **状态一致**：Human 和 AI 操作后，数据状态一致
5. **审计可追溯**：commit 记录显示操作者（human/ai）

---

## 十二、附录

### A. 状态值定义

#### 项目状态
| 值 | 显示 | 图标 | 颜色 |
|---|------|-----|-----|
| `pending` | 待启动 | Clock | gray |
| `in_progress` | 进行中 | Loader | blue |
| `completed` | 已完成 | CheckCircle2 | green |
| `cancelled` | 已取消 | XCircle | red |

#### 任务状态
| 值 | 显示 | 图标 | 颜色 |
|---|------|-----|-----|
| `pending` | 待开始 | Circle | gray |
| `in_progress` | 进行中 | Play | blue |
| `review` | 待审核 | Eye | orange |
| `done` | 已完成 | CheckCircle | green |

#### 提案状态
| 值 | 显示 | 图标 | 颜色 |
|---|------|-----|-----|
| `draft` | 草稿 | FileEdit | gray |
| `submitted` | 已提交 | Send | blue |
| `approved` | 已通过 | ThumbsUp | green |
| `rejected` | 已拒绝 | ThumbsDown | red |

### B. 项目 ID 生成规则

```
P-{年份}-{4位序号}

示例: P-2025-0001, P-2025-0123
```

### C. 提交消息规范

```
[{操作类型}] {简短描述}

示例:
[新建项目] 某某品牌画册设计
[任务流转] P-2025-0123 / T-001: pending → in_progress
[新建提案] P-2025-0123 / 设计方案 v1.0
[更新财务] P-2025-0123 / 收到首付款 ¥15,000

AI 操作示例:
[AI][新建任务] P-2025-0123 / 设计初稿
[AI][任务流转] P-2025-0123 / T-001: in_progress → review
```

### D. Lucide Icons 常用图标映射

| 用途 | 图标名称 | 说明 |
|-----|---------|------|
| 首页 | Home | 导航 |
| 项目 | Folder | 导航 |
| 任务 | ClipboardList | 导航 |
| 设置 | Settings | 导航 |
| 用户 | User | 头像 |
| 搜索 | Search | 搜索框 |
| 添加 | Plus | 新建按钮 |
| 编辑 | Pencil | 编辑按钮 |
| 删除 | Trash2 | 删除按钮 |
| 日历 | Calendar | 日期 |
| 时钟 | Clock | 时间/待启动 |
| 播放 | Play | 进行中 |
| 暂停 | Pause | 暂停 |
| 眼睛 | Eye | 审核/查看 |
| 勾选圆 | CheckCircle | 完成 |
| 叉圆 | XCircle | 取消/错误 |
| 向上箭头 | ArrowUp | 高优先级 |
| 向下箭头 | ArrowDown | 低优先级 |
| 横线 | Minus | 中优先级 |
| 加载 | Loader | 进行中状态 |
| 图表 | BarChart | 统计 |
| 文件编辑 | FileEdit | 草稿 |
| 发送 | Send | 已提交 |
| 点赞 | ThumbsUp | 已通过 |
| 点踩 | ThumbsDown | 已拒绝 |

### E. 技术要求清单

- [ ] Node.js 18+
- [ ] React 18 + TypeScript
- [ ] shadcn/ui（强制）
- [ ] Lucide Icons（强制）
- [ ] Zustand
- [ ] React Hook Form + Zod
- [ ] Git 仓库（本地）
- [ ] 远程仓库（GitHub/GitLab）

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|-----|------|---------|
| v0.1 | 2025-01-01 | 初始版本，概念设计 |
| v0.2 | 2025-01-01 | 重构为 AI 原生架构：增加 Command 层、状态机设计、AI 一等公民支持；技术选型改为 React + shadcn/ui；移除 Emoji 改用 Lucide Icons；文件命名改为中文 |
