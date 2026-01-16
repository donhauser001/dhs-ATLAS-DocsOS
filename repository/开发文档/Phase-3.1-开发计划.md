---
slug: doc-n8fwyg
---
# Phase 3.1 开发计划：Principal + Profile 用户体系

## 一、阶段定位

### 1.1 背景

Phase 3.0 完成了 ADL 语言收敛与 Design Tokens 显现系统。Phase 3.1 的目标是建立**统一用户体系**，解决以下核心问题：

- 同一人可能拥有多种业务身份（员工、客户联系人、未来更多）
- 需要统一登录主体，避免多套用户系统
- 业务档案需要独立管理，支持不同字段模型
- 为 AI 友好的关系查询打下基础

### 1.2 核心理念

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Principal（登录主体）     →    统一身份，一次登录              │
│        │                                                        │
│        └── Profiles[]       →    多业务档案，按需扩展            │
│              ├── employee                                       │
│              └── client_contact                                 │
│                                                                 │
│   roles ≠ profiles                                              │
│   • roles：决定"能做什么"（权限）                                │
│   • profiles：决定"你是谁"（业务数据模型）                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 完成标准

Phase 3.1 完成的唯一标准：

> **一个用户可以同时拥有"员工"和"客户联系人"两种身份，系统能正确索引、查询、显现这两种身份，且 UI 体验自然无割裂感。**

---

## 二、架构设计

### 2.1 概念模型

```
Principal（主体）
│
├── Base Identity（统一字段）
│   ├── id: string              # 唯一标识，如 u-wang
│   ├── display_name: string    # 显示名
│   ├── emails: string[]        # 邮箱列表
│   ├── phones: string[]        # 手机列表
│   ├── avatar: TokenRef        # 头像引用
│   ├── status: string          # active/inactive
│   └── handles: object         # 社交账号（微信等）
│
└── Profiles[]（业务档案引用）
    ├── { ref: "#p-employee-xxx" }
    └── { ref: "#p-client-contact-xxx" }
```

### 2.2 Profile Types（本期实现）

| Profile Type | 用途 | 必填字段 |
|--------------|------|----------|
| `employee` | 内部员工 | employee_no, department, title |
| `client_contact` | 客户联系人 | client_ref, role_title |

### 2.3 文档结构

```
repository/
├── genesis/
│   ├── tokens.md                    # Design Tokens（已有）
│   ├── 客户管理.md                   # 客户数据（已有）
│   └── 服务示例.md                   # 服务示例（已有）
├── system/
│   └── profile-types.md             # Profile Type Registry（新增）
└── users/
    ├── principals.md                # 所有登录主体（新增）
    └── profiles/
        ├── employees.md             # 员工档案（新增）
        └── client-contacts.md       # 客户联系人档案（新增）
```

---

## 三、ADL 语法定义

### 3.1 Principal Block

```yaml
type: principal
id: u-wang
display_name: 王编辑
status: active

identity:
  emails:
    - wang@zhongxin.com
    - wang.personal@gmail.com
  phones:
    - "138-0000-0001"
  avatar: { token: avatar.default }
  handles:
    wechat: wang_editor
    wecom: wang@company

profiles:
  - { ref: "#p-employee-u-wang" }
  - { ref: "#p-client-contact-u-wang" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

### 3.2 Employee Profile Block

```yaml
type: profile
profile_type: employee
id: p-employee-u-wang
principal_ref: { ref: "#u-wang" }
status: active

employee:
  employee_no: DHS-0001
  department: 设计部
  title: 创意总监
  level: L5
  join_date: 2020-01-15

default_roles:
  - admin
  - designer

$display:
  color: { token: color.status.active }
  icon: { token: icon.general.user }
```

### 3.3 Client Contact Profile Block

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-u-wang
principal_ref: { ref: "#u-wang" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-zhongxin" }
role_title: 责任编辑
department: 编辑部
relationship_strength: 5
notes: |
  主要对接人，偏好微信沟通
  每周三下午可约会议

tags:
  - 决策人
  - 编辑

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

### 3.4 Profile Type Registry

```yaml
# system/profile-types.md

type: registry
registry_type: profile_types
id: profile-type-registry
title: Profile 类型注册表
status: active

types:
  employee:
    title: 员工档案
    description: 内部员工的业务身份
    required_fields:
      - principal_ref
      - employee.employee_no
      - employee.department
      - employee.title
    optional_fields:
      - employee.level
      - employee.join_date
      - default_roles
    editable_by:
      - admin
      - hr

  client_contact:
    title: 客户联系人档案
    description: 客户侧的联系人身份
    required_fields:
      - principal_ref
      - client_ref
      - role_title
    optional_fields:
      - department
      - relationship_strength
      - notes
      - tags
    editable_by:
      - admin
      - sales
```

---

## 四、索引层设计

### 4.1 索引文件结构

```
.atlas/
├── entities/
│   ├── principal.json           # 主体索引
│   └── profile.json             # 档案索引
├── edges/
│   ├── principal_has_profiles.json    # 主体 → 档案（正向）
│   ├── profile_belongs_to_principal.json  # 档案 → 主体（反向）
│   ├── client_has_contacts.json       # 客户 → 联系人档案
│   └── contact_belongs_to_client.json # 联系人档案 → 客户
└── search/
    ├── principal.search.json    # 主体检索（email/phone/name）
    └── profile.search.json      # 档案检索
```

### 4.2 Entity Index 结构

**principal.json**
```json
{
  "u-wang": {
    "id": "u-wang",
    "display_name": "王编辑",
    "status": "active",
    "emails": ["wang@zhongxin.com"],
    "phones": ["138-0000-0001"],
    "document": "users/principals.md",
    "anchor": "u-wang",
    "profile_count": 2
  }
}
```

**profile.json**
```json
{
  "p-employee-u-wang": {
    "id": "p-employee-u-wang",
    "profile_type": "employee",
    "principal_id": "u-wang",
    "title": "创意总监",
    "department": "设计部",
    "document": "users/profiles/employees.md",
    "anchor": "p-employee-u-wang"
  },
  "p-client-contact-u-wang": {
    "id": "p-client-contact-u-wang",
    "profile_type": "client_contact",
    "principal_id": "u-wang",
    "client_id": "client-zhongxin",
    "role_title": "责任编辑",
    "document": "users/profiles/client-contacts.md",
    "anchor": "p-client-contact-u-wang"
  }
}
```

### 4.3 Edge Index 结构

**principal_has_profiles.json**
```json
{
  "u-wang": ["p-employee-u-wang", "p-client-contact-u-wang"],
  "u-li": ["p-employee-u-li"]
}
```

**client_has_contacts.json**
```json
{
  "client-zhongxin": ["p-client-contact-u-wang", "p-client-contact-u-li"],
  "client-kuaishou": ["p-client-contact-u-zhao"]
}
```

### 4.4 Search Index 结构

**principal.search.json**
```json
{
  "wang@zhongxin.com": "u-wang",
  "138-0000-0001": "u-wang",
  "王编辑": "u-wang",
  "wangbianji": "u-wang"
}
```

---

## 五、API 设计

### 5.1 Principal API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/principals` | 获取主体列表 |
| GET | `/api/principals/:id` | 获取主体详情（含 profiles 摘要） |
| GET | `/api/principals/:id/profiles` | 获取主体的所有档案 |
| GET | `/api/principals/search?q=xxx` | 搜索主体（email/phone/name） |

### 5.2 Profile API

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/profiles` | 获取档案列表（可按 type 筛选） |
| GET | `/api/profiles/:id` | 获取档案详情 |
| GET | `/api/profiles/by-client/:clientId` | 获取客户的所有联系人档案 |
| GET | `/api/profiles/by-type/:type` | 按类型获取档案列表 |

### 5.3 Relation API（AI 友好）

| Method | Path | 说明 |
|--------|------|------|
| GET | `/api/relations/principal/:id/context` | 获取主体完整上下文（含所有关联） |
| GET | `/api/relations/client/:id/contacts` | 获取客户的所有联系人（含主体信息） |

---

## 六、UI 设计

### 6.1 页面结构

```
/users                    # 用户列表页（显示所有 Principal）
/users/:id                # 用户详情页（Tab 切换多 Profile）
/users/:id/employee       # 员工档案 Tab
/users/:id/client-contact # 客户联系人档案 Tab

/clients/:id/contacts     # 客户详情页 - 联系人列表
```

### 6.2 用户详情页 UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ← 返回                                           [编辑] [更多] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [头像]  王编辑                                                  │
│          wang@zhongxin.com · 138-0000-0001                      │
│          微信: wang_editor                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [ 员工档案 ]  [ 客户联系人 ]                    ← Tab 切换      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  员工档案                                                        │
│  ─────────                                                      │
│  工号：DHS-0001                                                  │
│  部门：设计部                                                    │
│  职位：创意总监                                                  │
│  级别：L5                                                        │
│  入职日期：2020-01-15                                            │
│                                                                 │
│  默认角色：admin, designer                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 客户详情页 - 联系人列表

```
┌─────────────────────────────────────────────────────────────────┐
│  中信出版社                                                      │
│  ═══════════════════════════════════════════════════════════    │
│                                                                 │
│  联系人 (3)                                      [添加联系人]    │
│  ─────────                                                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [头像] 王编辑        责任编辑        138-0000-0001  →   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [头像] 李主任        部门主管        139-0000-0002  →   │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [头像] 张会计        财务对接        137-0000-0003  →   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 七、开发任务

### 7.1 任务列表

| # | 任务 | 优先级 | 预估工时 |
|---|------|--------|----------|
| 1 | 更新 ADL Spec：定义 principal 和 profile 类型 | P0 | 2h |
| 2 | 创建 Profile Type Registry 文档 | P0 | 1h |
| 3 | 创建示例数据文档（principals.md, employees.md, client-contacts.md） | P0 | 2h |
| 4 | 扩展 Schema Validator：支持 principal/profile 校验 | P0 | 3h |
| 5 | 实现 Principal/Profile 索引生成 | P0 | 4h |
| 6 | 实现关系索引（principal↔profile, client↔contacts） | P0 | 3h |
| 7 | 实现搜索索引（email/phone/name） | P1 | 2h |
| 8 | 实现 Principal API | P0 | 3h |
| 9 | 实现 Profile API | P0 | 3h |
| 10 | 实现 Relation API | P1 | 2h |
| 11 | 创建用户列表页 UI | P0 | 3h |
| 12 | 创建用户详情页 UI（含 Tab 切换） | P0 | 4h |
| 13 | 客户详情页集成联系人列表 | P1 | 2h |
| 14 | E2E 测试 | P0 | 3h |

**预估总工时**：37h

### 7.2 里程碑

| 里程碑 | 包含任务 | 完成标志 |
|--------|----------|----------|
| M1: ADL 定义完成 | 1, 2, 3 | 示例数据可被 Parser 正确解析 |
| M2: 后端核心完成 | 4, 5, 6, 7, 8, 9, 10 | API 可返回正确数据 |
| M3: 前端完成 | 11, 12, 13 | UI 可正常展示和交互 |
| M4: 测试通过 | 14 | E2E 测试全部通过 |

---

## 八、迁移策略

### 8.1 现有数据处理

当前 `联系人管理.md` 中的联系人数据需要迁移：

1. **创建对应的 Principal**：为每个联系人创建登录主体
2. **创建 Client Contact Profile**：将业务字段迁移到档案
3. **建立关联**：Principal → Profile → Client

### 8.2 迁移脚本

提供 `scripts/migrate-contacts-to-profiles.ts` 脚本：
- 读取现有 `联系人管理.md`
- 生成 `principals.md` 和 `client-contacts.md`
- 保留原有 ref 关系

---

## 九、未来扩展

### 9.1 新增 Profile Type 的流程

1. 在 `profile-types.md` 中添加新类型定义
2. 创建对应的档案文档（如 `vendors.md`）
3. 索引服务自动识别新类型并建立索引
4. UI 根据 Registry 自动渲染新 Tab

### 9.2 预留的 Profile Types

| Type | 用途 | 优先级 |
|------|------|--------|
| `vendor` | 供应商联系人 | Phase 3.2 |
| `partner` | 合作伙伴 | Phase 3.3 |
| `contact` | 通用联系人（无客户关联） | Phase 3.3 |

---

## 十、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 索引重建性能 | 数据量大时变慢 | 增量更新 + 分片 |
| Profile 字段冲突 | 不同类型字段命名冲突 | 使用 namespace（employee.xxx） |
| 迁移数据丢失 | 现有数据损坏 | 迁移前备份 + 校验脚本 |
| UI 复杂度 | 多 Tab 交互混乱 | 遵循"无 Profile 不显示 Tab"原则 |

---

## 十一、验收标准

### 11.1 功能验收

- [ ] 可创建带多 Profile 的 Principal
- [ ] Schema Validator 正确校验 principal/profile 字段
- [ ] 索引正确生成 principal↔profile 关系
- [ ] 索引正确生成 client↔contacts 关系
- [ ] 搜索可通过 email/phone/name 找到 Principal
- [ ] 用户详情页正确显示多 Profile Tab
- [ ] 客户详情页正确显示联系人列表
- [ ] 点击联系人可跳转到用户详情页

### 11.2 非功能验收

- [ ] 100 个 Principal + 200 个 Profile 索引生成 < 3s
- [ ] 搜索响应时间 < 100ms
- [ ] 无硬编码颜色/图标（全部走 Token）

---

## 十二、参考资料

- Phase 3.0 开发计划
- ADL Spec v0.3
- 专家反馈：联系人/客户关联设计
- 专家反馈：Principal + Profile 架构设计

