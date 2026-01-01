---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# 用户主体

本文档存储所有系统用户的 Principal（登录主体）信息。

---

## 王编辑 {#u-wang}

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
  - { ref: "users/profiles/employees.md#p-employee-u-wang" }
  - { ref: "users/profiles/client-contacts.md#p-client-contact-u-wang" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

王编辑是公司的创意总监，同时也是中信出版社的主要对接人。

---

## 李主管 {#u-li}

```yaml
type: principal
id: u-li
display_name: 李主管
status: active

identity:
  emails:
    - li@company.com
  phones:
    - "139-0000-0002"
  avatar: { token: avatar.default }
  handles:
    wechat: li_manager

profiles:
  - { ref: "users/profiles/employees.md#p-employee-u-li" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

李主管是项目管理部的负责人。

---

## 张会计 {#u-zhang}

```yaml
type: principal
id: u-zhang
display_name: 张会计
status: active

identity:
  emails:
    - zhang@company.com
  phones:
    - "137-0000-0003"
  avatar: { token: avatar.default }
  handles:
    wechat: zhang_finance

profiles:
  - { ref: "users/profiles/employees.md#p-employee-u-zhang" }
  - { ref: "users/profiles/client-contacts.md#p-client-contact-u-zhang" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

张会计负责财务工作，同时也是快手的财务对接人。

