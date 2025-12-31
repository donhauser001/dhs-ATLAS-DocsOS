# Phase 1 开发计划

**从「单文档闭环」到「可持续演化的工作宇宙」**

---

## 0. Phase 1 定位

### 一句话目标

把 Phase 0 的单文档闭环，扩展为「**多文档工作空间 + 可检索 + 可控写入 + 可持续协作**」的最小系统。

### 与 Phase 0 的关系

| Phase | 证明目标 |
|-------|----------|
| Phase 0 | 宇宙能坍缩一次（单文档 read→edit→proposal→commit） |
| Phase 0.5 | 坍缩可重复（Proposal 持久化、原子写入、E2E 测试） |
| **Phase 1** | **宇宙可以持续演化（多文档、可检索、可开放）** |

### Phase 1 结束的判定标准

在一个 workspace 中，至少包含：
- 1 个服务清单文档
- 3 个项目文档（每个项目一个目录/主文档）
- 50 个联系人

用户能做到：
1. 从 Workspace Tree 打开任意文档
2. 搜索/Query 找到目标 Block
3. 通过 UI 修改 machine 字段生成 Proposal
4. Proposal 持久化、可回放、可执行、可追溯
5. Client 登录只看到被授权项目域

---

## 1. 四大构件总览

| 序号 | 构件 | 状态 | 优先级 | 预估工作量 |
|------|------|------|--------|------------|
| 1 | Proposal 持久化 + 原子执行 | ✅ **Phase 0.5 已完成** | P0 | - |
| 2 | Workspace 索引与多文档导航 | 待开发 | P0 | 中 |
| 3 | ADL-Query v1.1（最小检索） | 待开发 | P1 | 中 |
| 4 | 最小权限与可见域 | 待开发 | P2 | 中 |

---

## 构件 1：Proposal 持久化 + 原子执行 ✅

> **状态：Phase 0.5 已完成**

### 已实现内容

| 功能 | 实现位置 | 验证状态 |
|------|----------|----------|
| Proposal 文件存储 | `repository/.atlas/proposals/<id>.json` | ✅ |
| 原子写入（临时文件→替换） | `backend/src/adl/executor.ts` | ✅ |
| 失败自动回滚 | `backend/src/adl/executor.ts` | ✅ |
| 统一配置管理 | `backend/src/config.ts` | ✅ |
| E2E 测试脚本 | `backend/scripts/phase0-e2e.ts` | ✅ |

### Phase 1 补充任务（可选）

- [ ] Proposal 状态机扩展：`draft → pending → executed | rejected | cancelled`
- [ ] Proposal 历史查询 API：`GET /api/adl/proposals?status=executed&limit=10`
- [ ] Proposal 过期清理机制

---

## 构件 2：Workspace 索引与多文档导航

### 目标

不是「支持所有文档」，而是支持一个**可治理的文档宇宙**：
- 文档清单
- 文档元数据
- 文档间引用
- 快速定位

### 核心原则

```
目录结构 = 板块结构
不需要「后台配置菜单」
文件系统即宇宙地图
```

### 2.1 Workspace 索引文件

**文件位置**：`repository/.atlas/workspace.json`

**自动生成规则**：
- 扫描 `repository/` 下所有 `.md` 文件
- 解析每个文件的 ADL 结构
- 提取文档元数据和 Block 索引

**索引结构**：

```json
{
  "version": "1.0",
  "generated_at": "2025-01-01T00:00:00Z",
  "documents": [
    {
      "path": "genesis/服务示例.md",
      "title": "服务清单示例",
      "document_type": "facts",
      "block_count": 5,
      "anchors": ["cat-brand-design", "cat-digital-product", "svc-S-001", "svc-S-002"],
      "types": ["category", "service"],
      "modified_at": "2025-01-01T00:00:00Z"
    },
    {
      "path": "projects/2025/P-001/项目主文档.md",
      "title": "XX品牌升级项目",
      "document_type": "project",
      "block_count": 12,
      "anchors": ["proj-P-001", "milestone-1", "milestone-2"],
      "types": ["project", "milestone", "task"],
      "refs": {
        "client": "contacts/客户-张三.md#contact-zhang",
        "services": ["genesis/服务示例.md#svc-S-001"]
      },
      "modified_at": "2025-01-01T00:00:00Z"
    }
  ],
  "directories": [
    {
      "path": "genesis",
      "name": "Genesis",
      "description": "系统核心定义",
      "document_count": 1
    },
    {
      "path": "projects",
      "name": "项目",
      "description": "所有项目文档",
      "document_count": 3
    },
    {
      "path": "contacts",
      "name": "联系人",
      "description": "客户与联系人",
      "document_count": 50
    }
  ]
}
```

### 2.2 后端 API

#### `GET /api/workspace/index`

返回 Workspace 索引。

**响应**：

```json
{
  "version": "1.0",
  "documents": [...],
  "directories": [...],
  "stats": {
    "total_documents": 54,
    "total_blocks": 320,
    "total_anchors": 280
  }
}
```

#### `POST /api/workspace/rebuild`

手动触发索引重建。

#### `GET /api/workspace/tree`

返回目录树结构（用于导航）。

**响应**：

```json
{
  "tree": [
    {
      "name": "genesis",
      "type": "directory",
      "children": [
        { "name": "服务示例.md", "type": "document", "path": "genesis/服务示例.md" }
      ]
    },
    {
      "name": "projects",
      "type": "directory",
      "children": [
        {
          "name": "2025",
          "type": "directory",
          "children": [
            { "name": "P-001", "type": "directory", "children": [...] }
          ]
        }
      ]
    }
  ]
}
```

### 2.3 前端实现

#### 布局结构

```
┌─────────────────────────────────────────────────────────────┐
│  ATLAS Workspace                                    [用户]  │
├────────────┬────────────────────────────────┬───────────────┤
│            │                                │               │
│  Workspace │      文档内容区                │   Block 列表  │
│  Tree      │                                │   (Anchors)   │
│            │  ┌──────────────────────┐     │               │
│  📁 genesis│  │  # 服务清单示例       │     │  #cat-brand   │
│    └ 服务  │  │                      │     │  #cat-digital │
│  📁 projects│  │  ## 品牌设计         │     │  #svc-S-001   │
│    └ 2025  │  │  status: active      │     │  #svc-S-002   │
│      └P-001│  │  ...                 │     │               │
│  📁 contacts│  └──────────────────────┘     │               │
│            │                                │               │
└────────────┴────────────────────────────────┴───────────────┘
```

#### 组件列表

| 组件 | 职责 |
|------|------|
| `WorkspaceLayout.tsx` | 三栏布局容器 |
| `WorkspaceTree.tsx` | 左侧目录树导航 |
| `DocumentView.tsx` | 中间文档显示区 |
| `AnchorList.tsx` | 右侧 Block/Anchor 列表 |
| `Breadcrumb.tsx` | 当前路径导航 |

#### 路由设计

```
/workspace                    → Workspace 首页（显示概览）
/workspace/genesis/服务示例.md → 打开具体文档
/workspace/projects/2025/P-001 → 打开项目目录
```

### 2.4 索引服务实现

**文件**：`backend/src/services/workspace-service.ts`

```typescript
interface WorkspaceService {
  // 获取完整索引
  getIndex(): Promise<WorkspaceIndex>;
  
  // 获取目录树
  getTree(): Promise<DirectoryTree>;
  
  // 重建索引
  rebuildIndex(): Promise<void>;
  
  // 增量更新（单文档变更后）
  updateDocument(path: string): Promise<void>;
  
  // 删除文档索引
  removeDocument(path: string): Promise<void>;
}
```

### 2.5 验收标准

- [ ] `GET /api/workspace/index` 返回完整索引
- [ ] `GET /api/workspace/tree` 返回目录树
- [ ] 前端 Workspace Tree 可展开/折叠
- [ ] 点击文档可在中间区域显示
- [ ] 右侧显示当前文档的 Anchor 列表
- [ ] 点击 Anchor 可滚动到对应 Block
- [ ] Proposal 执行后自动更新索引

---

## 构件 3：ADL-Query v1.1（最小检索）

### 目标

让「像在文档里搜索」成为系统能力，否则 AI 与人都会陷入「找来找去」。

### 边界约束（必须克制）

**只做**：
- 按 `type` 过滤（service/project/contact）
- 按 machine 字段条件过滤（等于、包含、数值比较）
- `select` 投影（返回少量字段）

**不做**：
- 聚合（sum/avg）
- join（跨文档复杂关联）
- 自定义函数

### 3.1 Query 语法

```yaml
# 找出所有 base_price > 50000 的服务
query:
  type: service
  filter:
    price.base: { $gt: 50000 }
  select: [id, title, price, category]
```

```yaml
# 找出某客户关联的所有项目
query:
  type: project
  filter:
    refs.client: "contact-zhang-san"
  select: [id, title, status]
```

```yaml
# 找出所有草稿状态的分类
query:
  type: category
  filter:
    status: draft
```

### 3.2 操作符

| 操作符 | 含义 | 示例 |
|--------|------|------|
| `$eq` | 等于（默认） | `status: active` |
| `$ne` | 不等于 | `status: { $ne: draft }` |
| `$gt` | 大于 | `price.base: { $gt: 50000 }` |
| `$gte` | 大于等于 | `price.base: { $gte: 50000 }` |
| `$lt` | 小于 | `price.base: { $lt: 10000 }` |
| `$lte` | 小于等于 | `price.base: { $lte: 10000 }` |
| `$in` | 在列表中 | `status: { $in: [active, draft] }` |
| `$contains` | 字符串包含 | `title: { $contains: "品牌" }` |
| `$exists` | 字段存在 | `refs.policy: { $exists: true }` |

### 3.3 后端 API

#### `POST /api/adl/query`

**请求**：

```json
{
  "query": {
    "type": "service",
    "filter": {
      "price.base": { "$gt": 50000 }
    },
    "select": ["id", "title", "price"]
  }
}
```

**响应**：

```json
{
  "results": [
    {
      "anchor": "svc-S-001",
      "document": "genesis/服务示例.md",
      "data": {
        "id": "S-001",
        "title": "品牌VI设计",
        "price": { "base": 50000, "unit": "项目", "currency": "CNY" }
      }
    }
  ],
  "count": 1,
  "query_time_ms": 12
}
```

### 3.4 索引实现

**文件**：`backend/src/services/query-service.ts`

**索引存储**：`repository/.atlas/index/blocks.json`

```json
{
  "blocks": [
    {
      "anchor": "svc-S-001",
      "document": "genesis/服务示例.md",
      "type": "service",
      "machine": {
        "id": "S-001",
        "status": "active",
        "title": "品牌VI设计",
        "category": "cat-brand-design",
        "price": { "base": 50000, "unit": "项目", "currency": "CNY" }
      }
    }
  ],
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**索引更新策略**：
- Proposal 执行成功后触发增量更新
- 定时全量重建（可选）
- 启动时检查索引是否过期

### 3.5 前端 Query UI

#### 组件

| 组件 | 职责 |
|------|------|
| `QueryPanel.tsx` | Query 输入面板 |
| `QueryResults.tsx` | 查询结果列表 |
| `QuickFilter.tsx` | 快捷过滤（按 type） |

#### 交互流程

1. 用户在 QueryPanel 输入查询条件
2. 点击「搜索」或回车
3. 结果显示在 QueryResults
4. 点击结果项跳转到对应文档和 Block

### 3.6 验收标准

- [ ] `POST /api/adl/query` 正常响应
- [ ] 「找出所有 base_price > 50000 的 service」1 秒内返回
- [ ] 「找出某客户关联的所有项目」能正确返回
- [ ] 前端 Query UI 可用
- [ ] 点击查询结果可跳转到文档

---

## 构件 4：最小权限与可见域

### 目标

让 Client 能够安全地访问被授权的项目域，而不是整个 Workspace。

### 核心原则

```
权限 = 路径域权限
不是字段级，不是 Block 级
而是「你能看到哪些目录/文档」
```

### 4.1 用户数据结构

**文件**：`repository/.atlas/users.json`

```json
{
  "users": [
    {
      "id": "user-admin",
      "username": "admin",
      "password_hash": "...",
      "role": "admin",
      "name": "系统管理员",
      "permissions": {
        "paths": ["**"],
        "can_execute_proposal": true,
        "can_create_proposal": true
      }
    },
    {
      "id": "user-staff-001",
      "username": "designer",
      "password_hash": "...",
      "role": "staff",
      "name": "设计师小王",
      "permissions": {
        "paths": ["workspace/**"],
        "can_execute_proposal": false,
        "can_create_proposal": true
      }
    },
    {
      "id": "user-client-001",
      "username": "client-zhang",
      "password_hash": "...",
      "role": "client",
      "name": "张总",
      "client_id": "contact-zhang-san",
      "permissions": {
        "paths": [
          "projects/2025/P-001/**",
          "projects/2025/P-003/**"
        ],
        "can_execute_proposal": false,
        "can_create_proposal": false
      }
    }
  ]
}
```

### 4.2 角色定义

| 角色 | 可见域 | 可创建 Proposal | 可执行 Proposal |
|------|--------|-----------------|-----------------|
| `admin` | 全部 | ✅ | ✅ |
| `staff` | workspace/** | ✅ | ❌（需 admin 审批） |
| `client` | 授权路径 | ❌ | ❌ |

### 4.3 后端实现

#### 认证 API

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### 中间件

**文件**：`backend/src/middleware/auth.ts`

```typescript
// 路径权限检查
function checkPathPermission(user: User, path: string): boolean {
  return user.permissions.paths.some(pattern => 
    minimatch(path, pattern)
  );
}

// 路由守卫
function requireAuth(req, res, next) {
  const user = req.session?.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  next();
}

// 路径权限守卫
function requirePathAccess(req, res, next) {
  const path = req.query.path || req.body.path;
  if (!checkPathPermission(req.user, path)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}
```

#### API 权限矩阵

| API | admin | staff | client |
|-----|-------|-------|--------|
| `GET /api/workspace/index` | ✅ 全部 | ✅ 全部 | ✅ 过滤后 |
| `GET /api/adl/document` | ✅ | ✅ | ✅ 路径检查 |
| `POST /api/adl/proposal` | ✅ | ✅ | ❌ |
| `POST /api/adl/proposal/:id/execute` | ✅ | ❌ | ❌ |
| `POST /api/adl/query` | ✅ 全部 | ✅ 全部 | ✅ 过滤后 |

### 4.4 前端实现

#### 登录页面

**路由**：`/login`

#### 权限上下文

```typescript
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  canAccess: (path: string) => boolean;
  canCreateProposal: boolean;
  canExecuteProposal: boolean;
}
```

#### 路由守卫

```typescript
function ProtectedRoute({ children, requiredPaths }) {
  const { user, canAccess } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredPaths && !requiredPaths.some(p => canAccess(p))) {
    return <AccessDenied />;
  }
  
  return children;
}
```

### 4.5 验收标准

- [ ] `POST /api/auth/login` 正常工作
- [ ] Client 登录后 Workspace Tree 只显示授权目录
- [ ] Client 直接访问未授权路径返回 403
- [ ] Staff 可创建 Proposal 但不能执行
- [ ] Admin 可执行 Proposal
- [ ] Query 结果根据权限过滤

---

## 开发顺序（推荐）

```
Phase 0.5 ✅ → 构件 2 → 构件 3 → 构件 4
（已完成）    Workspace   Query    权限
              索引
```

### 详细任务分解

#### Week 1-2：Workspace 索引与多文档

1. [ ] 实现 `WorkspaceService`
2. [ ] 实现 `GET /api/workspace/index`
3. [ ] 实现 `GET /api/workspace/tree`
4. [ ] 前端 `WorkspaceLayout` 三栏布局
5. [ ] 前端 `WorkspaceTree` 目录导航
6. [ ] 前端 `AnchorList` 右侧列表
7. [ ] 路由整合与测试

#### Week 3：ADL-Query v1.1

1. [ ] 实现 `QueryService`
2. [ ] 实现索引构建与增量更新
3. [ ] 实现 `POST /api/adl/query`
4. [ ] 前端 `QueryPanel` 组件
5. [ ] 前端 `QueryResults` 组件
6. [ ] 集成测试

#### Week 4：最小权限与可见域

1. [ ] 实现用户数据管理
2. [ ] 实现认证 API
3. [ ] 实现权限中间件
4. [ ] 前端登录页面
5. [ ] 前端权限上下文
6. [ ] 路由守卫
7. [ ] 集成测试

---

## Phase 1 「不做清单」

为了保持纯度，以下内容**不在 Phase 1 范围内**：

| 不做 | 原因 | 规划 |
|------|------|------|
| 多人实时协同（OT/CRDT） | 复杂度过高 | Phase 2+ |
| 审批流 | Proposal 的「确认/执行」足够 | 按需 |
| 复杂规则引擎 | ADL-Rules 只做极少 schema 校验 | Phase 2 |
| 完整 AI Agent 生态 | 需要先稳定基础 | Phase 2 |
| 聚合查询（sum/avg） | 不是文档系统的职责 | 不做 |
| 跨文档 Join | 保持简单 | 不做 |
| 字段级权限 | 路径级已足够 | 按需 |

---

## 测试数据准备

为了验收 Phase 1，需要准备以下测试数据：

### 目录结构

```
repository/
├── genesis/
│   └── 服务示例.md          # 已有
├── projects/
│   └── 2025/
│       ├── P-001/
│       │   └── 项目主文档.md
│       ├── P-002/
│       │   └── 项目主文档.md
│       └── P-003/
│           └── 项目主文档.md
├── contacts/
│   ├── 客户-张三.md
│   ├── 客户-李四.md
│   └── ... (50个联系人)
└── .atlas/
    ├── workspace.json
    ├── users.json
    ├── index/
    │   └── blocks.json
    └── proposals/
```

### 数据生成脚本

```bash
# 需要创建
backend/scripts/generate-test-data.ts
```

---

## E2E 测试脚本

**文件**：`backend/scripts/phase1-e2e.ts`

测试内容：
1. Workspace 索引生成与查询
2. 多文档导航
3. Query 搜索
4. 权限验证（admin/staff/client）
5. 完整流程：登录 → 搜索 → 打开文档 → 编辑 → Proposal → 执行

---

## 完成标志

Phase 1 完成的判定：

```
✅ Workspace Tree 可导航到任意文档
✅ Query 可搜索到目标 Block
✅ Proposal 持久化且可追溯
✅ Client 登录只看到授权域
✅ E2E 测试全部通过
```

当以上全部达成，ATLAS 从「证明」进入「可长期工作」。

