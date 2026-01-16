# Phase 3.3: 功能声明系统 (Function Declaration System)

> **核心理念**：文档的功能身份由文档自己声明，系统通过功能标签决定如何调用数据和渲染界面。

---

## 〇、系统哲学

### 核心命题

> **系统只是显现工具，文档才是系统本身。**

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         ┌─────────────────────────────────────┐             │
│         │         📄 文 档                    │             │
│         │                                     │             │
│         │  • 业务逻辑定义                     │             │
│         │  • 数据结构定义                     │             │
│         │  • 功能身份声明                     │             │
│         │  • UI 配置声明                      │             │
│         │  • 导航结构声明                     │             │
│         │  • 校验规则定义                     │             │
│         │  • 权限边界定义                     │             │
│         │                                     │             │
│         │        这才是"系统本身"              │             │
│         └─────────────────────────────────────┘             │
│                          │                                  │
│                          │ 读取 & 显现                       │
│                          ▼                                  │
│         ┌─────────────────────────────────────┐             │
│         │      🖥️ 前端 + 后端 代码             │             │
│         │                                     │             │
│         │  • 解析文档                         │             │
│         │  • 渲染界面                         │             │
│         │  • 执行操作                         │             │
│         │                                     │             │
│         │        这只是"显现工具"              │             │
│         └─────────────────────────────────────┘             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 哲学推论

| 传统系统 | ATLAS |
|----------|-------|
| 代码定义业务逻辑 | **文档定义业务逻辑** |
| 改功能要改代码 | **改功能只改文档** |
| 系统是黑盒 | **系统是可读的文档** |
| 迁移要重写代码 | **文档可带走，换个显现层即可** |
| AI 要理解代码 | **AI 直接读文档就懂** |
| 用户依赖 UI | **用户可直接编辑文档** |

### 终极验证标准

> **删除所有前端和后端代码，只保留文档。**
> **然后用另一套代码重新"显现"这些文档。**
> **系统应该表现完全一致。**

---

## 一、阶段目标

### 🎯 核心目标

**让 ATLAS 成为真正的"文档即系统"**：
- 文档声明自己的功能身份（我是什么）
- 系统发现文档的功能（而不是定义它）
- 位置自由、结构自由、最大灵活度

### ✅ 完成标准

1. 文档可以通过 `atlas.function` 声明功能身份
2. 系统自动扫描并构建功能注册表
3. API 可以按功能查找文档（而非按路径）
4. 前端渲染器根据功能标签决定渲染方式
5. Auth 系统使用功能查找进行用户验证

---

## 二、功能声明规范

### 2.1 Frontmatter 结构

```yaml
---
version: "1.0"
document_type: facts

# === ATLAS 功能声明 ===
atlas:
  # 功能身份（必选）
  function: principal | entity_list | entity_detail | config | registry
  
  # 实体类型（当 function 为 entity_* 时使用）
  entity_type: user | client | project | contact | ...
  
  # 能力标签（可选）
  capabilities:
    - auth.login           # 可用于登录验证
    - auth.session         # 可创建会话
    - nav.sidebar          # 显示在侧边栏
    - nav.header           # 显示在顶部导航
    - api.public           # 公开访问
    - api.protected        # 需要认证
  
  # 导航配置（可选）
  navigation:
    visible: true          # 是否在导航中显示
    icon: users            # 图标（Lucide icon name）
    label: 用户管理        # 显示名称
    order: 10              # 排序权重
    parent: system         # 父级菜单 ID
  
  # 基础字段约束（可选，用于验证）
  required_fields:
    - id
    - display_name

created: 2025-01-01
author: system
---
```

### 2.2 功能类型定义

| Function | 说明 | 系统行为 |
|----------|------|---------|
| `principal` | 登录主体 | Auth API 验证登录、创建会话 |
| `entity_list` | 实体列表页 | 渲染列表视图（卡片/表格） |
| `entity_detail` | 实体详情页 | 渲染详情视图 |
| `config` | 系统配置 | 系统读取配置值 |
| `registry` | 注册表 | 类型定义、Token 定义等 |
| `dashboard` | 仪表盘 | 聚合多数据源展示 |

### 2.3 能力标签定义

```yaml
# 认证能力
auth:
  login: 可用于登录验证（需要 auth.password_hash 字段）
  session: 可创建用户会话
  oauth: 支持 OAuth 登录

# 导航能力
nav:
  sidebar: 显示在侧边栏
  header: 显示在顶部导航
  breadcrumb: 显示在面包屑

# API 能力
api:
  public: 无需认证可访问
  protected: 需要认证
  admin: 需要管理员权限

# 渲染能力
render:
  card: 支持卡片视图
  table: 支持表格视图
  detail: 支持详情视图
  form: 支持表单编辑
```

---

## 三、功能注册表 (Function Registry)

### 3.1 注册表结构

文件：`.atlas/functions.json`

```json
{
  "version": "1.0",
  "generated_at": "2025-01-01T00:00:00Z",
  "repo_head": "abc123",
  
  "functions": {
    "principal": {
      "documents": [
        {
          "path": "users/principals/u-wang.md",
          "id": "u-wang",
          "title": "王编辑",
          "capabilities": ["auth.login", "auth.session"],
          "indexed_fields": {
            "identity.emails": ["wang@zhongxin.com"],
            "status": "active"
          }
        }
      ],
      "count": 13
    },
    
    "entity_list": {
      "documents": [
        {
          "path": "users/用户列表.md",
          "entity_type": "user",
          "navigation": {
            "visible": true,
            "icon": "users",
            "label": "用户管理",
            "order": 10
          }
        },
        {
          "path": "genesis/客户管理.md",
          "entity_type": "client",
          "navigation": {
            "visible": true,
            "icon": "building",
            "label": "客户管理",
            "order": 20
          }
        }
      ],
      "count": 2
    }
  },
  
  "navigation": {
    "sidebar": [
      { "path": "users/用户列表.md", "icon": "users", "label": "用户管理", "order": 10 },
      { "path": "genesis/客户管理.md", "icon": "building", "label": "客户管理", "order": 20 }
    ]
  }
}
```

### 3.2 注册表生成流程

```
┌─────────────────────────────────────────────────────────────┐
│  1. 扫描所有 .md 文档                                        │
│     - 解析 YAML frontmatter                                 │
│     - 提取 atlas.function 字段                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  2. 分类注册                                                 │
│     - 按 function 类型分组                                   │
│     - 提取 capabilities                                     │
│     - 索引关键字段（用于快速查找）                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  3. 生成导航树                                               │
│     - 收集所有 nav.sidebar 能力的文档                        │
│     - 按 order 排序                                         │
│     - 构建父子层级                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 写入 .atlas/functions.json                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 四、API 设计

### 4.1 功能查询 API

```typescript
// GET /api/functions
// 获取功能注册表
{
  "functions": { ... },
  "navigation": { ... }
}

// GET /api/functions/:function
// 获取指定功能的所有文档
// 例如: GET /api/functions/principal
{
  "function": "principal",
  "documents": [...]
}

// GET /api/functions/:function/find
// 按条件查找功能文档
// 例如: GET /api/functions/principal/find?email=wang@zhongxin.com
{
  "document": {
    "path": "users/principals/u-wang.md",
    "block": { ... }
  }
}
```

### 4.2 Auth API 改造

```typescript
// POST /api/auth/login
// 使用功能注册表查找用户

async function login(email: string, password: string) {
  // 1. 从功能注册表获取所有 principal 文档
  const principals = functionRegistry.getByFunction('principal');
  
  // 2. 使用索引快速查找
  const matchingDoc = principals.find(doc => 
    doc.indexed_fields['identity.emails']?.includes(email)
  );
  
  if (!matchingDoc) {
    return { error: 'User not found' };
  }
  
  // 3. 读取完整文档验证密码
  const doc = await registry.getDocument(matchingDoc.path);
  const principal = findPrincipalBlock(doc);
  
  if (!await verifyPassword(password, principal.machine.auth.password_hash)) {
    return { error: 'Invalid password' };
  }
  
  // 4. 创建会话
  return createSession(principal);
}
```

### 4.3 导航 API

```typescript
// GET /api/navigation/sidebar
// 获取侧边栏导航（基于功能声明自动生成）
{
  "items": [
    {
      "path": "users/用户列表.md",
      "icon": "users",
      "label": "用户管理",
      "url": "/workspace/users/用户列表.md"
    },
    {
      "path": "genesis/客户管理.md", 
      "icon": "building",
      "label": "客户管理",
      "url": "/workspace/genesis/客户管理.md"
    }
  ]
}
```

---

## 五、前端渲染系统

### 5.1 渲染器选择逻辑

```typescript
function selectRenderer(document: ADLDocument) {
  const { atlas } = document.frontmatter;
  
  if (!atlas?.function) {
    return <DefaultDocumentRenderer />;
  }
  
  switch (atlas.function) {
    case 'entity_list':
      return <EntityListRenderer 
        entityType={atlas.entity_type}
        config={getListConfig(document)}
      />;
    
    case 'entity_detail':
      return <EntityDetailRenderer
        entityType={atlas.entity_type}
      />;
    
    case 'principal':
      return <PrincipalRenderer />;
    
    case 'dashboard':
      return <DashboardRenderer />;
    
    case 'config':
    case 'registry':
      return <SystemDocumentRenderer />;
    
    default:
      return <DefaultDocumentRenderer />;
  }
}
```

### 5.2 列表页渲染器

```typescript
interface EntityListConfig {
  source: {
    function?: string;      // 按功能查找
    directory?: string;     // 按目录查找
    filter?: Record<string, any>;
  };
  display: {
    fields: FieldConfig[];
    views: ViewConfig[];
    pagination: PaginationConfig;
  };
  interaction: {
    click: 'open_document' | 'expand' | 'modal';
    search?: SearchConfig;
    sort?: SortConfig;
  };
}

function EntityListRenderer({ entityType, config }: Props) {
  const [data, setData] = useState([]);
  const [view, setView] = useState(config.display.views[0].type);
  
  useEffect(() => {
    // 根据 source 配置获取数据
    if (config.source.function) {
      fetchByFunction(config.source.function);
    } else if (config.source.directory) {
      fetchByDirectory(config.source.directory);
    }
  }, [config]);
  
  return (
    <div>
      {/* 视图切换器 */}
      <ViewSwitcher views={config.display.views} current={view} onChange={setView} />
      
      {/* 搜索框 */}
      {config.interaction.search?.enabled && <SearchBar {...config.interaction.search} />}
      
      {/* 列表渲染 */}
      {view === 'card' && <CardView data={data} fields={config.display.fields} />}
      {view === 'table' && <TableView data={data} fields={config.display.fields} />}
      
      {/* 分页 */}
      <Pagination {...config.display.pagination} />
    </div>
  );
}
```

### 5.3 动态侧边栏

```typescript
function DynamicSidebar() {
  const [navItems, setNavItems] = useState([]);
  
  useEffect(() => {
    // 从 API 获取基于功能声明生成的导航
    fetch('/api/navigation/sidebar')
      .then(res => res.json())
      .then(data => setNavItems(data.items));
  }, []);
  
  return (
    <aside>
      {/* 功能声明生成的导航项 */}
      {navItems.map(item => (
        <NavLink key={item.path} to={item.url}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
      
      {/* 文档目录树（原有） */}
      <DocumentTree />
    </aside>
  );
}
```

---

## 六、目录索引块 (Directory Index Block)

### 6.1 ADL 定义

```yaml
type: directory_index
id: user-list
title: 系统用户

# 数据源（二选一）
source:
  # 方式 A: 按功能查找
  function: principal
  
  # 方式 B: 按目录扫描
  # directory: users/principals/
  # recursive: false
  
  # 过滤条件
  filter:
    status: active

# 显示配置
display:
  fields:
    - { path: display_name, label: 姓名 }
    - { path: identity.emails[0], label: 邮箱 }
    - { path: identity.phones[0], label: 电话 }
    - { path: status, label: 状态, type: badge }
  
  views:
    - type: card
      default: true
      columns: 3
      avatar: identity.avatar
    
    - type: table
      columns:
        - { field: display_name, width: 120 }
        - { field: identity.emails[0] }
        - { field: status, width: 80 }
  
  pagination:
    page_size: 20
    sizes: [10, 20, 50]

# 交互配置
interaction:
  click: open_document
  search:
    enabled: true
    fields: [display_name, identity.emails]
  sort:
    default: display_name
    options: [display_name, created_at, status]
```

---

## 七、文档校验系统 (Document Linter)

### 7.1 校验时机

```
┌─────────────────────────────────────────────────────────────┐
│  触发校验的时机                                              │
├─────────────────────────────────────────────────────────────┤
│  1. 索引构建时（rebuildIndex）                               │
│  2. 文档保存时（Proposal Execute）                          │
│  3. 手动触发（Lint All Documents）                          │
│  4. 前端编辑时（实时校验）                                   │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 错误级别定义

| 级别 | 标识 | 说明 | 行为 |
|------|------|------|------|
| **Error** | 🔴 | 必须修改 | 阻止保存/索引 |
| **Warning** | 🟡 | 建议修改 | 允许保存，但提示 |
| **Info** | 🔵 | 可以忽略 | 仅提示，不影响 |
| **Hint** | ⚪ | 优化建议 | 可选改进 |

### 7.3 校验规则分类

#### A. 基础格式校验

```yaml
rules:
  # Frontmatter 必须存在
  frontmatter-required:
    level: error
    message: "文档缺少 YAML frontmatter"
  
  # version 字段必须存在
  version-required:
    level: error
    message: "缺少 version 字段"
  
  # document_type 必须存在
  document-type-required:
    level: warning
    message: "建议添加 document_type 字段"
```

#### B. 功能声明校验

```yaml
rules:
  # atlas.function 声明后必须有效
  valid-function:
    level: error
    message: "未知的功能类型: {function}"
    valid_values: [principal, entity_list, entity_detail, config, registry]
  
  # 能力标签必须有效
  valid-capabilities:
    level: warning
    message: "未知的能力标签: {capability}"
```

#### C. 功能特定校验（按 function 类型）

```yaml
# principal 功能的校验规则
principal:
  rules:
    # 必须有 id 字段
    id-required:
      level: error
      message: "用户文档缺少必要字段: id"
    
    # 必须有 identity.emails
    emails-required:
      level: error
      message: "用户文档缺少必要字段: identity.emails"
    
    # 建议有 auth 块（用于登录）
    auth-recommended:
      level: warning
      condition: "capabilities.includes('auth.login')"
      message: "声明了 auth.login 能力，但缺少 auth 字段"
    
    # display_name 建议存在
    display-name-recommended:
      level: info
      message: "建议添加 display_name 字段以提升可读性"

# entity_list 功能的校验规则
entity_list:
  rules:
    # 必须有 directory_index 块
    directory-index-required:
      level: error
      message: "列表页必须包含 directory_index 类型的块"
    
    # source 配置必须存在
    source-required:
      level: error
      message: "directory_index 缺少 source 配置"
```

#### D. 一致性校验（跨文档）

```yaml
rules:
  # 同类文档结构一致性
  structure-consistency:
    level: warning
    message: "此文档的结构与其他 {function} 文档存在差异"
    details:
      - "缺少字段: {missing_fields}"
      - "多余字段: {extra_fields}"
  
  # ID 唯一性
  id-uniqueness:
    level: error
    message: "ID '{id}' 与 {other_path} 重复"
  
  # 引用有效性
  ref-validity:
    level: error
    message: "引用 '{ref}' 指向的文档不存在"
```

### 7.4 校验报告结构

```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "summary": {
    "total_documents": 25,
    "documents_with_errors": 3,
    "documents_with_warnings": 5,
    "error_count": 4,
    "warning_count": 8,
    "info_count": 12
  },
  "documents": [
    {
      "path": "users/principals/u-wang.md",
      "function": "principal",
      "status": "warning",
      "issues": [
        {
          "level": "warning",
          "rule": "auth-recommended",
          "message": "声明了 auth.login 能力，但缺少 auth 字段",
          "location": {
            "block": "u-wang",
            "line": 15
          },
          "suggestion": "添加 auth: { password_hash: '...' } 字段"
        }
      ]
    },
    {
      "path": "users/principals/u-test.md",
      "function": "principal",
      "status": "error",
      "issues": [
        {
          "level": "error",
          "rule": "id-required",
          "message": "用户文档缺少必要字段: id",
          "location": {
            "block": null,
            "line": 10
          },
          "suggestion": "在 principal 块中添加 id 字段"
        },
        {
          "level": "warning",
          "rule": "structure-consistency",
          "message": "此文档的结构与其他 principal 文档存在差异",
          "details": {
            "missing_fields": ["identity.phones", "status"],
            "reference_document": "users/principals/u-wang.md"
          }
        }
      ]
    }
  ],
  "consistency_report": {
    "principal": {
      "common_fields": ["id", "display_name", "status", "identity.emails"],
      "optional_fields": ["identity.phones", "auth", "employee"],
      "documents_analyzed": 13
    }
  }
}
```

### 7.5 前端校验面板

```
┌─────────────────────────────────────────────────────────────┐
│  📋 文档校验报告                                    [重新检查] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  概览                                                       │
│  ┌─────────┬─────────┬─────────┬─────────┐                 │
│  │ 🔴 4    │ 🟡 8    │ 🔵 12   │ ✅ 20   │                 │
│  │ 错误    │ 警告    │ 提示    │ 通过    │                 │
│  └─────────┴─────────┴─────────┴─────────┘                 │
│                                                             │
│  需要处理的文档                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔴 users/principals/u-test.md                       │   │
│  │    ├─ 🔴 缺少必要字段: id                            │   │
│  │    └─ 🟡 结构与其他用户文档不一致                     │   │
│  │                                                      │   │
│  │ 🟡 users/principals/u-wang.md                       │   │
│  │    └─ 🟡 声明了 auth.login 能力，但缺少 auth 字段    │   │
│  │                                                      │   │
│  │ 🔵 genesis/客户管理.md                              │   │
│  │    └─ 🔵 建议添加 atlas.function 声明               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [查看完整报告]  [导出报告]  [忽略选中]                      │
└─────────────────────────────────────────────────────────────┘
```

### 7.6 实时编辑校验

```typescript
// 编辑器中实时显示校验结果
function DocumentEditor({ document }) {
  const [lintResults, setLintResults] = useState([]);
  
  // 实时校验（防抖）
  useEffect(() => {
    const timer = setTimeout(async () => {
      const results = await lintDocument(document);
      setLintResults(results);
    }, 500);
    return () => clearTimeout(timer);
  }, [document]);
  
  return (
    <div>
      {/* 编辑器顶部校验状态 */}
      <LintStatusBar results={lintResults} />
      
      {/* 编辑区域 */}
      <Editor
        value={document.content}
        markers={lintResults.map(r => ({
          line: r.location.line,
          severity: r.level,
          message: r.message,
        }))}
      />
      
      {/* 底部问题面板 */}
      <ProblemsPanel issues={lintResults} />
    </div>
  );
}
```

### 7.7 CLI 校验命令

```bash
# 校验所有文档
atlas lint

# 校验指定文档
atlas lint users/principals/u-wang.md

# 校验指定功能类型的文档
atlas lint --function principal

# 只显示错误
atlas lint --level error

# 输出 JSON 格式
atlas lint --format json > lint-report.json

# 自动修复可修复的问题
atlas lint --fix
```

### 7.8 校验规则配置

文件：`.atlas/lint-config.yaml`

```yaml
# 校验配置
version: "1.0"

# 全局规则
rules:
  frontmatter-required: error
  version-required: error
  document-type-required: warning
  
# 按功能类型的规则
functions:
  principal:
    id-required: error
    emails-required: error
    auth-recommended: warning
    display-name-recommended: info
  
  entity_list:
    directory-index-required: error
    source-required: error

# 忽略的文件
ignore:
  - "drafts/**"
  - "archive/**"

# 忽略的规则（全局）
disable:
  - structure-consistency  # 暂时关闭一致性检查
```

---

## 八、开发任务

### Phase 3.3.1: 功能声明基础设施 (2-3天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 定义 atlas frontmatter schema | 完整的功能声明规范 | P0 |
| FunctionRegistry 服务 | 扫描、注册、查询功能 | P0 |
| 功能注册表生成器 | 生成 .atlas/functions.json | P0 |
| 功能查询 API | /api/functions/* | P0 |
| 按功能查找数据源 API | /api/functions/:func/data | P0 |

### Phase 3.3.2: 文档校验系统 (2-3天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| DocumentLinter 服务 | 核心校验引擎 | P0 |
| 校验规则定义 | 基础规则 + 功能特定规则 | P0 |
| 一致性检查器 | 跨文档结构一致性分析 | P1 |
| 校验报告生成 | JSON + 人类可读格式 | P0 |
| 校验 API | /api/lint/* | P0 |
| 前端校验面板 | 问题列表 + 修复建议 | P1 |
| 实时编辑校验 | 编辑时即时反馈 | P2 |

### Phase 3.3.3: Auth 系统改造 (1-2天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| Auth API 使用功能查找 | 登录验证改用 functionRegistry | P0 |
| 用户文档添加 auth 字段 | password_hash 等 | P0 |
| 会话管理优化 | 基于 principal 文档 | P1 |

### Phase 3.3.4: 前端渲染系统 (3-4天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 渲染器选择器 | 根据 atlas.function 选择渲染器 | P0 |
| EntityListRenderer | 列表页通用渲染器 | P0 |
| DirectoryIndexRenderer | 目录/功能索引块渲染器 | P0 |
| 多视图切换 | 卡片/表格视图 | P0 |
| 分页组件 | 通用分页 | P1 |
| 搜索组件 | 列表页搜索 | P1 |
| 排序组件 | 列表页排序 | P2 |

### Phase 3.3.5: 动态导航 (1-2天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 导航 API | /api/navigation/sidebar | P0 |
| DynamicSidebar 组件 | 基于功能声明渲染导航 | P0 |
| 导航配置编辑 | 在文档中修改导航配置 | P2 |

### Phase 3.3.6: 测试与文档 (2天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| E2E 测试 | 功能声明完整流程测试 | P0 |
| 校验系统测试 | 各类错误场景覆盖 | P0 |
| 迁移现有文档 | 添加 atlas 声明到现有文档 | P0 |
| 使用文档 | 功能声明使用指南 | P1 |

---

## 九、示例文档

### 9.1 用户文档（Principal）

```yaml
---
version: "1.0"
atlas:
  function: principal
  capabilities: [auth.login, auth.session]
  navigation:
    visible: false
---

# 王编辑 {#u-wang}

\```yaml
type: principal
id: u-wang
display_name: 王编辑
status: active

identity:
  emails: [wang@zhongxin.com]
  phones: ["138-0000-0001"]
  avatar: { token: avatar.default }

auth:
  password_hash: "$2b$10$xxxxx"
  last_login: 2025-01-01T10:00:00Z
  mfa_enabled: false

# 自定义扩展
employee:
  department: 创意部
  title: 创意总监
\```
```

### 9.2 用户列表页

```yaml
---
version: "1.0"
atlas:
  function: entity_list
  entity_type: user
  capabilities: [nav.sidebar]
  navigation:
    visible: true
    icon: users
    label: 用户管理
    order: 10
---

# 用户管理

\```yaml
type: directory_index
id: user-list
title: 系统用户

source:
  function: principal

display:
  fields:
    - { path: display_name, label: 姓名 }
    - { path: identity.emails[0], label: 邮箱 }
    - { path: status, label: 状态 }
  views:
    - { type: card, default: true, columns: 3 }
    - { type: table }
  pagination:
    page_size: 20

interaction:
  click: open_document
  search:
    enabled: true
\```
```

### 9.3 客户列表页

```yaml
---
version: "1.0"
atlas:
  function: entity_list
  entity_type: client
  capabilities: [nav.sidebar]
  navigation:
    visible: true
    icon: building
    label: 客户管理
    order: 20
---

# 客户管理

\```yaml
type: directory_index
id: client-list
title: 客户列表

source:
  function: client

display:
  fields:
    - { path: title, label: 客户名称 }
    - { path: category, label: 类别, type: badge }
    - { path: status, label: 状态 }
  views:
    - { type: table, default: true }
    - { type: card }
\```
```

### 9.4 客户详情文档

```yaml
---
version: "1.0"
atlas:
  function: client
  capabilities: [api.protected]
  navigation:
    visible: false
---

# 中信出版社 {#client-zhongxin}

\```yaml
type: client
id: client-zhongxin
title: 中信出版社
status: active
category: { ref: "#cat-publisher" }

contact:
  address: 北京市朝阳区
  phone: "010-12345678"
  
# 自定义扩展
business:
  annual_revenue: 5000000
  cooperation_years: 5
  key_contacts:
    - { ref: "users/principals/u-wang.md#u-wang" }
\```
```

### 9.5 系统配置文档

```yaml
---
version: "1.0"
atlas:
  function: config
  capabilities: [api.admin]
  navigation:
    visible: false
---

# 系统配置 {#system-config}

\```yaml
type: config
id: system-config

settings:
  site_name: "ATLAS 文档系统"
  default_language: zh-CN
  pagination_size: 20
  
auth:
  session_timeout: 3600
  max_login_attempts: 5
  
features:
  enable_search: true
  enable_export: true
  enable_ai: false
\```
```

---

## 十、验收标准

### 功能验收

- [ ] 文档添加 `atlas.function` 后，系统能正确识别
- [ ] 功能注册表能正确扫描所有文档
- [ ] API 能按功能查找文档（不依赖路径）
- [ ] 前端能根据功能选择正确的渲染器
- [ ] 侧边栏能根据功能声明动态生成
- [ ] Auth 系统能使用功能查找验证登录

### 校验验收

- [ ] 索引构建时自动执行校验
- [ ] 校验报告能正确分类错误级别
- [ ] 前端能显示校验问题列表
- [ ] 同类文档结构一致性检查生效
- [ ] 校验配置文件能自定义规则

### 自由度验收

- [ ] 文档可以放在任意目录，功能不受影响
- [ ] 用户文档的扩展字段完全自由
- [ ] 列表页配置完全在文档中定义（source.function 或 source.directory）
- [ ] 导航结构完全由文档声明决定

### 哲学验收

- [ ] 所有业务逻辑都在文档中定义
- [ ] 代码不包含任何业务硬编码
- [ ] 文档可独立迁移（换显现层仍可工作）

---

## 十一、时间估算

| 阶段 | 预计时间 |
|------|---------|
| Phase 3.3.1 功能声明基础 | 2-3 天 |
| Phase 3.3.2 文档校验系统 | 2-3 天 |
| Phase 3.3.3 Auth 改造 | 1-2 天 |
| Phase 3.3.4 前端渲染 | 3-4 天 |
| Phase 3.3.5 动态导航 | 1-2 天 |
| Phase 3.3.6 测试与文档 | 2 天 |
| **总计** | **11-16 天** |

---

## 十二、后续扩展

Phase 3.3 完成后，可以轻松扩展：

### 更多功能类型
- `workflow` - 工作流定义
- `report` - 报表模板
- `form` - 表单定义
- `template` - 文档模板
- `automation` - 自动化规则

### 更多渲染视图
- 看板视图 (Kanban)
- 日历视图 (Calendar)
- 甘特图 (Gantt)
- 关系图 (Graph)
- 时间线 (Timeline)

### 更多能力标签
- `export.*` - 导出能力
- `import.*` - 导入能力
- `sync.*` - 同步能力
- `webhook.*` - Webhook 能力
- `schedule.*` - 定时任务能力

### AI 集成准备
- AI 可读取 functions.json 理解系统结构
- AI 可通过功能查找定位相关文档
- AI 可基于校验规则生成合规文档
- AI 可理解文档间的关系和依赖

---

## 十三、迁移指南

### 现有文档迁移步骤

1. **用户文档迁移**
```yaml
# 添加到现有 principal 文档的 frontmatter
atlas:
  function: principal
  capabilities: [auth.login, auth.session]
  navigation:
    visible: false
```

2. **列表页迁移**
```yaml
# 添加到列表页文档的 frontmatter
atlas:
  function: entity_list
  entity_type: user
  capabilities: [nav.sidebar]
  navigation:
    visible: true
    icon: users
    label: 用户管理
```

3. **客户文档迁移**
```yaml
# 添加到客户文档的 frontmatter
atlas:
  function: client
  capabilities: [api.protected]
  navigation:
    visible: false
```

### 迁移验证

```bash
# 运行校验检查迁移结果
atlas lint --function principal
atlas lint --function entity_list
atlas lint --function client

# 查看功能注册表
cat .atlas/functions.json | jq '.functions | keys'
```

---

## 十四、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 现有文档结构不一致 | 校验报告大量警告 | 提供自动修复脚本 |
| 功能类型不够用 | 无法表达某些业务 | 设计可扩展的类型系统 |
| 性能问题（大量文档） | 索引构建慢 | 增量索引 + 缓存优化 |
| 前端渲染复杂 | 开发周期延长 | 先实现核心视图，后续迭代 |

---

## 十五、成功标志

Phase 3.3 成功的标志：

1. **新增列表页**：只需创建一个 .md 文件，配置 `atlas.function: entity_list`，系统自动渲染
2. **新增实体类型**：只需创建文档并声明功能，无需改代码
3. **导航自动化**：添加 `nav.sidebar` 能力，自动出现在侧边栏
4. **校验自动化**：索引时自动检查，问题一目了然
5. **AI 可理解**：AI 能通过读取 functions.json 理解整个系统结构

---

## 十六、总结

### Phase 3.3 的本质

Phase 3.3 不是一次功能开发，而是一次**范式升华**：

```
Phase 3.2 之前          Phase 3.3 之后
─────────────────────────────────────────────────
目录结构 → 功能          功能声明 → 功能
代码定义渲染             文档定义渲染
硬编码导航               声明式导航
被动校验                 主动校验
```

### 核心交付物

| 交付物 | 说明 |
|--------|------|
| `atlas` frontmatter 规范 | 文档功能声明的标准格式 |
| `.atlas/functions.json` | 功能注册表（系统的元数据） |
| `.atlas/lint-report.json` | 校验报告（系统的健康检查） |
| FunctionRegistry 服务 | 功能发现与查询引擎 |
| DocumentLinter 服务 | 文档校验引擎 |
| 动态渲染器 | 根据功能选择渲染方式 |
| 动态导航 | 根据声明生成菜单 |

### 一句话总结

> **Phase 3.3 让文档真正成为系统本身，代码只是它的显现工具。**

---

*文档版本: 1.1*
*创建日期: 2025-01-02*
*完成日期: 2026-01-02*
*状态: ✅ 已完成*

---

## 实施记录

### 已完成功能

| 功能 | 状态 | 说明 |
|------|------|------|
| `atlas` frontmatter 规范 | ✅ | 支持 function, entity_type, capabilities, navigation |
| FunctionRegistry 服务 | ✅ | `backend/src/services/function-registry.ts` |
| DocumentLinter 服务 | ✅ | `backend/src/services/document-linter.ts` |
| Auth 系统重构 | ✅ | 基于 Principal 文档认证，不再依赖 users.json |
| 动态渲染器 | ✅ | `frontend/src/components/RendererSelector.tsx` |
| 动态导航 | ✅ | 根据 `atlas.navigation` 生成侧边栏 |
| API 端点 | ✅ | `/api/functions`, `/api/navigation`, `/api/lint` |
| 热刷新机制 | ✅ | 重建索引时同步刷新 FunctionRegistry |
| 全局重建索引按钮 | ✅ | 移至页面头部，任意页面可用 |

### 额外实现（超出原计划）

| 功能 | 说明 |
|------|------|
| LabelRegistry 标签注册制 | 字段标签 + 图标的统一管理 |
| IconPicker 组件 | 公共图标选择器，分类显示 Lucide 图标 |
| 系统设置页面 | `/settings/labels` 标签管理界面 |
| 字段值格式化 | 数组、Token、嵌套对象的友好显示 |

### 迁移的文档

- 13 个 Principal 文档（用户）
- 2 个 Profile 文档（员工档案、客户联系人档案）
- 1 个用户列表文档（`directory_index` 块）
- 1 个客户管理文档

### 关键代码文件

```
backend/
├── src/
│   ├── adl/types.ts          # AtlasFrontmatter 类型定义
│   ├── adl/parser.ts         # atlas 字段解析
│   ├── services/
│   │   ├── function-registry.ts   # 功能注册表
│   │   ├── document-linter.ts     # 文档校验
│   │   ├── label-registry.ts      # 标签注册表
│   │   └── label-config.ts        # 标签配置服务
│   └── api/
│       ├── functions.ts      # 功能 API
│       ├── navigation.ts     # 导航 API
│       ├── lint.ts           # 校验 API
│       └── labels.ts         # 标签 API

frontend/
├── src/
│   ├── components/
│   │   ├── RendererSelector.tsx   # 动态渲染器选择
│   │   ├── ui/icon-picker.tsx     # 图标选择器
│   │   └── labels/LabeledField.tsx
│   ├── pages/settings/
│   │   ├── SettingsPage.tsx       # 设置页面框架
│   │   └── LabelSettings.tsx      # 标签管理
│   └── providers/
│       └── LabelProvider.tsx      # 标签上下文
```

