---
slug: doc-cd4d18
---
# .atlas/ 生命周期规范

> Phase 3.0: 工程与可维护性
> 
> 本文档定义 `.atlas/` 目录的生命周期管理规范。

---

## 1. 目录结构

```
repository/.atlas/
├── workspace.json      # Workspace 索引
├── tokens.json         # Design Tokens 缓存
├── proposals/          # Proposal 存储
│   ├── PROP-xxx.json
│   └── ...
├── index/              # 索引目录
│   └── blocks.json     # Blocks 索引
└── users.json          # 用户数据
```

---

## 2. 文件说明

### 2.1 workspace.json

**用途**：Workspace 索引，记录所有文档的元数据。

```json
{
  "documents": [
    {
      "path": "genesis/服务示例.md",
      "title": "服务示例",
      "type": "facts",
      "blocks_count": 5,
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "repo_head": "abc123...",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**生成时机**：
- 首次启动时
- 调用 `POST /api/workspace/rebuild` 时
- 文档变更后增量更新

**一致性检查**：
- 启动时对比 `repo_head` 与当前 Git HEAD
- 不一致时标记为 stale

### 2.2 tokens.json

**用途**：Design Tokens 缓存，从 `genesis/tokens.md` 解析生成。

```json
{
  "groups": {
    "color.brand": {
      "id": "color.brand",
      "title": "品牌色系统",
      "tokens": { ... }
    }
  },
  "index": {
    "color.brand.primary": { "value": "#8B5CF6", ... }
  },
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**生成时机**：
- 首次访问 Token API 时
- 调用 `POST /api/tokens/rebuild` 时
- `genesis/tokens.md` 变更后

### 2.3 blocks.json

**用途**：Blocks 索引，用于 Query 查询。

```json
{
  "blocks": [
    {
      "anchor": "svc-S-001",
      "document": "genesis/服务示例.md",
      "heading": "S-001 品牌VI设计",
      "type": "service",
      "status": "active",
      "searchable": { ... }
    }
  ],
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**生成时机**：
- Workspace 索引重建时
- Proposal 执行后增量更新

### 2.4 proposals/

**用途**：存储 Proposal JSON 文件。

**生命周期**：
- 创建：`POST /api/adl/proposal`
- 执行：`POST /api/adl/proposal/:id/execute`
- 清理：执行后保留 30 天

### 2.5 users.json

**用途**：用户数据存储。

**注意**：
- 密码已哈希存储
- 不在 Git 中跟踪（.gitignore）

---

## 3. 生命周期场景

### 3.1 首次运行

| 步骤 | 行为 |
|------|------|
| 1 | 检测 `.atlas/` 是否存在 |
| 2 | 不存在则创建目录结构 |
| 3 | 扫描 `repository/` 构建 workspace.json |
| 4 | 解析 `genesis/tokens.md` 构建 tokens.json |
| 5 | 遍历文档构建 blocks.json |

### 3.2 正常启动

| 步骤 | 行为 |
|------|------|
| 1 | 读取 workspace.json |
| 2 | 对比 repo_head 与当前 HEAD |
| 3 | 一致则使用缓存 |
| 4 | 不一致则标记 stale，按需重建 |

### 3.3 文档变更

| 触发 | 行为 |
|------|------|
| Proposal 执行 | 增量更新 blocks.json |
| Git pull | 检测到 HEAD 变化，标记 stale |
| 外部编辑 | 下次访问时检测 mtime 变化 |

### 3.4 索引损坏

| 检测 | 行为 |
|------|------|
| JSON 解析失败 | 删除损坏文件，触发重建 |
| 缺少必要字段 | 删除损坏文件，触发重建 |
| 引用不存在的文档 | 日志警告，继续运行 |

### 3.5 手动清理

```bash
# 删除所有缓存
rm -rf repository/.atlas/*.json
rm -rf repository/.atlas/index/

# 保留 proposals 和 users
# 重启服务会自动重建索引
```

或通过 API：

```bash
curl -X POST http://localhost:3000/api/workspace/rebuild
curl -X POST http://localhost:3000/api/tokens/rebuild
```

---

## 4. 一致性保证

### 4.1 Git HEAD 校验

```typescript
// workspace-service.ts
const cachedHead = index.repo_head;
const currentHead = await git.revparse(['HEAD']);

if (cachedHead !== currentHead) {
  console.warn('[Workspace] Index may be stale');
  // 不自动重建，只标记
}
```

### 4.2 增量更新

Proposal 执行后只更新受影响的索引条目：

```typescript
// 更新单个文档的 blocks
await updateBlocksIndexForDocument(targetFile);

// 更新 workspace 中的单个文档
await updateDocumentIndex(targetFile);
```

### 4.3 原子性

索引更新使用"写入临时文件 + 重命名"模式：

```typescript
const tempPath = `${indexPath}.tmp`;
writeFileSync(tempPath, JSON.stringify(data));
renameSync(tempPath, indexPath);
```

---

## 5. 错误处理

### 5.1 索引缺失

```
[Workspace] workspace.json not found, rebuilding...
```

自动触发完整重建。

### 5.2 索引过期

```
[Workspace] Index may be stale. Cached HEAD: abc123, Current HEAD: def456
```

不自动重建，等待用户确认或 API 调用。

### 5.3 解析失败

```
[Workspace] Failed to parse workspace.json, rebuilding...
```

删除损坏文件，自动重建。

---

## 6. 性能考虑

### 6.1 启动时间

- 索引存在时：直接读取，< 10ms
- 索引缺失时：扫描重建，取决于文档数量

### 6.2 内存使用

- 索引加载到内存
- 大型仓库可能需要分片（Phase 4+）

### 6.3 磁盘使用

- 索引大小通常 < 1MB
- Proposal 需要定期清理

---

## 7. 安全考虑

### 7.1 .gitignore

以下文件不应提交到 Git：

```gitignore
# .atlas 中的敏感文件
repository/.atlas/users.json
```

### 7.2 路径安全

所有索引操作必须通过 Registry，禁止直接拼接路径。

### 7.3 Proposal 审计

Proposal 文件保留用于审计追溯。

---

## 8. 故障排除

### Q: 索引显示旧数据

```bash
# 强制重建
curl -X POST http://localhost:3000/api/workspace/rebuild
```

### Q: Token 解析失败

```bash
# 检查 tokens.md 语法
# 重建 Token 缓存
curl -X POST http://localhost:3000/api/tokens/rebuild
```

### Q: Proposal 执行后索引未更新

检查执行日志，确认增量更新是否成功。

---

**文档结束**

> `.atlas/` 是派生数据，可以安全删除重建。
> 唯一事实源永远是 `repository/` 中的 Markdown 文档。

