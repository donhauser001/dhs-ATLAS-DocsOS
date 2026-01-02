# Phase 3.4: 标签注册制系统 (Label Registry System)

> **核心理念**：文档使用原始字段名，系统通过标签注册表映射为用户友好的显示名称和图标。

---

## 〇、设计哲学

### 问题背景

在 Phase 3.3 实施过程中，发现了一个关键问题：

```
文档内容：
  identity:
    emails: [chen-qi@example.com]
    phones: ["13893649480"]

界面显示：
  identity: ...      ← 技术字段名，用户难以理解
  emails: ...        ← 英文标签，非本地化
```

### 核心决策

经过讨论，确定了以下设计原则：

| 原则 | 说明 |
|------|------|
| **文档使用原始名** | 文档中的字段名必须是英文 + 数字 + 下划线的标准格式 |
| **界面显示映射名** | UI 渲染时，根据注册表将原始名映射为用户友好的名称 |
| **图标统一管理** | 每个字段可配置对应的图标，提升视觉识别度 |
| **系统级配置** | 标签配置不再用 markdown 文档，而是存储在系统配置中 |

### 为什么不在文档中使用中文字段名？

```yaml
# ❌ 错误做法：文档中使用中文
身份信息:
  邮箱: chen-qi@example.com

# ✅ 正确做法：文档使用英文，界面映射
identity:
  emails: chen-qi@example.com
```

原因：
1. **代码稳定性**：后端逻辑依赖固定的字段名（如 `identity.emails`）
2. **国际化支持**：映射名可随语言切换，文档结构不变
3. **AI 友好**：标准化的字段名更容易被 AI 理解和处理
4. **防止误操作**：用户修改映射名不会影响系统运行

---

## 一、系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     ATLAS 标签注册制                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   文档层     │     │   配置层     │     │   显示层     │   │
│  │             │     │             │     │             │   │
│  │ identity:   │ ──▶ │ key: identity│ ──▶ │ 📋 身份信息  │   │
│  │   emails:   │     │ label: 身份信息│    │ ✉️ 邮箱      │   │
│  │   phones:   │     │ icon: contact │    │ 📞 电话      │   │
│  │             │     │             │     │             │   │
│  │ (原始字段名) │     │ (标签配置)   │     │ (UI 渲染)   │   │
│  └─────────────┘     └─────────────┘     └─────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 数据流

```
1. 用户创建/编辑文档
   └─▶ 使用原始字段名（identity, emails, status...）

2. 后端解析文档
   └─▶ 保持原始字段名不变

3. 前端请求标签配置
   └─▶ GET /api/labels

4. 前端渲染界面
   └─▶ 通过 LabelProvider 将原始名映射为显示名 + 图标
```

---

## 二、标签配置结构

### 2.1 配置文件位置

```
repository/.atlas/config/labels.json
```

### 2.2 配置结构

```json
{
  "version": "1.0",
  "updatedAt": "2026-01-02T00:00:00.000Z",
  "categories": [
    {
      "id": "core",
      "name": "核心字段",
      "description": "所有文档通用的基础字段",
      "isSystem": true,
      "items": [
        {
          "key": "id",
          "label": "标识符",
          "icon": "fingerprint",
          "isSystem": true
        },
        {
          "key": "status",
          "label": "状态",
          "icon": "activity",
          "isSystem": true
        }
      ]
    },
    {
      "id": "identity",
      "name": "身份与联系",
      "description": "用户身份和联系信息字段",
      "isSystem": true,
      "items": [
        {
          "key": "identity",
          "label": "身份信息",
          "icon": "contact",
          "isSystem": true
        },
        {
          "key": "emails",
          "label": "邮箱",
          "icon": "mail",
          "isSystem": true
        },
        {
          "key": "phones",
          "label": "电话",
          "icon": "phone",
          "isSystem": true
        }
      ]
    }
  ],
  "hiddenFields": [
    "password_hash",
    "auth",
    "oauth",
    "secret",
    "token"
  ]
}
```

### 2.3 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `categories` | array | 标签分类列表 |
| `categories[].id` | string | 分类唯一标识 |
| `categories[].name` | string | 分类显示名称 |
| `categories[].isSystem` | boolean | 是否系统分类（不可删除） |
| `categories[].items` | array | 该分类下的标签项 |
| `items[].key` | string | 原始字段名（英文） |
| `items[].label` | string | 映射显示名（可任意语言） |
| `items[].icon` | string | Lucide 图标名（kebab-case） |
| `items[].color` | string | 可选，颜色值（用于状态等） |
| `items[].isSystem` | boolean | 是否系统标签（不可删除原始名） |
| `hiddenFields` | array | 敏感字段列表，渲染时隐藏 |

---

## 三、系统标签分类

### 3.1 预定义分类

| 分类 ID | 分类名称 | 说明 |
|---------|----------|------|
| `core` | 核心字段 | id, type, status, title, display_name, description |
| `metadata` | 文档元数据 | version, document_type, created, updated, author |
| `identity` | 身份与联系 | identity, emails, phones, avatar, contact, address |
| `organization` | 组织与角色 | company, department, position, role |
| `project` | 项目相关 | project_name, client, contract_value, deadline |
| `business` | 业务字段 | price, quantity, notes, tags, category, priority |
| `relations` | 关联字段 | ref, profiles, related_projects |
| `atlas_functions` | ATLAS 功能类型 | principal, entity_list, entity_detail, config, registry |
| `statuses` | 状态值 | active, draft, archived, in_progress, completed |

### 3.2 状态标签示例

```json
{
  "key": "active",
  "label": "活跃",
  "icon": "check-circle",
  "color": "green",
  "isSystem": true
},
{
  "key": "draft",
  "label": "草稿",
  "icon": "edit",
  "color": "yellow",
  "isSystem": true
},
{
  "key": "archived",
  "label": "已归档",
  "icon": "archive",
  "color": "gray",
  "isSystem": true
}
```

---

## 四、后端实现

### 4.1 服务结构

```
backend/src/services/
├── label-config.ts      # 标签配置管理（CRUD + 持久化）
└── label-registry.ts    # 标签注册表（内存缓存 + 查询）
```

### 4.2 LabelConfigService

```typescript
// backend/src/services/label-config.ts

// 默认系统标签（硬编码，用户不可删除）
const DEFAULT_CONFIG: LabelConfig = {
  version: '1.0',
  updatedAt: new Date().toISOString(),
  categories: [
    {
      id: 'core',
      name: '核心字段',
      isSystem: true,
      items: [
        { key: 'id', label: '标识符', icon: 'fingerprint', isSystem: true },
        { key: 'status', label: '状态', icon: 'activity', isSystem: true },
        // ...
      ]
    },
    // ...
  ],
  hiddenFields: ['password_hash', 'auth', 'oauth', 'secret', 'token']
};

// 主要方法
export function loadConfig(): LabelConfig { ... }
export function saveConfig(config: LabelConfig): void { ... }
export function getSystemLabels(): LabelCategory[] { ... }
export function getCustomLabels(): LabelCategory[] { ... }
export function addCustomLabel(categoryId: string, item: LabelItem): void { ... }
export function updateCustomLabel(key: string, updates: Partial<LabelItem>): void { ... }
export function deleteCustomLabel(key: string): void { ... }
```

### 4.3 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/labels` | 获取完整标签配置 |
| GET | `/api/labels/categories` | 获取所有分类 |
| GET | `/api/labels/system` | 获取系统标签 |
| GET | `/api/labels/custom` | 获取自定义标签 |
| POST | `/api/labels/custom` | 添加自定义标签 |
| PUT | `/api/labels/custom/:key` | 更新标签 |
| DELETE | `/api/labels/custom/:key` | 删除自定义标签 |

---

## 五、前端实现

### 5.1 组件结构

```
frontend/src/
├── providers/
│   └── LabelProvider.tsx     # 标签上下文提供者
├── api/
│   └── labels.ts             # 标签 API 客户端
├── components/
│   ├── labels/
│   │   └── LabeledField.tsx  # 带标签的字段渲染
│   └── ui/
│       └── icon-picker.tsx   # 图标选择器
└── pages/settings/
    ├── SettingsPage.tsx      # 设置页面框架
    └── LabelSettings.tsx     # 标签管理界面
```

### 5.2 LabelProvider

```tsx
// frontend/src/providers/LabelProvider.tsx

interface LabelContextValue {
  config: LabelConfig | null;
  loading: boolean;
  error: string | null;
  
  // 核心方法
  resolveLabel: (key: string) => ResolvedLabel;
  getLabel: (key: string) => string;
  getIcon: (key: string) => string | undefined;
  getColor: (key: string) => string | undefined;
  isHidden: (key: string) => boolean;
  
  // 刷新
  refresh: () => Promise<void>;
}

// 使用示例
function MyComponent() {
  const { getLabel, getIcon } = useLabels();
  
  return (
    <div>
      <span>{getIcon('emails') && <MailIcon />}</span>
      <span>{getLabel('emails')}</span>  {/* 显示 "邮箱" */}
    </div>
  );
}
```

### 5.3 字段值格式化

在 `BlockRenderer.tsx` 中实现智能格式化：

```typescript
function renderFieldValue(value: unknown, resolveLabel?: ResolveLabelFn): React.ReactNode {
  // Token 对象 → 友好名称
  if (isTokenObject(value)) {
    return <span className="bg-slate-100 px-2 rounded">{formatToken(value.token)}</span>;
  }
  
  // 单元素数组 → 直接显示值
  if (Array.isArray(value) && value.length === 1) {
    return <span>{String(value[0])}</span>;
  }
  
  // 多元素数组 → 用顿号分隔
  if (Array.isArray(value)) {
    return <span>{value.join('、')}</span>;
  }
  
  // 嵌套对象 → 递归渲染
  if (typeof value === 'object') {
    return (
      <dl>
        {Object.entries(value).map(([k, v]) => (
          <div key={k}>
            <dt>{resolveLabel(k).label}:</dt>
            <dd>{renderFieldValue(v, resolveLabel)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  
  return String(value);
}
```

---

## 六、图标选择器

### 6.1 组件设计

```tsx
// frontend/src/components/ui/icon-picker.tsx

interface IconPickerProps {
  value?: string;           // 当前选中的图标名
  onChange: (icon: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// 图标分类
const ICON_CATEGORIES = {
  '常用': ['user', 'mail', 'phone', 'settings', 'search', ...],
  '文件': ['file', 'folder', 'file-text', 'archive', ...],
  '通讯': ['mail', 'phone', 'message-square', 'at-sign', ...],
  '状态': ['check', 'x', 'alert-circle', 'info', ...],
  '箭头': ['arrow-up', 'arrow-down', 'chevron-right', ...],
  // ...
};
```

### 6.2 使用示例

```tsx
<IconPicker
  value={selectedIcon}
  onChange={(icon) => setSelectedIcon(icon)}
  size="md"
/>
```

### 6.3 关键实现

1. **图标名转换**：Lucide 图标需要将 kebab-case 转为 PascalCase
   ```typescript
   function toPascalCase(str: string): string {
     return str.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
   }
   // 'user-plus' → 'UserPlus'
   ```

2. **图标过滤**：排除非组件导出（如 `createLucideIcon`）
   ```typescript
   const EXCLUDED_EXPORTS = ['createLucideIcon', 'default', 'icons'];
   ```

3. **滚动支持**：使用 `ScrollArea` 组件 + `onWheel` 事件阻止冒泡

---

## 七、设置页面

### 7.1 页面结构

```
/settings
├── /labels          # 标签管理
├── /tokens          # Token 管理（未来）
└── /system          # 系统配置（未来）
```

### 7.2 标签管理界面

```
┌─────────────────────────────────────────────────────────────┐
│  ← 返回    系统设置                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐  ┌─────────────────────────────────────────┐  │
│  │ 标签管理 │  │                                         │  │
│  │ ────── │  │  核心字段 (6)                    + 添加   │  │
│  │ Token  │  │  ┌────┐ ┌────┐ ┌────┐                   │  │
│  │ 系统   │  │  │🔖id │ │📊type│ │✅status│ ...          │  │
│  │        │  │  │标识符│ │类型 │ │状态  │                 │  │
│  │        │  │  └────┘ └────┘ └────┘                   │  │
│  │        │  │                                         │  │
│  │        │  │  身份与联系 (8)                  + 添加   │  │
│  │        │  │  ┌────┐ ┌────┐ ┌────┐                   │  │
│  │        │  │  │📋  │ │✉️   │ │📞   │ ...              │  │
│  │        │  │  │identity│ │emails│ │phones│             │  │
│  │        │  │  │身份信息│ │邮箱 │ │电话  │               │  │
│  │        │  │  └────┘ └────┘ └────┘                   │  │
│  └─────────┘  └─────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 编辑对话框

```
┌─────────────────────────────────────┐
│  编辑标签                      ✕    │
├─────────────────────────────────────┤
│                                     │
│  原始名称                           │
│  ┌─────────────────────────────┐   │
│  │ identity                    │   │
│  └─────────────────────────────┘   │
│  ⚠️ 系统标签，原始名称不可修改        │
│                                     │
│  显示名称                           │
│  ┌─────────────────────────────┐   │
│  │ 身份信息                    │   │
│  └─────────────────────────────┘   │
│                                     │
│  图标                               │
│  ┌────┐                            │
│  │ 📋 │  ← 点击打开图标选择器        │
│  └────┘                            │
│                                     │
│           [ 取消 ]  [ 保存 ]         │
└─────────────────────────────────────┘
```

---

## 八、与热刷新的集成

### 8.1 刷新流程

```
用户点击"重建索引"
    │
    ▼
POST /api/functions/rebuild
    │
    ├─▶ rebuildWorkspaceIndex()    # 刷新文档索引
    │
    ├─▶ rebuildFunctionRegistry()  # 刷新功能注册表
    │
    └─▶ rebuildLabelRegistry()     # 刷新标签注册表
    │
    ▼
前端刷新页面，重新获取标签配置
```

### 8.2 代码实现

```typescript
// backend/src/services/function-registry.ts

export async function rebuildFunctionRegistry(): Promise<FunctionRegistry> {
  // 1. 刷新 WorkspaceIndex
  const workspaceIndex = await rebuildWorkspaceIndex();
  
  // 2. 刷新 LabelRegistry
  await rebuildLabelRegistry();
  
  // 3. 扫描文档，构建 FunctionRegistry
  // ...
}
```

---

## 九、敏感字段处理

### 9.1 隐藏字段列表

```json
{
  "hiddenFields": [
    "password_hash",
    "auth",
    "oauth",
    "secret",
    "token"
  ]
}
```

### 9.2 渲染逻辑

```typescript
function BlockRenderer({ block }) {
  const { isHidden } = useLabels();
  
  return (
    <div>
      {getBusinessFields(machine).map(([key, value]) => {
        // 跳过敏感字段
        if (isHidden(key)) return null;
        
        return <LabeledField key={key} name={key} value={value} />;
      })}
    </div>
  );
}
```

---

## 十、扩展能力

### 10.1 自定义分类

用户可以创建自定义分类，用于管理业务特定的标签：

```json
{
  "id": "crm",
  "name": "CRM 字段",
  "description": "客户关系管理相关字段",
  "isSystem": false,
  "items": [
    { "key": "lead_source", "label": "线索来源", "icon": "target" },
    { "key": "deal_stage", "label": "商机阶段", "icon": "trending-up" }
  ]
}
```

### 10.2 多语言支持（未来）

```json
{
  "key": "status",
  "labels": {
    "zh-CN": "状态",
    "en-US": "Status",
    "ja-JP": "ステータス"
  },
  "icon": "activity"
}
```

---

## 十一、总结

### Phase 3.4 的本质

Phase 3.4 是 Phase 3.3 的自然延伸，解决了"文档即系统"范式下的用户体验问题：

```
Phase 3.3: 文档声明功能身份
Phase 3.4: 系统统一管理显示名称

结合起来：
  文档 = 业务逻辑（原始字段名）
  配置 = 显示规则（映射名 + 图标）
  界面 = 显现结果（用户友好）
```

### 核心交付物

| 交付物 | 说明 |
|--------|------|
| `labels.json` | 标签配置文件 |
| `LabelConfigService` | 标签配置管理服务 |
| `LabelProvider` | 前端标签上下文 |
| `IconPicker` | 图标选择器组件 |
| `/settings/labels` | 标签管理页面 |
| 字段值格式化 | 数组、Token、嵌套对象的友好显示 |

### 一句话总结

> **Phase 3.4 让技术字段名与用户显示名解耦，在保持文档结构稳定的同时，提供了完全可定制的用户界面。**

---

*文档版本: 1.0*
*创建日期: 2026-01-02*
*状态: ✅ 已完成*


