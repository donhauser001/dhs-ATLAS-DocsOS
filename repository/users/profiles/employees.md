---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# 员工档案

本文档存储所有员工的 Employee Profile（员工档案）信息。

---

## 王编辑 - 员工档案 {#p-employee-u-wang}

```yaml
type: profile
profile_type: employee
id: p-employee-u-wang
principal_ref: { ref: "users/principals.md#u-wang" }
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

王编辑于 2020 年加入公司，目前担任设计部创意总监。

---

## 李主管 - 员工档案 {#p-employee-u-li}

```yaml
type: profile
profile_type: employee
id: p-employee-u-li
principal_ref: { ref: "users/principals.md#u-li" }
status: active

employee:
  employee_no: DHS-0002
  department: 项目管理部
  title: 项目总监
  level: L4
  join_date: 2021-03-01

default_roles:
  - pm
  - reviewer

$display:
  color: { token: color.status.active }
  icon: { token: icon.general.user }
```

李主管于 2021 年加入公司，负责项目管理和客户对接。

---

## 张会计 - 员工档案 {#p-employee-u-zhang}

```yaml
type: profile
profile_type: employee
id: p-employee-u-zhang
principal_ref: { ref: "users/principals.md#u-zhang" }
status: active

employee:
  employee_no: DHS-0003
  department: 财务部
  title: 财务主管
  level: L3
  join_date: 2019-06-01

default_roles:
  - finance
  - viewer

$display:
  color: { token: color.status.active }
  icon: { token: icon.general.user }
```

张会计于 2019 年加入公司，是财务部的资深成员。

