---
slug: doc-am8k1s
---
# Phase 3.5: 固定键系统 + 智能编辑器 (Fixed Key System + Smart Editor)

> **核心理念**：文档的通用元数据由系统自动管理，用户专注于业务内容，前端智能分区渲染，并提供类 Notion 的编辑体验。

---

## 〇、设计哲学

### 问题背景

当前 ATLAS 文档存在以下问题：

```yaml
# 问题 1：用户需要手动填写大量元数据
---
version: "1.0"              # 每次都要写
document_type: facts        # 每次都要写
created: 2025-01-01         # 容易忘记填
author: system              # 不知道该填什么
atlas:
  function: principal       # 必须手动声明
---

# 问题 2：元数据和业务数据混在一起，干扰阅读
type: principal
id: u-wang                  # ← 用户关心
display_name: 王编辑         # ← 用户关心
status: active              # ← 用户关心
version: "1.0"              # ← 不关心，但混在一起
created: 2025-01-01         # ← 不关心，但混在一起
author: system              # ← 不关心，但混在一起
```

### 核心决策

| 原则 | 说明 |
|------|------|
| **系统自动补齐** | id、created、updated 等元数据由系统自动生成 |
| **文档头部存储** | 为 MD 编辑器友好，所有元数据存储在 frontmatter |
| **前端分区渲染** | 元数据渲染在底部，业务字段渲染在主体区 |
| **配置驱动** | 哪些字段属于"元数据"由系统配置决定 |

### 目标体验

```
用户创建文档时：
┌────────────────────────────────┐
│ # 王编辑 {#u-wang}              │  ← 只需要写这些
│                                │
│ ```yaml                        │
│ type: principal                │
│ display_name: 王编辑            │
│ identity:                      │
│   emails: [wang@example.com]   │
│ ```                            │
└────────────────────────────────┘

系统自动补齐后：
┌────────────────────────────────┐
│ ---                            │
│ version: "1.0"                 │  ← 系统自动添加
│ document_type: facts           │  ← 系统自动推断
│ created: 2025-01-02T10:00:00Z  │  ← 系统自动添加
│ updated: 2025-01-02T10:00:00Z  │  ← 系统自动添加
│ author: u-admin                │  ← 系统自动添加
│ atlas:                         │
│   function: principal          │  ← 系统自动推断
│ ---                            │
│                                │
│ # 王编辑 {#u-wang}              │
│ ...                            │
└────────────────────────────────┘

前端渲染效果：
┌────────────────────────────────────────────┐
│  王编辑                           [编辑]    │  ← 标题区
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                            │
│  📋 身份信息                                │  ← 业务字段（主体区）
│     ✉️ 邮箱: wang@example.com              │
│                                            │
│  ──────────────────────────────────────────│
│  📄 文档信息                         [展开] │  ← 元数据（底部区，默认折叠）
│     创建: 2025-01-02 · 作者: 管理员         │
└────────────────────────────────────────────┘
```

---

## 一、固定键分类

### 1.1 键类型定义

```
Fixed Keys（固定键）
│
├── 📌 Structural Keys（结构键）—— Block 级别，存在于 machine zone
│   ├── type        # 必填，Block 类型
│   ├── id          # 必填，唯一标识（可自动生成）
│   └── status      # 必填，状态（默认 active）
│
├── 📋 Metadata Keys（元数据键）—— Document 级别，存在于 frontmatter
│   ├── version         # 文档版本（默认 "1.0"）
│   ├── document_type   # 文档类型（可自动推断）
│   ├── created         # 创建时间（自动生成）
│   ├── updated         # 更新时间（自动更新）
│   └── author          # 作者（自动填充当前用户）
│
├── 🎯 Function Keys（功能键）—— Document 级别，存在于 frontmatter.atlas
│   ├── atlas.function      # 功能身份（可自动推断）
│   ├── atlas.entity_type   # 实体类型
│   ├── atlas.capabilities  # 能力标签
│   └── atlas.navigation    # 导航配置
│
└── 🔧 System Keys（系统键）—— 仅系统使用，不显示
    ├── _checksum       # 内容校验和
    ├── _indexed_at     # 索引时间
    └── _source_hash    # 源文件哈希
```

### 1.2 键的存储位置

| 键类型 | 存储位置 | 示例 |
|--------|----------|------|
| Structural Keys | Block 的 machine zone | `type: principal` |
| Metadata Keys | Document 的 frontmatter | `created: 2025-01-02` |
| Function Keys | Document 的 `frontmatter.atlas` | `atlas.function: principal` |
| System Keys | `.atlas/index/` 索引文件 | 不存储在文档中 |

### 1.3 示例：完整文档结构

```yaml
---
# === Metadata Keys ===
version: "1.0"
document_type: facts
created: 2025-01-02T10:00:00.000Z
updated: 2025-01-02T15:30:00.000Z
author: u-admin

# === Function Keys ===
atlas:
  function: principal
  capabilities:
    - auth.login
    - auth.session
  navigation:
    visible: false
---

# 王编辑 {#u-wang}

```yaml
# === Structural Keys ===
type: principal
id: u-wang
status: active

# === Business Keys（业务键，用户自定义）===
display_name: 王编辑
identity:
  emails:
    - wang@example.com
  phones:
    - "138-0000-0001"
```

这是王编辑的个人主页。
```

---

## 二、自动补齐机制

### 2.1 补齐策略

| 键 | 补齐时机 | 生成规则 | 可覆盖 |
|-----|----------|----------|--------|
| `id` | 索引时 | 基于 `type` + `title/display_name` 生成 slug | ✅ |
| `status` | 索引时 | 默认 `active` | ✅ |
| `version` | 首次索引时 | 默认 `"1.0"` | ✅ |
| `document_type` | 索引时 | 基于 `atlas.function` 推断 | ✅ |
| `created` | 首次索引时 | 当前时间戳 | ❌ |
| `updated` | 每次 Proposal 执行时 | 当前时间戳 | ❌ |
| `author` | 首次索引时 | 当前登录用户 | ✅ |
| `atlas.function` | 索引时 | 基于 `type` 自动推断 | ✅ |

### 2.2 ID 自动生成规则

```typescript
function generateId(block: Block): string {
  const type = block.machine.type;
  const title = block.machine.title || block.machine.display_name || block.heading;
  
  // 1. 移除 Markdown 语法
  const cleanTitle = title.replace(/[#\[\]()]/g, '');
  
  // 2. 转换为 slug
  const slug = slugify(cleanTitle, {
    lower: true,
    strict: true,
    locale: 'zh'  // 支持中文拼音转换
  });
  
  // 3. 添加类型前缀
  const prefix = TYPE_PREFIX_MAP[type] || type.charAt(0);
  
  // 4. 确保唯一性（如有冲突添加数字后缀）
  return ensureUnique(`${prefix}-${slug}`);
}

// 类型前缀映射
const TYPE_PREFIX_MAP = {
  principal: 'u',
  profile: 'p',
  client: 'c',
  project: 'proj',
  service: 'svc',
  category: 'cat',
  config: 'cfg',
  registry: 'reg'
};

// 示例：
// type: principal, title: "王编辑" → "u-wang-bian-ji"
// type: client, title: "中信出版社" → "c-zhong-xin-chu-ban-she"
// type: project, title: "2025品牌升级" → "proj-2025-pin-pai-sheng-ji"
```

### 2.3 Function 自动推断规则

```typescript
function inferFunction(block: Block): string | undefined {
  const type = block.machine.type;
  
  // 直接映射
  const FUNCTION_MAP: Record<string, string> = {
    principal: 'principal',
    client: 'client',
    project: 'project',
    service: 'service',
    category: 'category',
    config: 'config',
    registry: 'registry',
    directory_index: 'entity_list'
  };
  
  return FUNCTION_MAP[type];
}

function inferDocumentType(atlasFunction: string): string {
  const DOCTYPE_MAP: Record<string, string> = {
    principal: 'facts',
    client: 'facts',
    project: 'project',
    config: 'system',
    registry: 'system',
    entity_list: 'navigation'
  };
  
  return DOCTYPE_MAP[atlasFunction] || 'facts';
}
```

### 2.4 补齐流程

```
文档保存/索引触发
        │
        ▼
┌───────────────────────────────────────┐
│  1. 解析文档                           │
│     - 提取 frontmatter                │
│     - 解析 blocks                     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  2. 检查必填键                         │
│     - type 必须存在                   │
│     - 其他键检查是否需要补齐            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  3. 执行自动补齐                       │
│     - Block 级：id, status            │
│     - Document 级：version, created...│
│     - Function 级：atlas.function...  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  4. 写回文档（如有变更）               │
│     - 生成 Proposal                   │
│     - 或直接写入（系统操作）            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  5. 更新索引                           │
└───────────────────────────────────────┘
```

---

## 三、渲染分区系统

### 3.1 分区定义

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │            HERO ZONE（英雄区）                 │ │
│  │                                              │ │
│  │  标题、状态徽章、核心身份信息                  │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │            BODY ZONE（主体区）                 │ │
│  │                                              │ │
│  │  业务字段                                     │ │
│  │  - identity (身份信息)                       │ │
│  │  - employee (员工信息)                       │ │
│  │  - contact (联系方式)                        │ │
│  │  - 其他自定义业务字段                         │ │
│  │                                              │ │
│  │  Human Zone（正文内容）                       │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │            FOOTER ZONE（底部区）              │ │
│  │                                              │ │
│  │  📄 文档信息                          [展开] │ │
│  │  创建: 2025-01-02 · 更新: 2025-01-02         │ │
│  │  作者: 管理员 · 版本: 1.0                     │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 3.2 字段分区配置

**文件**：`.atlas/config/display.json`

```json
{
  "version": "1.0",
  "zones": {
    "hero": {
      "description": "标题区，显示核心身份信息",
      "fields": [
        "title",
        "display_name",
        "status"
      ],
      "showStatusBadge": true
    },
    
    "body": {
      "description": "主体区，显示业务字段",
      "exclude": [
        "type",
        "id",
        "status",
        "title",
        "display_name",
        "$display",
        "_*"
      ],
      "excludeMetadata": true
    },
    
    "footer": {
      "description": "底部区，显示文档元数据",
      "fields": [
        "created",
        "updated",
        "author",
        "version",
        "document_type"
      ],
      "defaultCollapsed": true,
      "showToggle": true
    }
  },
  
  "fieldZoneOverrides": {
    "description": "字段分区覆盖，某些业务文档可能需要特殊处理",
    "client": {
      "footer": ["contract_date", "last_contact"]
    }
  }
}
```

### 3.3 分区渲染逻辑

```typescript
// frontend/src/components/document/ZonedBlockRenderer.tsx

interface ZoneConfig {
  hero: string[];
  body: { exclude: string[]; excludeMetadata: boolean };
  footer: { fields: string[]; defaultCollapsed: boolean };
}

function ZonedBlockRenderer({ block, document }: Props) {
  const zoneConfig = useDisplayConfig();
  const { resolveLabel, getIcon } = useLabels();
  
  // 分离字段到不同区域
  const { heroFields, bodyFields, footerFields } = useMemo(() => {
    return categorizeFields(block, document, zoneConfig);
  }, [block, document, zoneConfig]);
  
  return (
    <article className="block-container">
      {/* Hero Zone */}
      <HeroZone 
        title={block.machine.title || block.machine.display_name || block.heading}
        status={block.machine.status}
        fields={heroFields}
      />
      
      {/* Body Zone */}
      <BodyZone fields={bodyFields}>
        {/* Human Zone (Markdown content) */}
        {block.body && <MarkdownContent content={block.body} />}
      </BodyZone>
      
      {/* Footer Zone */}
      <FooterZone 
        fields={footerFields}
        defaultCollapsed={zoneConfig.footer.defaultCollapsed}
      />
    </article>
  );
}

function categorizeFields(
  block: Block, 
  document: ADLDocument, 
  config: ZoneConfig
): CategorizedFields {
  const machine = block.machine;
  const frontmatter = document.frontmatter;
  
  const heroFields: Field[] = [];
  const bodyFields: Field[] = [];
  const footerFields: Field[] = [];
  
  // 1. Hero 区字段
  for (const key of config.hero.fields) {
    if (machine[key] !== undefined) {
      heroFields.push({ key, value: machine[key], source: 'machine' });
    }
  }
  
  // 2. Footer 区字段（从 frontmatter）
  for (const key of config.footer.fields) {
    if (frontmatter[key] !== undefined) {
      footerFields.push({ key, value: frontmatter[key], source: 'frontmatter' });
    }
  }
  
  // 3. Body 区字段（排除 Hero 和系统字段）
  const excludeSet = new Set([
    ...config.hero.fields,
    ...config.body.exclude,
    ...SYSTEM_KEYS
  ]);
  
  for (const [key, value] of Object.entries(machine)) {
    if (!excludeSet.has(key) && !key.startsWith('_') && !key.startsWith('$')) {
      bodyFields.push({ key, value, source: 'machine' });
    }
  }
  
  return { heroFields, bodyFields, footerFields };
}
```

### 3.4 Footer Zone 组件

```tsx
// frontend/src/components/document/FooterZone.tsx

function FooterZone({ fields, defaultCollapsed }: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { getLabel, getIcon } = useLabels();
  
  if (fields.length === 0) return null;
  
  return (
    <footer className="mt-8 border-t border-slate-200 pt-4">
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
      >
        <FileText className="w-4 h-4" />
        <span>文档信息</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          collapsed ? "" : "rotate-180"
        )} />
      </button>
      
      <Collapsible open={!collapsed}>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {fields.map(({ key, value }) => (
            <div key={key} className="flex flex-col">
              <span className="text-slate-400 text-xs">
                {getLabel(key)}
              </span>
              <span className="text-slate-600">
                {formatMetadataValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </Collapsible>
    </footer>
  );
}

function formatMetadataValue(key: string, value: unknown): string {
  switch (key) {
    case 'created':
    case 'updated':
      return formatDateTime(value as string);
    case 'author':
      return resolveAuthorName(value as string);
    default:
      return String(value);
  }
}
```

---

## 四、后端实现

### 4.1 服务结构

```
backend/src/services/
├── fixed-keys.ts           # 固定键管理（定义 + 验证）
├── auto-complete.ts        # 自动补齐服务
├── display-config.ts       # 显示配置服务
└── id-generator.ts         # ID 生成器
```

### 4.2 FixedKeysService

```typescript
// backend/src/services/fixed-keys.ts

// 固定键定义
export const FIXED_KEYS = {
  structural: {
    type: { required: true, autoGenerate: false },
    id: { required: true, autoGenerate: true },
    status: { required: true, autoGenerate: true, default: 'active' }
  },
  
  metadata: {
    version: { required: false, autoGenerate: true, default: '1.0' },
    document_type: { required: false, autoGenerate: true },
    created: { required: false, autoGenerate: true, immutable: true },
    updated: { required: false, autoGenerate: true },
    author: { required: false, autoGenerate: true }
  },
  
  function: {
    'atlas.function': { required: false, autoGenerate: true },
    'atlas.entity_type': { required: false, autoGenerate: false },
    'atlas.capabilities': { required: false, autoGenerate: false },
    'atlas.navigation': { required: false, autoGenerate: false }
  }
} as const;

// 系统键（不显示，仅索引使用）
export const SYSTEM_KEYS = [
  '_checksum',
  '_indexed_at', 
  '_source_hash'
];

// 验证固定键
export function validateFixedKeys(block: Block): ValidationResult {
  const errors: ValidationError[] = [];
  
  // 检查必填键
  for (const [key, config] of Object.entries(FIXED_KEYS.structural)) {
    if (config.required && !block.machine[key]) {
      errors.push({
        level: 'error',
        key,
        message: `缺少必填字段: ${key}`
      });
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 4.3 AutoCompleteService

```typescript
// backend/src/services/auto-complete.ts

export interface AutoCompleteResult {
  document: ADLDocument;
  changes: AutoCompleteChange[];
  needsWrite: boolean;
}

export interface AutoCompleteChange {
  type: 'frontmatter' | 'block';
  key: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
}

export async function autoCompleteDocument(
  document: ADLDocument,
  context: AutoCompleteContext
): Promise<AutoCompleteResult> {
  const changes: AutoCompleteChange[] = [];
  const updatedDoc = { ...document };
  
  // 1. 补齐 Frontmatter 元数据
  updatedDoc.frontmatter = autoCompleteFrontmatter(
    document.frontmatter,
    context,
    changes
  );
  
  // 2. 补齐每个 Block 的结构键
  updatedDoc.blocks = document.blocks.map(block => 
    autoCompleteBlock(block, context, changes)
  );
  
  // 3. 推断 atlas.function
  if (!updatedDoc.frontmatter.atlas?.function) {
    const inferredFunction = inferFunctionFromBlocks(updatedDoc.blocks);
    if (inferredFunction) {
      updatedDoc.frontmatter.atlas = {
        ...updatedDoc.frontmatter.atlas,
        function: inferredFunction
      };
      changes.push({
        type: 'frontmatter',
        key: 'atlas.function',
        oldValue: undefined,
        newValue: inferredFunction,
        reason: '基于 Block 类型自动推断'
      });
    }
  }
  
  return {
    document: updatedDoc,
    changes,
    needsWrite: changes.length > 0
  };
}

function autoCompleteFrontmatter(
  frontmatter: Record<string, any>,
  context: AutoCompleteContext,
  changes: AutoCompleteChange[]
): Record<string, any> {
  const updated = { ...frontmatter };
  const now = new Date().toISOString();
  
  // version
  if (!updated.version) {
    updated.version = '1.0';
    changes.push({
      type: 'frontmatter',
      key: 'version',
      oldValue: undefined,
      newValue: '1.0',
      reason: '默认版本'
    });
  }
  
  // created（仅首次）
  if (!updated.created) {
    updated.created = now;
    changes.push({
      type: 'frontmatter',
      key: 'created',
      oldValue: undefined,
      newValue: now,
      reason: '首次索引时间'
    });
  }
  
  // updated（每次更新）
  if (context.isUpdate) {
    const oldUpdated = updated.updated;
    updated.updated = now;
    changes.push({
      type: 'frontmatter',
      key: 'updated',
      oldValue: oldUpdated,
      newValue: now,
      reason: '更新时间'
    });
  }
  
  // author（仅首次）
  if (!updated.author && context.currentUser) {
    updated.author = context.currentUser.id;
    changes.push({
      type: 'frontmatter',
      key: 'author',
      oldValue: undefined,
      newValue: context.currentUser.id,
      reason: '当前用户'
    });
  }
  
  return updated;
}

function autoCompleteBlock(
  block: Block,
  context: AutoCompleteContext,
  changes: AutoCompleteChange[]
): Block {
  const updated = { ...block, machine: { ...block.machine } };
  
  // id
  if (!updated.machine.id) {
    const generatedId = generateId(block);
    updated.machine.id = generatedId;
    changes.push({
      type: 'block',
      key: `${block.anchor}.id`,
      oldValue: undefined,
      newValue: generatedId,
      reason: '基于标题自动生成'
    });
  }
  
  // status
  if (!updated.machine.status) {
    updated.machine.status = 'active';
    changes.push({
      type: 'block',
      key: `${block.anchor}.status`,
      oldValue: undefined,
      newValue: 'active',
      reason: '默认状态'
    });
  }
  
  return updated;
}
```

### 4.4 ID 生成器

```typescript
// backend/src/services/id-generator.ts

import { pinyin } from 'pinyin-pro';

const TYPE_PREFIX_MAP: Record<string, string> = {
  principal: 'u',
  profile: 'p',
  client: 'c',
  project: 'proj',
  service: 'svc',
  category: 'cat',
  config: 'cfg',
  registry: 'reg',
  directory_index: 'list'
};

export function generateId(block: Block): string {
  const type = block.machine.type;
  const title = block.machine.title 
    || block.machine.display_name 
    || block.heading.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '');
  
  // 获取类型前缀
  const prefix = TYPE_PREFIX_MAP[type] || type.substring(0, 3);
  
  // 转换标题为 slug
  const slug = titleToSlug(title);
  
  return `${prefix}-${slug}`;
}

function titleToSlug(title: string): string {
  // 1. 清理特殊字符
  let cleaned = title
    .replace(/[#\[\](){}]/g, '')
    .trim();
  
  // 2. 中文转拼音
  if (/[\u4e00-\u9fa5]/.test(cleaned)) {
    cleaned = pinyin(cleaned, {
      toneType: 'none',
      type: 'array'
    }).join('-');
  }
  
  // 3. 转换为 kebab-case
  const slug = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);  // 限制长度
  
  return slug || 'unnamed';
}

// 确保唯一性（需要传入已存在的 ID 集合）
export function ensureUniqueId(
  baseId: string, 
  existingIds: Set<string>
): string {
  if (!existingIds.has(baseId)) {
    return baseId;
  }
  
  let counter = 1;
  while (existingIds.has(`${baseId}-${counter}`)) {
    counter++;
  }
  
  return `${baseId}-${counter}`;
}
```

### 4.5 API 端点

```typescript
// backend/src/api/auto-complete.ts

router.post('/api/documents/auto-complete', requireAuth, async (req, res) => {
  const { path } = req.body;
  
  // 1. 获取文档
  const document = await registry.getDocument(path);
  
  // 2. 执行自动补齐
  const result = await autoCompleteDocument(document, {
    currentUser: req.user,
    isUpdate: false,
    existingIds: await getAllExistingIds()
  });
  
  // 3. 如果有变更，生成 Proposal 或直接写入
  if (result.needsWrite) {
    // 返回变更预览，让用户确认
    res.json({
      changes: result.changes,
      preview: generateDocumentPreview(result.document)
    });
  } else {
    res.json({ changes: [], message: '文档已完整，无需补齐' });
  }
});

// 批量自动补齐（用于索引重建时）
router.post('/api/documents/auto-complete-all', requireAuth, requireAdmin, async (req, res) => {
  const documents = await registry.getAllDocuments();
  const results: AutoCompleteResult[] = [];
  
  for (const doc of documents) {
    const result = await autoCompleteDocument(doc, {
      currentUser: req.user,
      isUpdate: false,
      existingIds: collectExistingIds(results)
    });
    
    if (result.needsWrite) {
      results.push(result);
    }
  }
  
  res.json({
    totalDocuments: documents.length,
    documentsNeedingUpdate: results.length,
    changes: results.map(r => ({
      path: r.document.path,
      changes: r.changes
    }))
  });
});
```

---

## 五、前端实现

### 5.1 组件结构

```
frontend/src/
├── components/
│   └── document/
│       ├── ZonedBlockRenderer.tsx    # 分区渲染器
│       ├── HeroZone.tsx              # 标题区
│       ├── BodyZone.tsx              # 主体区
│       ├── FooterZone.tsx            # 底部区
│       └── MetadataPanel.tsx         # 元数据面板
├── hooks/
│   └── useDisplayConfig.ts           # 显示配置 Hook
└── api/
    └── display-config.ts             # 显示配置 API
```

### 5.2 显示配置 Hook

```typescript
// frontend/src/hooks/useDisplayConfig.ts

interface DisplayConfig {
  zones: {
    hero: { fields: string[]; showStatusBadge: boolean };
    body: { exclude: string[]; excludeMetadata: boolean };
    footer: { fields: string[]; defaultCollapsed: boolean; showToggle: boolean };
  };
  fieldZoneOverrides: Record<string, Partial<DisplayConfig['zones']>>;
}

export function useDisplayConfig() {
  const [config, setConfig] = useState<DisplayConfig | null>(null);
  
  useEffect(() => {
    fetch('/api/display-config')
      .then(res => res.json())
      .then(setConfig);
  }, []);
  
  return config;
}

// 获取特定类型的分区配置
export function useZoneConfig(entityType?: string) {
  const config = useDisplayConfig();
  
  return useMemo(() => {
    if (!config) return null;
    
    // 合并默认配置和类型特定覆盖
    if (entityType && config.fieldZoneOverrides[entityType]) {
      return mergeDeep(config.zones, config.fieldZoneOverrides[entityType]);
    }
    
    return config.zones;
  }, [config, entityType]);
}
```

---

## 六、智能 MD 编辑器 (Smart MD Editor)

### 6.1 三种文档视图模式

Phase 3.5 将文档视图从 2 种扩展为 3 种：

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📖 阅读态        📝 表单编辑态        ✏️ MD 编辑态            │
│   (Read View)     (Form Edit)         (MD Editor)              │
│                                                                 │
│   ┌─────────┐     ┌─────────┐         ┌─────────┐              │
│   │ 纯展示   │     │ 字段表单 │         │ 原生编辑 │              │
│   │ 分区渲染 │     │ 逐项修改 │         │ 所见即得 │              │
│   │ 底部元数据│     │ 生成提案 │         │ 实时预览 │              │
│   └─────────┘     └─────────┘         └─────────┘              │
│                                                                 │
│   适用场景：       适用场景：           适用场景：                │
│   日常浏览        快速修改单字段         创建新文档               │
│   分享查看        不懂 MD 的用户        批量编辑内容              │
│                                        高级用户深度编辑           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 编辑器布局设计

```
┌────────────────────────────────────────────────────────────────────┐
│  📄 王编辑.md                    [阅读] [表单] [编辑]  [保存] [取消] │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────┐  ┌──────────────────────────────┐│
│  │                             │  │  📋 字段设置                  ││
│  │  # 王编辑 {#u-wang}          │  │  ─────────────────────────── ││
│  │                             │  │                              ││
│  │  ```yaml                    │  │  类型 [principal     ▼]      ││
│  │  type: principal            │  │                              ││
│  │  display_name: 王编辑        │  │  标识符                       ││
│  │  status: active             │  │  [u-wang              ]      ││
│  │  identity:                  │  │  ⚡ 自动生成                   ││
│  │    emails:                  │  │                              ││
│  │      - wang@example.com     │  │  状态 [● 活跃         ▼]      ││
│  │  ```                        │  │                              ││
│  │                             │  │  显示名称                     ││
│  │  这是王编辑的个人主页。       │  │  [王编辑              ]      ││
│  │                             │  │                              ││
│  │                             │  │  📧 身份信息                  ││
│  │                             │  │  ─────────────────────────── ││
│  │                             │  │  邮箱                        ││
│  │                             │  │  [wang@example.com    ]      ││
│  │                             │  │  [+ 添加邮箱]                 ││
│  │                             │  │                              ││
│  │       MD 编辑区              │  │  📄 文档元数据        [展开] ││
│  │                             │  │  创建: 2026-01-02            ││
│  │                             │  │  作者: 管理员                 ││
│  └─────────────────────────────┘  └──────────────────────────────┘│
│                                                                    │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │ ⚠️ 检测到缺少字段: id, status, version  [一键补齐]              ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 核心功能

#### A. 双向同步编辑

```
MD 编辑区                          字段设置面板
    │                                  │
    │  修改 YAML 中的字段值              │
    ├─────────────────────────────────▶│  实时更新表单
    │                                  │
    │  修改表单中的字段值                 │
    │◀─────────────────────────────────┤  实时更新 YAML
    │                                  │
```

- 左侧 MD 编辑区修改 → 右侧表单实时同步
- 右侧表单修改 → 左侧 YAML 代码块实时更新
- 保持两边状态一致

#### B. 智能自动补齐

```typescript
interface AutoCompletePanel {
  missingFields: {
    key: string;
    label: string;
    suggestedValue: any;
    reason: string;
  }[];
  
  actions: {
    autoFillAll: () => void;     // 一键补齐所有
    autoFillOne: (key: string) => void;  // 补齐单个
    dismiss: () => void;         // 忽略提示
  };
}
```

检测缺失字段时显示提示：
- `id` 缺失 → 建议值：`u-wang-bian-ji`
- `status` 缺失 → 建议值：`active`
- `version` 缺失 → 建议值：`1.0`

#### C. 实时校验

```
┌────────────────────────────────────────────────────────────────┐
│  编辑器底部状态栏                                                │
├────────────────────────────────────────────────────────────────┤
│  ✅ 文档有效  │  📝 12 行  │  🔤 UTF-8  │  ⏱️ 自动保存: 30s    │
│                                                                │
│  或者有错误时：                                                  │
│  🔴 2 个错误  │  🟡 1 个警告  │  [查看问题]                      │
└────────────────────────────────────────────────────────────────┘
```

#### D. 字段设置面板分区

```
┌──────────────────────────────────┐
│  📋 字段设置                      │
├──────────────────────────────────┤
│                                  │
│  🔒 结构字段（必填）               │
│  ───────────────────             │
│  • type      [principal]         │
│  • id        [u-wang   ] ⚡      │
│  • status    [active   ]         │
│                                  │
│  📝 业务字段                      │
│  ───────────────────             │
│  • display_name  [王编辑]         │
│  • identity                      │
│    • emails  [...]               │
│    • phones  [...]               │
│                                  │
│  📄 文档元数据            [折叠]  │
│  ───────────────────             │
│  • version   [1.0]               │
│  • created   2026-01-02          │
│  • updated   2026-01-02          │
│  • author    管理员               │
│                                  │
│  🎯 功能声明              [折叠]  │
│  ───────────────────             │
│  • function  [principal]         │
│  • capabilities  [...]           │
│                                  │
└──────────────────────────────────┘
```

### 6.4 技术选型

#### 编辑器内核选型分析

由于 ADL 严格依赖 Markdown 和 YAML（Frontmatter/Machine Block），传统的富文本编辑器（如 Draft.js）转换成本太高。建议采用**无头编辑器（Headless Editor）**架构：

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Milkdown** | 原生为 Markdown 设计，插件系统完全基于接口，完美支持"所见即所得" | 学习曲线稍陡 | ⭐⭐⭐⭐⭐ |
| **TipTap** | 基于 ProseMirror，插件极其丰富，可自定义 `ADLBlock` 节点处理 YAML | 需要更多配置 | ⭐⭐⭐⭐⭐ |
| **BlockNote** | 开箱即用、类 Notion | 定制性略差 | ⭐⭐⭐⭐ |
| **CodeMirror 6** | 性能好、扩展性强 | 偏代码编辑器风格 | ⭐⭐⭐ |
| **Monaco** | 功能强大、VS Code 体验 | 体积大、偏 IDE | ⭐⭐ |

**最终推荐**：**Milkdown** 或 **TipTap**

- **Milkdown**：原生 Markdown 支持，插件系统优雅
- **TipTap**：社区活跃，可自定义 ADLBlock 节点专门处理 YAML 机器区

**选型核心理由**：这些工具允许精确控制 DOM 结构，方便实现"分区渲染"——将 Frontmatter 隐藏在 UI 面板中，而将 Body 区块展示为可编辑的文档流。

```typescript
// 推荐技术栈组合
{
  editor: 'milkdown' | 'tiptap',  // 主编辑器（无头架构）
  yamlHighlight: 'codemirror',    // YAML 语法高亮
  pinyinConvert: 'pinyin-pro',    // 中文 ID 转拼音
  preview: 'react-markdown',      // Markdown 预览
  form: 'react-hook-form',        // 表单状态管理
  ast: 'unified/remark',          // AST 解析与序列化
}
```

### 6.5 技术实现要点

#### A. 双向数据绑定架构（AST 驱动）

**挑战**：Markdown 文本是长字符串，但 YAML 是结构化对象。手动正则替换容易破坏文档结构。

**解决方案**：编辑器内部状态维护一个 `AST`（抽象语法树）

```typescript
// AST 驱动的双向同步架构
interface EditorCore {
  // 单一数据源：AST
  ast: ADLDocumentAST;
  
  // 从 Markdown 字符串解析
  parseFromMarkdown(content: string): ADLDocumentAST;
  
  // 序列化回 Markdown 字符串
  serializeToMarkdown(ast: ADLDocumentAST): string;
  
  // 更新 AST 节点（用于表单修改）
  updateNode(path: string[], value: any): void;
  
  // 监听 AST 变化
  onASTChange(callback: (ast: ADLDocumentAST) => void): void;
}

// 工作流程
// 1. 用户修改 YAML 表单字段
// 2. 实时更新 AST 节点
// 3. 由 remark-stringify 统一序列化回 Markdown 字符串
// 4. 编辑器同步显示
```

**关键原则**：避免手动正则替换字符串，所有修改都通过 AST 节点操作。

#### B. 前后端双层补齐策略

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   前端实时反馈（用户体验层）                                      │
│   ─────────────────────────                                     │
│   • ID 自动转换：监听 title/display_name 变化                    │
│     → 若 id 为空，自动填充 u-zhangsan                            │
│   • Schema 感知：利用标签注册制                                  │
│     → 输入 YAML 键名时弹出 Autocomplete 建议                     │
│   • 实时校验：编辑时即时反馈错误/警告                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   后端最后一道防线（数据完整性层）                                 │
│   ───────────────────────────                                   │
│   • Proposal 生成前：Executor 自动注入                           │
│     → updated_at: 当前时间戳                                    │
│     → author: 操作者 ID                                         │
│   • 确保即便绕过前端，文档元数据完整性也是受控的                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// 前端实时补齐 Hook
function useAutoCompleteWatcher(ast: ADLDocumentAST) {
  useEffect(() => {
    const block = ast.blocks[0];
    const title = block.machine.title || block.machine.display_name;
    
    // 监听标题变化，自动生成 ID
    if (title && !block.machine.id) {
      const suggestedId = generateIdFromTitle(title, block.machine.type);
      showAutoCompleteSuggestion({
        field: 'id',
        value: suggestedId,
        reason: '基于标题自动生成'
      });
    }
  }, [ast]);
}

// 后端 Middleware Hook
async function proposalMiddleware(proposal: Proposal, context: Context) {
  // 强制注入 updated 和 author
  proposal.ops.push({
    op: 'update_yaml',
    anchor: '_frontmatter',
    path: 'updated',
    value: new Date().toISOString()
  });
  
  proposal.ops.push({
    op: 'update_yaml',
    anchor: '_frontmatter',
    path: 'author',
    value: context.user.id
  });
  
  return proposal;
}
```

#### C. 块级操作（Block-based Actions）

每个 ADL Block 应该是一个独立的 React 组件，参考 Notion 的块操作设计：

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ⋮⋮  # 王编辑 {#u-wang}                                         │
│  │                                                              │
│  │   ```yaml                                                    │
│  │   type: principal                                            │
│  │   display_name: 王编辑                                        │
│  │   ```                                                        │
│  │                                                              │
│  └── 六点控制柄：触发 Block 操作菜单                              │
│      ├── 📝 编辑此块                                             │
│      ├── 📋 复制此块                                             │
│      ├── ➕ 在下方插入新块                                       │
│      ├── 🗑️ 删除此块                                            │
│      └── ↕️ 拖拽排序                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```typescript
// Block 组件结构
interface ADLBlockProps {
  block: Block;
  onUpdate: (ops: Operation[]) => void;
  onInsert: (position: 'before' | 'after') => void;
  onDelete: () => void;
}

function ADLBlockComponent({ block, onUpdate, onInsert, onDelete }: ADLBlockProps) {
  return (
    <div className="adl-block group">
      {/* 六点控制柄 */}
      <BlockHandle 
        onDragStart={...}
        menuItems={[
          { label: '编辑', action: () => setEditing(true) },
          { label: '插入', action: () => onInsert('after') },
          { label: '删除', action: onDelete },
        ]}
      />
      
      {/* Block 内容 */}
      <BlockContent block={block} />
    </div>
  );
}
```

#### D. 智能引用（Smart Refs）

当用户输入 `refs:` 或 `{ ref:` 时，利用 WorkspaceService 索引进行联想补全：

```typescript
// 引用补全 Hook
function useRefAutocomplete(input: string, position: CursorPosition) {
  const [suggestions, setSuggestions] = useState<RefSuggestion[]>([]);
  
  useEffect(() => {
    // 检测是否在输入 ref 字段
    if (isRefContext(input, position)) {
      const query = extractRefQuery(input, position);
      
      // 从 WorkspaceService 搜索匹配的 Anchor
      searchAnchors(query).then(results => {
        setSuggestions(results.map(r => ({
          label: r.title,
          value: r.anchor,
          document: r.documentPath,
          type: r.type
        })));
      });
    }
  }, [input, position]);
  
  return suggestions;
}

// 补全效果
// 输入: refs: { ref: "#u-
// 弹出建议:
// ├── #u-wang (王编辑) - principals/u-wang.md
// ├── #u-li (李设计师) - principals/u-li.md
// └── #u-zhao (赵会计) - principals/u-zhao.md
```

#### E. Slash Commands（快捷命令）

实现类 Notion 的 `/` 命令，快速插入 Block 模板：

```typescript
const SLASH_COMMANDS = [
  {
    command: '/principal',
    label: '插入用户块',
    template: `
# 新用户 {#u-new}

\`\`\`yaml
type: principal
display_name: 新用户
status: active
identity:
  emails: []
\`\`\`
`
  },
  {
    command: '/client',
    label: '插入客户块',
    template: `
# 新客户 {#c-new}

\`\`\`yaml
type: client
title: 新客户
status: active
\`\`\`
`
  },
  // ...更多模板
];

// 使用 TipTap/Milkdown 的 Slash Commands 插件
editor.registerSlashCommand({
  commands: SLASH_COMMANDS,
  onSelect: (command) => {
    editor.insertContent(command.template);
  }
});
```

### 6.6 编辑器状态管理

```typescript
// frontend/src/stores/editorStore.ts

interface EditorState {
  // 文档状态
  document: ADLDocument | null;
  rawContent: string;
  ast: ADLDocumentAST | null;  // 新增：AST 作为单一数据源
  
  // 编辑状态
  isDirty: boolean;
  viewMode: 'read' | 'form' | 'editor';
  
  // 自动补齐
  missingFields: MissingField[];
  autoCompleteEnabled: boolean;
  
  // 校验
  lintErrors: LintError[];
  lintWarnings: LintWarning[];
  
  // 操作
  actions: {
    setContent: (content: string) => void;
    updateField: (path: string, value: any) => void;
    updateASTNode: (nodePath: string[], value: any) => void;  // AST 节点更新
    autoComplete: () => void;
    save: () => Promise<void>;
    discard: () => void;
  };
}

// 使用 zustand 管理
const useEditorStore = create<EditorState>((set, get) => ({
  // ...
}));
```

### 6.7 组件结构

```
frontend/src/
├── components/
│   └── editor/
│       ├── SmartEditor.tsx           # 智能编辑器主组件
│       ├── EditorToolbar.tsx         # 工具栏（视图切换等）
│       ├── MarkdownPane.tsx          # MD 编辑区
│       ├── FieldSettingsPane.tsx     # 字段设置面板
│       ├── AutoCompleteBar.tsx       # 自动补齐提示栏
│       ├── EditorStatusBar.tsx       # 底部状态栏
│       └── FieldInput/
│           ├── StringField.tsx       # 字符串输入
│           ├── ArrayField.tsx        # 数组输入
│           ├── ObjectField.tsx       # 对象输入
│           ├── EnumField.tsx         # 枚举选择
│           └── TokenRefField.tsx     # Token 引用
├── hooks/
│   ├── useEditorSync.ts              # 双向同步 Hook
│   └── useAutoComplete.ts            # 自动补齐 Hook
└── stores/
    └── editorStore.ts                # 编辑器状态
```

### 6.8 使用流程

```
用户点击"编辑"按钮
        │
        ▼
┌───────────────────────────────────────┐
│  1. 进入编辑模式                       │
│     - 加载文档原始内容                 │
│     - 解析为 ADL 结构                  │
│     - 初始化编辑器状态                 │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  2. 检测缺失字段                       │
│     - 显示自动补齐提示栏               │
│     - 用户可选择一键补齐               │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  3. 用户编辑                           │
│     - MD 区 ↔ 字段面板 双向同步        │
│     - 实时校验                        │
│     - 自动保存草稿                     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  4. 保存                              │
│     - 生成 Proposal                   │
│     - 显示变更预览                     │
│     - 确认后执行                       │
└───────────────────────────────────────┘
```

---

## 七、开发任务

### Phase 3.5.1: 固定键定义与验证 (1-2天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 定义固定键规范 | Structural / Metadata / Function / System | P0 |
| FixedKeysService | 固定键验证服务 | P0 |
| 集成到 DocumentLinter | 校验时检查固定键 | P0 |

### Phase 3.5.2: 自动补齐系统 (2-3天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| ID 生成器 | 支持中文拼音转换 | P0 |
| AutoCompleteService | 自动补齐服务 | P0 |
| 补齐 API | `/api/documents/auto-complete` | P0 |
| 集成到索引流程 | 索引时自动补齐 | P0 |
| 集成到 Proposal 执行 | 更新 `updated` 字段 | P1 |

### Phase 3.5.3: 渲染分区系统 (2-3天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| DisplayConfigService | 显示配置服务 | P0 |
| display.json 配置文件 | 分区配置 | P0 |
| ZonedBlockRenderer | 分区渲染组件 | P0 |
| HeroZone 组件 | 标题区渲染 | P0 |
| FooterZone 组件 | 底部区渲染（可折叠） | P0 |
| useDisplayConfig Hook | 前端配置 Hook | P0 |

### Phase 3.5.4: 技术 Spike（验证阶段）(1-2天)

> **在进入大规模开发前，先做技术钻研验证**

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 编辑器 POC | 验证 Milkdown/TipTap 可行性 | P0 |
| AST 双向同步验证 | 测试 YAML 修改 ↔ AST 更新流程 | P0 |
| Block 边界识别 | 验证编辑器能否准确识别 ADL Block 边界 | P0 |
| Ctrl+S 保存流程 | 捕获保存事件，触发 Proposal 流程 | P0 |
| 性能基准测试 | 测试大文档（100+ Block）的编辑性能 | P1 |

**Spike 验证目标**：
1. 编辑器能否准确识别当前编辑的 Block 边界
2. AST 修改后能否正确序列化回 Markdown
3. Slash Commands 能否正常工作
4. 整体方案是否满足"文档即系统"理念

### Phase 3.5.5: 智能 MD 编辑器 (4-5天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| SmartEditor 主组件 | 三栏布局框架 | P0 |
| MarkdownPane | MD 编辑区，基于 Milkdown/TipTap | P0 |
| FieldSettingsPane | 字段设置面板（Inspector 抽屉） | P0 |
| AST 驱动的双向同步 | 基于 unified/remark 的 AST 管理 | P0 |
| AutoCompleteBar | 缺失字段检测与一键补齐 | P0 |
| EditorStatusBar | 底部状态栏（校验结果） | P1 |
| 字段输入组件 | String/Array/Object/Enum/TokenRef | P0 |
| 视图模式切换 | 阅读/表单/编辑三态切换 | P0 |
| 块级操作菜单 | 六点控制柄 + Block 操作 | P1 |
| Slash Commands | `/principal`, `/client` 等模板 | P1 |
| Smart Refs | 引用字段智能补全 | P1 |
| 自动保存草稿 | 本地存储 + 恢复机制 | P2 |

### Phase 3.5.6: 标签扩展 (1天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 扩展 labels.json | 添加元数据字段标签 | P0 |
| 元数据字段图标 | created/updated/author/version | P0 |
| 时间格式化 | 友好的时间显示 | P1 |

### Phase 3.5.7: 测试与文档 (1-2天)

| 任务 | 说明 | 优先级 |
|------|------|--------|
| 自动补齐测试 | 各种场景覆盖 | P0 |
| 分区渲染测试 | UI 测试 | P0 |
| E2E 测试 | 完整流程测试 | P0 |
| 更新使用文档 | 固定键使用指南 | P1 |

---

## 七、示例效果

### 7.1 用户创建文档（最小输入）

```markdown
# 李设计师 {#u-li}

```yaml
type: principal
display_name: 李设计师
identity:
  emails:
    - li@example.com
```

设计部的资深设计师。
```

### 7.2 系统自动补齐后

```yaml
---
version: "1.0"
document_type: facts
created: 2026-01-02T10:30:00.000Z
updated: 2026-01-02T10:30:00.000Z
author: u-admin
atlas:
  function: principal
  capabilities:
    - auth.login
---

# 李设计师 {#u-li}

```yaml
type: principal
id: u-li-she-ji-shi
display_name: 李设计师
status: active
identity:
  emails:
    - li@example.com
```

设计部的资深设计师。
```

### 7.3 前端渲染效果

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  李设计师                              ● 活跃      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                    │
│  📋 身份信息                                        │
│  ┌──────────────────────────────────────────────┐ │
│  │  ✉️ 邮箱     li@example.com                   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  设计部的资深设计师。                               │
│                                                    │
│  ──────────────────────────────────────────────── │
│  📄 文档信息                                 [▼]   │
│  ┌──────────────────────────────────────────────┐ │
│  │  创建时间    2026-01-02 10:30                 │ │
│  │  更新时间    2026-01-02 10:30                 │ │
│  │  作者        管理员                           │ │
│  │  版本        1.0                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 八、验收标准

### 功能验收（自动补齐）

- [ ] 文档缺少 `id` 时，系统自动生成
- [ ] 文档缺少 `status` 时，默认填充 `active`
- [ ] 首次索引时自动填充 `created` 和 `author`
- [ ] Proposal 执行时自动更新 `updated`
- [ ] `atlas.function` 可基于 `type` 自动推断
- [ ] 中文标题能正确转换为拼音 ID

### 渲染验收（分区渲染）

- [ ] 标题区正确显示标题和状态
- [ ] 主体区只显示业务字段
- [ ] 底部区显示元数据，默认折叠
- [ ] 点击展开/折叠正常工作
- [ ] 时间格式友好（相对时间或格式化日期）

### 编辑器验收（智能编辑器）

- [ ] 三种视图模式可自由切换（阅读/表单/编辑）
- [ ] MD 编辑区支持 YAML 语法高亮
- [ ] 字段设置面板正确分区显示
- [ ] MD ↔ 表单双向同步正常工作
- [ ] 缺失字段检测并显示提示
- [ ] 一键补齐功能正常工作
- [ ] 实时校验并显示错误/警告
- [ ] 保存时正确生成 Proposal

### 配置验收

- [ ] display.json 配置文件正常加载
- [ ] 可通过配置自定义哪些字段显示在底部
- [ ] 可按实体类型配置不同的分区规则

---

## 九、时间估算

| 阶段 | 预计时间 | 说明 |
|------|---------|------|
| Phase 3.5.1 固定键定义 | 1-2 天 | 规范定义 + 验证服务 |
| Phase 3.5.2 自动补齐 | 2-3 天 | ID 生成 + 补齐服务 + API |
| Phase 3.5.3 渲染分区 | 2-3 天 | 三区布局 + Inspector |
| **Phase 3.5.4 技术 Spike** | **1-2 天** | **编辑器选型验证（关键）** |
| Phase 3.5.5 智能编辑器 | 4-5 天 | 核心编辑器实现 |
| Phase 3.5.6 标签扩展 | 1 天 | 元数据字段标签 |
| Phase 3.5.7 测试文档 | 1-2 天 | E2E 测试 + 使用文档 |
| **总计** | **12-18 天** | |

### 建议开发路径

```
1. 定义固定键清单
   └─▶ 在配置文件中明确哪些是系统强制管理的字段
   
2. 技术 Spike（关键！）
   └─▶ 验证编辑器方案，避免后期大改
   
3. 构建 Headless 解析层
   └─▶ 确保前端能把 MD 字符串完美转化为带有 Metadata 标注的 React 组件流
   
4. 实现"抽屉式"元数据编辑
   └─▶ 先把不关心的字段藏起来，通过 UI 表单修改，再回写回 YAML 块
   
5. 加入 Slash Command
   └─▶ 实现 /principal, /client 等自动生成符合 Schema 的 Block 模板
```

---

## 十、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|---------|
| 中文拼音转换不准确 | ID 可读性差 | 使用成熟的拼音库，支持多音字 |
| 自动补齐性能问题 | 大量文档时变慢 | 增量补齐，只处理变更文档 |
| 分区配置复杂 | 用户难以理解 | 提供合理默认值，高级配置可选 |
| 现有文档迁移 | 需要批量更新 | 提供迁移脚本，支持预览和确认 |
| 编辑器库选型失误 | 开发周期延长 | 先做技术 Spike，验证可行性 |
| 双向同步死循环 | 编辑卡顿/崩溃 | 使用防抖 + 单向数据源设计 |
| YAML 解析错误处理 | 用户无法保存 | 容错解析 + 友好错误提示 |
| 编辑器体积过大 | 首屏加载慢 | 懒加载 + 代码分割 |

---

## 十一、总结

### Phase 3.5 的本质

Phase 3.5 是对"文档即系统"范式的进一步优化，同时引入类 Notion 的编辑体验：

```
Phase 3.3-3.4: 系统理解文档（功能声明 + 标签映射）
Phase 3.5:     系统帮助文档（自动补齐 + 分区渲染 + 智能编辑）

用户体验升级：
  写文档 → 只写业务内容，元数据自动补齐
  读文档 → 业务内容突出，元数据不干扰
  改文档 → 三种模式自由切换，双向同步编辑
```

### 核心交付物

| 交付物 | 说明 |
|--------|------|
| 固定键规范 | Structural / Metadata / Function / System |
| AutoCompleteService | 前端实时 + 后端防线双层补齐 |
| ID 生成器 | 中文拼音支持（pinyin-pro） |
| display.json | 渲染分区配置 |
| ZonedBlockRenderer | 三段式分区渲染（Header/Body/Inspector） |
| **SmartEditor** | 基于 Milkdown/TipTap 的智能编辑器 |
| **AST 驱动同步** | unified/remark 的 AST 单一数据源架构 |
| **块级操作** | 六点控制柄 + Block 操作菜单 |
| **Slash Commands** | `/principal`, `/client` 等快捷模板 |
| **Smart Refs** | 引用字段智能补全 |

### 技术架构亮点

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Markdown 字符串 ←──────→ AST（单一数据源）←──────→ UI 表单      │
│         ↑                       ↑                     ↑         │
│         │                       │                     │         │
│    remark-parse            AST 节点操作          react-hook-form │
│    remark-stringify        (所有修改都经过 AST)                  │
│                                                                 │
│   优势：                                                         │
│   • 避免手动正则替换破坏文档结构                                   │
│   • 双向同步状态一致性有保障                                       │
│   • 便于实现撤销/重做                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 三种视图模式

| 模式 | 图标 | 适用场景 |
|------|------|----------|
| 阅读态 | 📖 | 日常浏览、分享查看 |
| 表单编辑态 | 📝 | 快速修改单字段、不懂 MD 的用户 |
| MD 编辑态 | ✏️ | 创建新文档、批量编辑、高级用户 |

### 一句话总结

> **Phase 3.5 让系统成为文档的贴心管家，自动管理元数据，并提供类 Notion 的编辑体验，让用户专注于业务内容。**

### 战略意义

> 这一阶段完成后，ATLAS 将真正具备从"程序员工具"向"通用协同办公工具"进化的能力。

---

*文档版本: 1.0*
*创建日期: 2026-01-02*
*状态: 📋 规划中*

