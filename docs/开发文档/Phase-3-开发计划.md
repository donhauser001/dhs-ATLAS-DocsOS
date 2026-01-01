# Phase 3.0 开发计划

## 形态与语言收敛期

> 在引入智能之前，让系统先具备"自明性"

---

## 阶段定位

Phase 0-2 已完成范式验证：
- ✅ 文档是事实源（Doc = Truth）
- ✅ ADL 可解析、可渲染、可提交
- ✅ Proposal → Commit 闭环成立
- ✅ 范式成立

**Phase 3.0 不再验证范式，而是把"成立的范式"打磨成"可长期使用的语言 + 界面系统"**

---

## 核心原则

1. **不引入 AI** - 所有能力必须假设系统中不存在 AI
2. **文档原生** - 新增能力 = 新的 ADL 语义，不新增配置面板
3. **UI 无程序感** - 用户不需要理解"系统设计的规则"

---

## 完成判定

> 一个不懂 ATLAS 的人，在 30 分钟内理解：
> - 这是什么系统
> - 文档如何驱动界面
> - 如何修改内容

---

## 已完成任务

### Workstream 1: ADL 语言收敛

| 任务 | 状态 | 文件 |
|------|------|------|
| ADL v0.3 语言规范 | ✅ | `docs/ADL-Spec-v0.3.md` |
| ADL 语法校验器 | ✅ | `backend/src/adl/schema-validator.ts` |
| Parser 单元测试 | ✅ | `backend/src/adl/__tests__/parser.test.ts` |

### Workstream 2: Design Tokens 显现系统

| 任务 | 状态 | 文件 |
|------|------|------|
| Token 角色分类 | ✅ | `repository/genesis/tokens.md` |
| 确定性显现映射 | ✅ | `backend/src/services/token-resolver.ts` |
| CSS 变量注入 | ✅ | `frontend/src/styles/tokens.css` |
| TokenProvider | ✅ | `frontend/src/components/tokens/TokenProvider.tsx` |

### Workstream 3: UI / Interaction 内功

| 任务 | 状态 | 文件 |
|------|------|------|
| 语义字段渲染器 | ✅ | `frontend/src/components/fields/SemanticFieldRenderer.tsx` |
| 阅读态 UI | ✅ | `frontend/src/components/document/DocumentViewer.tsx` |
| 编辑态 UI | ✅ | `frontend/src/components/document/DocumentEditor.tsx` |
| 变更确认态 UI | ✅ | `frontend/src/components/document/ProposalReview.tsx` |
| 多文档导航 | ✅ | `frontend/src/components/nav/DocumentNav.tsx` |
| 面包屑导航 | ✅ | `frontend/src/components/nav/Breadcrumb.tsx` |
| 变更历史 | ✅ | `frontend/src/components/history/CommitHistory.tsx` |
| Diff 对比视图 | ✅ | `frontend/src/components/document/DiffViewer.tsx` |

### Workstream 4: 工程与可维护性

| 任务 | 状态 | 文件 |
|------|------|------|
| .atlas 生命周期规范 | ✅ | `docs/atlas-lifecycle.md` |
| 错误处理系统 | ✅ | `backend/src/errors/index.ts` |

---

## 核心改动文件清单

### 后端

| 文件 | 说明 |
|------|------|
| `backend/src/adl/schema-validator.ts` | ADL v0.3 语法校验器 |
| `backend/src/adl/__tests__/parser.test.ts` | Parser 单元测试 |
| `backend/src/services/token-resolver.ts` | 确定性显现映射 |
| `backend/src/errors/index.ts` | 错误处理系统 |
| `backend/src/adl/parser.ts` | 导出 parseBlocks |

### 前端

| 文件 | 说明 |
|------|------|
| `frontend/src/styles/tokens.css` | CSS 变量定义 |
| `frontend/src/types/adl.ts` | ADL 类型定义 |
| `frontend/src/components/tokens/TokenProvider.tsx` | Token 上下文提供者 |
| `frontend/src/components/fields/SemanticFieldRenderer.tsx` | 语义字段渲染器 |
| `frontend/src/components/document/DocumentViewer.tsx` | 阅读态 |
| `frontend/src/components/document/DocumentEditor.tsx` | 编辑态 |
| `frontend/src/components/document/ProposalReview.tsx` | 变更确认态 |
| `frontend/src/components/document/DiffViewer.tsx` | Diff 对比视图 |
| `frontend/src/components/nav/DocumentNav.tsx` | 多文档导航 |
| `frontend/src/components/nav/Breadcrumb.tsx` | 面包屑导航 |
| `frontend/src/components/history/CommitHistory.tsx` | 变更历史 |
| `frontend/src/components/ui/textarea.tsx` | Textarea 组件 |

### 文档

| 文件 | 说明 |
|------|------|
| `docs/ADL-Spec-v0.3.md` | ADL v0.3 语言规范 |
| `docs/atlas-lifecycle.md` | .atlas 生命周期规范 |
| `repository/genesis/tokens.md` | Token 角色分类 |

---

## 架构改进

### 语义分层

```
ADL 语义分层
├─ Structural Layer（结构层）
│  └─ heading / anchor / block / frontmatter
├─ Semantic Layer（语义层）
│  └─ type / id / status / title / category / role
├─ Presentation Layer（显现层）
│  └─ $display / color / icon / layout_hint
└─ Operational Layer（操作层）
   └─ $constraints / editable / readonly / lifecycle
```

### Token 角色分类

| 类型 | 示例 | 作用 |
|------|------|------|
| Semantic Token | `brand.primary` | 业务语义 |
| UI Role Token | `block.header.bg` | 显现角色 |
| System Token | `status.draft` | 状态语义 |

### 三种 UI 状态

| 状态 | 目标体验 | 组件 |
|------|---------|------|
| 阅读态 | 像在看结构化说明书 | DocumentViewer |
| 编辑态 | 像在填写文档本身 | DocumentEditor |
| 变更确认态 | 像在签字确认 | ProposalReview |

---

## 明确不做清单

| 不做项 | 原因 |
|--------|------|
| AI 接入 | 会污染语言设计 |
| 实时协作 | UI 语义未稳定 |
| 复杂权限 | 与语言无关 |
| 查询语言扩展 | Phase 3.5 |
| 商业化功能 | 无关当前目标 |

---

## Phase 4 预期

当 Phase 3.0 完成后，AI 的位置已经被"预留好了"：

- ADL 语言稳定，AI 可以理解和操作
- Token 系统完整，AI 可以使用语义引用
- UI 组件语义化，AI 可以驱动界面

AI 进入不是"魔法"或"加戏"，而是一种自然进入语言生态的"新用户类型"。

