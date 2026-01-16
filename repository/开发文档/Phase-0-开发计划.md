---
slug: doc-vljumc
---




# Phase 0 / Genesis 开发计划

**目标**：让一份 ADL 文档完成「读取 → 显现 → 修改 → Proposal → 校验 → Commit」闭环。

---

## 阶段判定标准

当且仅当以下行为**真实发生**，Phase 0 才算完成：

1. 打开一份 ADL 文档
2. 系统自动渲染出可读界面
3. 在 UI 中修改一个字段
4. 系统生成 Proposal
5. Proposal 被校验
6. 文档被更新并产生一次 Git Commit

---

## 不做清单（Phase 0 明确排除）

| 排除项 | 原因 |
|--------|------|
| 多文档系统 | 单一文档足够证明范式 |
| 权限系统 | 只保留最小用户概念 |
| 协作 / 多人并发 | 后续阶段 |
| 完整 AI 能力矩阵 | 后续阶段 |
| ADL-Query | v1.1 再做 |
| ADL-Rules（完整约束） | 只做最小校验 |
| 商业 / 业务完整性 | 只证明技术可行性 |

---

## 六大构件开发计划

### 构件 1：Canonical Document（示例文档）

**目标**：创建第一份符合 ADL 规范的示例文档

**任务**：
- [ ] 1.1 创建 `repository/genesis/服务示例.md`
- [ ] 1.2 包含完整的 ADL 结构：
  - Markdown Heading
  - Anchor `{#id}`
  - Machine Zone（YAML）
  - Human Zone（正文）
- [ ] 1.3 包含 2-3 个不同 type 的 Block（service、category）

**产出**：
```
repository/genesis/服务示例.md
```

**验收**：文档可被人类阅读，结构符合 ADL Spec v1.0

---

### 构件 2：ADL Parser（解析器）

**目标**：将 ADL 文档解析为结构化 AST

**任务**：
- [ ] 2.1 创建 `backend/src/adl/parser.ts`
- [ ] 2.2 实现 Markdown 解析（基于 remark/unified）
- [ ] 2.3 实现 Heading + Anchor 提取
  - 正则匹配 `{#anchor-id}` 语法
- [ ] 2.4 实现 Machine Zone 解析
  - 识别 ```yaml 代码块
  - 解析 YAML 内容
- [ ] 2.5 实现 Human Zone 提取
  - Machine Zone 之后的内容为 Body
- [ ] 2.6 生成 Block AST 结构

**产出**：
```typescript
// backend/src/adl/parser.ts
interface Block {
  anchor: string;
  heading: string;
  level: number;
  machine: Record<string, any>;
  body: string;
  startLine: number;
  endLine: number;
}

interface ADLDocument {
  frontmatter: Record<string, any>;
  blocks: Block[];
  raw: string;
}

function parseADL(content: string): ADLDocument
```

**验收**：给定示例文档，能正确解析出所有 Block

---

### 构件 3：Minimal Renderer（最小投射器）

**目标**：将 ADL AST 投射为可交互界面

**任务**：
- [ ] 3.1 创建 API 端点 `GET /api/adl/document`
  - 返回解析后的 ADL AST
- [ ] 3.2 创建前端页面 `/genesis`
- [ ] 3.3 实现 Read View（阅读态）
  - 渲染 Heading
  - 渲染 Machine Zone 为只读字段展示
  - 渲染 Body 为 Markdown
- [ ] 3.4 实现 Edit View（编辑态）
  - Machine Zone 字段 → 表单控件
  - 支持 string / number / enum 基础类型
  - 字段完全由文档结构决定，不允许自定义
- [ ] 3.5 实现 Read/Edit 切换

**产出**：
```
frontend/src/pages/genesis/
├── GenesisPage.tsx      # 主页面
├── BlockRenderer.tsx    # Block 渲染器
├── ReadView.tsx         # 阅读态
├── EditView.tsx         # 编辑态
└── FieldRenderer.tsx    # 字段渲染器
```

**验收**：
- 打开页面能看到文档内容
- 切换到编辑态能看到表单
- 表单字段与文档结构一一对应

---

### 构件 4：Proposal 机制

**目标**：所有修改通过 Proposal 进行，不直接写文档

**任务**：
- [ ] 4.1 定义 Proposal 数据结构
```typescript
interface Proposal {
  id: string;
  proposed_by: string;
  proposed_at: string;
  target_file: string;
  ops: Operation[];
  status: 'pending' | 'approved' | 'rejected';
}

interface Operation {
  op: 'update_yaml';
  anchor: string;
  path: string;
  value: any;
  old_value?: any;
}
```
- [ ] 4.2 创建 API 端点 `POST /api/adl/proposal`
  - 接收 Proposal
  - 暂存到内存或文件
- [ ] 4.3 前端 EditView 修改时生成 Proposal
  - 不直接调用保存 API
  - 生成结构化的 Operation
- [ ] 4.4 创建 Proposal 预览 UI
  - 显示变更内容
  - 确认/取消按钮

**产出**：
```
backend/src/adl/proposal.ts
frontend/src/pages/genesis/ProposalPreview.tsx
```

**验收**：
- 修改字段后能看到 Proposal 预览
- Proposal 是结构化的 JSON，而非直接的文本修改

---

### 构件 5：Validator（最小校验器）

**目标**：确保 Proposal 不破坏文档结构

**任务**：
- [ ] 5.1 创建 `backend/src/adl/validator.ts`
- [ ] 5.2 实现最小校验规则：
  - 规则 1：目标 Anchor 必须存在
  - 规则 2：目标 Path 必须有效
  - 规则 3：新值类型必须与原值兼容
  - 规则 4：不允许删除必填字段（type, id, status）
- [ ] 5.3 API 端点返回校验结果
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  op_index: number;
  rule: string;
  message: string;
}
```

**产出**：
```
backend/src/adl/validator.ts
```

**验收**：
- 合法 Proposal 校验通过
- 非法 Proposal（如目标 Anchor 不存在）校验失败并返回错误

---

### 构件 6：Executor + Commit（执行器）

**目标**：应用 Proposal 并生成 Git Commit

**任务**：
- [ ] 6.1 创建 `backend/src/adl/executor.ts`
- [ ] 6.2 实现 Proposal 应用逻辑
  - 读取原文档
  - 定位目标 Block
  - 修改 Machine Zone YAML
  - 保持 Human Zone 不变
- [ ] 6.3 实现原子写入
  - 所有 ops 成功才写入
  - 任何失败则回滚
- [ ] 6.4 集成现有 Git 服务
  - 调用 `git-service.ts` 生成 commit
  - Commit message 包含 Proposal ID
- [ ] 6.5 创建 API 端点 `POST /api/adl/proposal/:id/execute`
  - 校验 → 应用 → Commit
  - 返回 commit hash

**产出**：
```
backend/src/adl/executor.ts
```

**验收**：
- 执行 Proposal 后文档被修改
- Git log 显示新的 commit
- Commit message 包含变更信息

---

## 目录结构（新增）

```
backend/src/
├── adl/                    # 新增：ADL 核心模块
│   ├── parser.ts          # 解析器
│   ├── proposal.ts        # Proposal 管理
│   ├── validator.ts       # 校验器
│   ├── executor.ts        # 执行器
│   └── types.ts           # 类型定义
├── api/
│   └── adl.ts             # 新增：ADL API 路由

frontend/src/
├── pages/
│   └── genesis/           # 新增：Genesis 页面
│       ├── GenesisPage.tsx
│       ├── BlockRenderer.tsx
│       ├── ReadView.tsx
│       ├── EditView.tsx
│       ├── FieldRenderer.tsx
│       └── ProposalPreview.tsx

repository/
├── genesis/               # 新增：Genesis 示例文档
│   └── 服务示例.md
```

---

## 开发顺序（依赖关系）

```
Week 1: 基础
├── [1] Canonical Document
└── [2] ADL Parser

Week 2: 显现
└── [3] Minimal Renderer
    ├── Read View
    └── Edit View

Week 3: 操作
├── [4] Proposal 机制
├── [5] Validator
└── [6] Executor + Commit

Week 4: 集成测试
└── 端到端闭环验证
```

---

## 技术选型

| 模块 | 技术 |
|------|------|
| Markdown 解析 | unified + remark |
| YAML 解析 | js-yaml |
| 前端 | React + shadcn/ui |
| 状态管理 | zustand（已有） |
| Git 操作 | simple-git（已有） |

---

## 风险与应对

| 风险 | 应对 |
|------|------|
| YAML 修改后格式丢失 | 使用 yaml.dump 保持格式 |
| Anchor 解析边界 case | 严格正则 + 单元测试 |
| Block 边界检测不准 | 基于 Heading level 判断 |
| Git 冲突 | Phase 0 不考虑，单用户 |

---

## 验收清单

Phase 0 完成的最终判定：

- [ ] 示例文档存在且符合 ADL 规范
- [ ] Parser 能正确解析文档
- [ ] 打开 /genesis 页面能看到文档
- [ ] Read View 正确显示
- [ ] Edit View 正确显示表单
- [ ] 修改字段生成 Proposal
- [ ] Proposal 校验通过/失败
- [ ] 执行 Proposal 修改文档
- [ ] Git 产生 commit

**一句话验收**：

> 打开页面 → 看到文档 → 修改字段 → 确认变更 → 文档更新 → Git commit 生成

---

## 下一步

Phase 0 完成后，ATLAS 的宇宙将正式存在。

后续 Phase 1 可扩展：
- 多文档支持
- ADL-Rules 完整约束
- AI 用户接入
- Proposal 审批流程

---

**END OF PHASE 0 DEVELOPMENT PLAN**

