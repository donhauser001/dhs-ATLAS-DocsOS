# Person 插件包全通路验收规范 v1.0

> **Document ID**: ATLAS-PERSON-FULL-PATH-V1  
> **Status**: Baseline  
> **Scope**: Person Type Package  
> **Role**: Reference Plugin Package（样板插件包）

---

## 0. 本规范的定位（必须先明确）

Person 插件包不是一个"用户模块"，而是：

> **系统中一切"可行动主体（Principal）"的基准定义包**

凡是：
- 可以被邀请
- 可以登录
- 可以关联项目/财务/权限
- 可以成为业务行为的承担者

都必须首先是一个 Person。

因此，本插件包是 **所有后续插件包的结构母本**。

---

## 1. 插件包基础信息（Manifest 级要求）

### 1.1 插件包类型声明

Person 插件包必须在系统中注册为：

```yaml
type: person
version: 1.0.0
category: core
```

### 1.2 插件包能力声明（Capability Declaration）

Person 插件包 **至少声明以下能力**：
- 主体识别（Identity Recognition）
- 主体索引（Person Index）
- 审核与升级（Staging → Verified）
- 登录邀请与启用（Login Eligibility）
- 关系锚点（Relation Anchor）

**验收条件**：
> 卸载 person 插件包后，系统中不得再存在任何"人员列表 / 登录 / 邀请 / 审核"相关入口。

---

## 2. 类型准入与垃圾隔离（Type Gate）

### 2.1 类型准入规则（强制）

- 文档必须显式声明 `doc-type: person`
- 且系统内 **已安装** person 插件包

否则：
- 不进入任何 person 索引
- 不进入任何审核池
- 视为 **垃圾文档（Quarantine）**

### 2.2 垃圾文档分类（仅用于隔离与引导）

| 类型 | 说明 | 处理方式 |
|------|------|----------|
| 无 doc-type | 未声明类型 | 进入 `quarantine/no-type` |
| 未安装类型 | doc-type 不存在 | 进入 `quarantine/unknown-type` |
| 类型正确但字段不足 | doc-type: person | 进入 `person/staging` |

**验收条件**：
> 审核池（staging）中 **只允许出现** `doc-type=person` 的文档。

---

## 3. 文档创建通路（Create Path）

### 3.1 系统创建（小白入口）

系统必须提供"新建人员"入口，生成最小 canonical person 文档。

**最小 canonical 要求（强制）**

```yaml
---
doc-type: person
id: <system-generated>
display_name: <string>
status: active
---
```

- 不要求一次性填写所有字段
- 但必须保证该文档 **立即可索引**

### 3.2 自由文档入口

- 用户可通过任意方式创建 md
- 只要声明 `doc-type: person` 即进入索引管道
- 字段格式 **允许完全差异化**

**验收条件**：
> 系统创建与自由创建的 person 文档，在索引层待遇一致。

---

## 4. 索引闭环（Index Pipeline）

Person 插件包 **必须生成两类索引**。

### 4.1 正式索引（Verified）

路径示例：

```
.atlas/indexes/person/verified.json
```

进入条件：满足 Person 核心字段合同（见 §5）。

### 4.2 待审核索引（Staging）

路径示例：

```
.atlas/indexes/person/staging.json
```

进入条件：
- `doc-type=person`
- 但未满足核心字段合同
- 或存在冲突/歧义

### 4.3 索引记录最小结构（强制）

每条索引记录 **必须包含**：

```json
{
  "person_id": "...",
  "source_doc": "...",
  "confidence": 0-100,
  "missing_fields": [],
  "issues": [],
  "status": "verified | staging"
}
```

**验收条件**：
> 索引文件可删除并完整重建，结果可解释，不依赖历史状态。

---

## 5. 核心字段合同（Eligibility Contract）

### 5.1 成为「Verified Person」的最低合同

必须 **全部满足**：
1. `display_name` 存在
2. 至少一个可联系字段存在：
   - `email` 或 `phone`

字段来源不限制：frontmatter / block / 正文解析 / 手动补全均可

### 5.2 成为「可登录主体」的最低合同（附加）

在 Verified Person 基础上，额外必须：
1. 联系方式可验证（OTP / magic link）
2. `access.enabled = true`（显式）

**验收条件**：
> 任何未通过验证或未显式启用的 person 不得登录系统。

---

## 6. 审核与升级通路（Review → Promote）

### 6.1 Staging 审核动作（强制提供）

对 staging person，系统必须支持以下动作：
1. **确认是 Person**
2. **补全缺失字段**
3. **处理冲突**（如重复 email/phone）
4. **拒绝并移出 Person 体系**

### 6.2 审计要求（强制）

每一次审核动作必须记录：
- 操作人
- 时间
- 原状态 → 新状态
- 修改字段摘要

**验收条件**：
> 任一 verified person 都可追溯其从 staging 的升级路径。

---

## 7. 登录与邀请通路（Identity & Access）

### 7.1 登录状态机（必须实现）

| 状态 | 含义 |
|------|------|
| `none` | 无登录资格 |
| `eligible` | 满足字段合同 |
| `invited` | 已发送邀请 |
| `active` | 可登录 |
| `suspended` | 禁用 |

### 7.2 邀请机制（强制）

- 邀请必须通过系统动作触发
- 使用一次性 token（magic link / OTP）
- 不允许从文档推断密码或凭据

**验收条件**：
> 未经过邀请或认领流程的 person，永远无法登录。

---

## 8. 关系锚点能力（Relation Anchor）

Person 插件包 **必须作为关系锚点存在**，即使其他插件包尚未安装。

### 8.1 关系接口（最低要求）

- `person ↔ project`
- `person ↔ finance`
- `person ↔ quotation`

未安装对应插件包时，只显示占位与提示，不报错。

**验收条件**：
> 安装/卸载其他插件包，不得破坏 person 索引与主体完整性。

---

## 9. 显现方式（Presentation Requirements）

Person 插件包 **至少提供以下显现**：
1. **Verified Person 列表**
2. **Staging 审核池**
3. **Person 详情页**
4. **邀请 / 启用登录操作入口**

**强制原则**
- 显现 **只能读取索引**
- 写操作 **只能通过功能动作**
- UI **不得直接修改文档内容**

---

## 10. 卸载与降级行为（Critical）

卸载 person 插件包时：
- 所有 person 索引失效
- 所有相关 UI/能力入口隐藏
- **文档本体保留**，但视为普通文档

**验收条件**：
> 系统不得因卸载 person 插件包而崩溃或残留"幽灵能力"。

---

## 11. Person 插件包作为模板的意义（规范性说明）

当 Person 插件包通过本规范验收后：
- 后续所有插件包（project / finance / quotation）
- **必须复用相同通路结构**
- 仅替换：
  - 类型合同
  - 索引字段
  - 专属功能

---

## 12. 本规范的最终验收结论标准

Person 插件包 只有在满足以下条件时，才算通过 v1.0 验收：
- **所有通路可跑通**
- **无"隐式能力"**
- **无"越权索引"**
- **无"未声明即存在"的系统行为**

> **通过 Person，即通过系统的第一性原则。**

---

## 附录 A：索引记录完整结构

```typescript
interface PersonIndexRecord {
    // 标识
    person_id: string;
    source_doc: string;
    
    // 索引状态
    status: 'staging' | 'verified';
    confidence: number;  // 0-100
    missing_fields: string[];
    issues: string[];
    
    // 核心字段快照
    display_name: string;
    contact: {
        email?: string;
        phone?: string;
    };
    
    // 登录状态
    access: {
        status: 'none' | 'eligible' | 'invited' | 'active' | 'suspended';
        enabled: boolean;
        last_login?: string;
        invited_at?: string;
        claimed_at?: string;
    };
    
    // 审计追踪
    audit_trail: {
        created_at: string;
        created_by?: string;
        promoted_at?: string;
        promoted_by?: string;
    };
}
```

## 附录 B：状态转换图

```
                    ┌─────────────────────────────────────────────────────┐
                    │                   文档层                             │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
                    │  │ 无 doc-type │  │ 未知 type  │  │ person 文档  │  │
                    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
                    └─────────┼────────────────┼────────────────┼─────────┘
                              │                │                │
                              ▼                ▼                ▼
                    ┌─────────────────────────────────────────────────────┐
                    │                   隔离/索引层                        │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
                    │  │quarantine/  │  │quarantine/  │  │   staging   │  │
                    │  │  no-type    │  │unknown-type │  │    pool     │  │
                    │  └─────────────┘  └─────────────┘  └──────┬──────┘  │
                    └──────────────────────────────────────────┼──────────┘
                                                               │
                                         ┌─────────────────────┼─────────────────────┐
                                         │ 满足核心字段合同     │                     │
                                         ▼                     │                     │
                              ┌─────────────────┐              │                     │
                              │    verified     │◄─────────────┘                     │
                              │     index       │                                    │
                              └────────┬────────┘                                    │
                                       │                                             │
                    ┌──────────────────┼──────────────────────────────────────────────┘
                    │                  │
                    │  ┌───────────────┼───────────────────────────────────────────┐
                    │  │               │              登录状态机                    │
                    │  │               ▼                                           │
                    │  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐          │
                    │  │  │  none  │─►│eligible│─►│invited │─►│ active │          │
                    │  │  └────────┘  └────────┘  └────────┘  └───┬────┘          │
                    │  │                                          │                │
                    │  │                                          ▼                │
                    │  │                                    ┌──────────┐           │
                    │  │                                    │suspended │           │
                    │  │                                    └──────────┘           │
                    │  └───────────────────────────────────────────────────────────┘
                    │
                    └─────────────────────────────────────────────────────────────────
```


