---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# Profile Type Registry

本文档定义了系统支持的 Profile 类型。Profile 是 Principal（登录主体）在特定业务语境下的身份投影。

---

## Profile 类型注册表 {#reg-profile-types}

```yaml
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

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.settings }
```

Profile Type Registry 定义了系统支持的所有 Profile 类型，包括每种类型的必填字段、可选字段和编辑权限。

---

## 员工档案类型定义 {#profile-type-employee}

```yaml
type: type_definition
id: profile-type-employee
title: 员工档案类型
status: active

extends: profile
profile_type: employee

fields:
  - name: employee_no
    type: string
    required: true
    description: 员工工号
  - name: department
    type: string
    required: true
    description: 所属部门
  - name: title
    type: string
    required: true
    description: 职位名称
  - name: level
    type: string
    required: false
    description: 职级（如 L5, P7）
  - name: join_date
    type: date
    required: false
    description: 入职日期
  - name: default_roles
    type: array
    required: false
    description: 默认权限角色列表

$display:
  color: { token: color.type.profile }
  icon: { token: icon.general.user }
```

员工档案用于记录内部员工的组织信息，包括工号、部门、职位等。

---

## 客户联系人档案类型定义 {#profile-type-client-contact}

```yaml
type: type_definition
id: profile-type-client-contact
title: 客户联系人档案类型
status: active

extends: profile
profile_type: client_contact

fields:
  - name: client_ref
    type: ref
    required: true
    description: 所属客户的引用
  - name: role_title
    type: string
    required: true
    description: 在客户公司的职位
  - name: department
    type: string
    required: false
    description: 所属部门
  - name: relationship_strength
    type: number
    required: false
    description: 关系强度（1-5）
  - name: notes
    type: string
    required: false
    description: 备注信息
  - name: tags
    type: array
    required: false
    description: 标签列表（如决策人、技术对接）

$display:
  color: { token: color.type.profile }
  icon: { token: icon.general.user }
```

客户联系人档案用于记录与客户公司相关的联系人信息，建立 Principal 与 Client 之间的关联。

---

## 使用说明

### 创建新的 Profile

1. 首先确保对应的 Principal 已存在
2. 在 `users/profiles/` 目录下的对应文档中创建 Profile Block
3. 使用 `principal_ref` 引用所属的 Principal

### 添加新的 Profile Type

1. 在本文档中添加新的类型定义 Block
2. 更新 `#reg-profile-types` 中的 `types` 字段
3. 在 Schema Validator 中添加校验规则
4. 创建对应的档案文档

### Profile Type 字段约束

- `required_fields`: 创建 Profile 时必须填写的字段
- `optional_fields`: 可选字段，不填写时使用默认值或留空
- `editable_by`: 允许编辑此类型 Profile 的角色列表

