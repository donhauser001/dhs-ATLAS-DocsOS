# Phase 1.5 - 范式校正

> 让所有核心模块回答同一个问题：「我是在操作数据，还是在操作一份文档？」

---

## 问题诊断

### 1. Workspace Index 中心性不够

**现象**：
- `workspace-service.ts` 直接调用 `scanMarkdownFiles()` 扫描文件系统
- `adl.ts` 使用 `existsSync(fullPath)` 直接判断文件存在
- `query-service.ts` 独立解析文档
- 多入口、多事实源

**范式违反**：
> 文档宇宙在概念上是「中心化的」，在实现上却是「多入口、多事实源」

### 2. ADL Block 被当成数据对象

**现象**：
- Query 直接返回 `machine` 字段集合
- 完全忽略 Human Zone (`body`, `heading`)
- 返回结果是"数据替身"而非"文档定位"

**范式违反**：
> Block 是文档显现单元，machine 是它的「可操作投影」，human zone 是不可替代的一部分

### 3. Proposal 是"命令集合"而非"认知行为"

**现象**：
- `ops` 完全自由，`path` 是任意字符串，`value` 是 `unknown`
- 没有 `reason`（为什么改）
- 没有 `source_context`（基于什么信息）
- Validator 只做参数校验，不做语义守门

**范式违反**：
> Proposal 应该是「可审计的认知行为」，而不是「绕过系统的写 API」

### 4. Query 返回"数据替身"

**现象**：
- `QueryResult.data` 直接返回 machine 字段投影
- `anchor / path` 信息被弱化
- 返回结果不强调"这是文档中的哪一段"

**范式违反**：
> Query 只能返回「文档定位能力」，不是「数据替身」

### 5. 权限判断散落

**现象**：
- 路径获取逻辑在多处：`req.query.path`, `req.body.path`, `req.body.target_file`
- 权限检查没有统一入口
- `filterDocumentsByPermission` 未被强制使用

---

## 修正方案

### 修正 1：Workspace Registry - 唯一真理源

创建 `workspace-registry.ts` 作为所有文档发现的**唯一入口**：

```typescript
// 硬规则
export function documentExists(relativePath: string): boolean
export function resolveDocument(relativePath: string): DocumentHandle | null
export function listVisibleDocuments(user: PublicUser): DocumentHandle[]
```

**强制约束**：
- 任何模块访问文档，必须先通过 Registry 确认
- 直接使用 `existsSync()` 访问 repository 是**禁止行为**
- Query / Proposal / API 都必须先过 Registry

### 修正 2：Query 返回文档定位

修改 `QueryResult` 结构：

```typescript
interface QueryResult {
  // 文档定位（强制）
  anchor: string;
  document: string;
  
  // 人类可读摘要（强制）
  heading: string;
  title: string;
  type: string;
  
  // 不再返回 data: Record<string, unknown>
  // 如需完整数据，必须通过 /api/adl/block/:anchor 获取
}
```

### 修正 3：Proposal 升级为认知行为

修改 `Proposal` 类型：

```typescript
interface Proposal {
  id: string;
  proposed_by: string;
  proposed_at: string;
  target_file: string;
  
  // 新增：认知语义
  reason: string;              // 必填：为什么做这个变更
  source_context?: string;     // 可选：基于什么信息做出判断
  
  ops: Operation[];
  status: ProposalStatus;
}
```

Validator 升级检查：
- `reason` 必须非空
- `ops` 中的 `path` 必须是已知可修改路径（白名单）

### 修正 4：统一可见域解析器

创建 `visibility-resolver.ts`：

```typescript
export function resolveVisiblePaths(user: PublicUser): ResolvedVisibility
export function checkDocumentAccess(user: PublicUser, path: string): AccessResult
```

所有权限检查必须通过这个解析器，不允许散落的 `startsWith` / `minimatch`。

---

## 实施顺序

1. **workspace-registry.ts** - 建立唯一真理源
2. **修改 Query 返回结构** - 文档定位而非数据替身
3. **升级 Proposal 类型** - 添加 reason/source_context
4. **统一可见域解析器** - 权限检查集中化

---

## 验收标准

每个模块必须能回答：

> 「如果我是 AI 而不是人，我是否知道我在操作的是一份文档，而不是一个数据对象？」

- [ ] Workspace Registry 成为唯一文档发现入口
- [ ] Query 返回文档定位，不返回数据替身
- [ ] Proposal 携带 reason，可审计
- [ ] 权限检查有统一入口

