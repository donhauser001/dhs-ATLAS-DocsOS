---
doc-type: person
title: "{{title}}"
created: "{{created_at}}"
updated: "{{updated_at}}"
author: "{{author}}"

atlas:
  function: entity_detail
  display:
    - detail.tab
    - detail.card
  capabilities:
    - editable
    - searchable
    - linkable
    - indexable
    - exportable

_components:
  comp_display_name:
    type: text
    id: comp_display_name
    label: 显示名称
  comp_avatar:
    type: avatar
    id: comp_avatar
    label: 头像
  comp_email:
    type: email
    id: comp_email
    label: 邮箱
  comp_phone:
    type: phone
    id: comp_phone
    label: 手机号
  comp_title:
    type: text
    id: comp_title
    label: 职位
  comp_company:
    type: text
    id: comp_company
    label: 公司
  comp_department:
    type: text
    id: comp_department
    label: 部门
  comp_tags:
    type: tags
    id: comp_tags
    label: 标签
  comp_access_status:
    type: select
    id: comp_access_status
    label: 登录状态
    options:
      - value: none
        label: 无登录资格
      - value: eligible
        label: 可邀请
      - value: invited
        label: 已邀请
      - value: active
        label: 已激活
      - value: suspended
        label: 已禁用
  comp_access_enabled:
    type: toggle
    id: comp_access_enabled
    label: 启用登录
---

# {{title}}

## 身份信息

```atlas-data
type: person_identity
data:
  display_name: "{{title}}"
  avatar: ""
  email: ""
  phone: ""
  title: ""
  company: ""
  department: ""
  tags: []
_bindings:
  display_name: comp_display_name
  avatar: comp_avatar
  email: comp_email
  phone: comp_phone
  title: comp_title
  company: comp_company
  department: comp_department
  tags: comp_tags
```

## 访问控制

```atlas-data
type: person_access
data:
  access_status: "none"
  access_enabled: false
  contact_verified: false
  invited_at: ""
  claimed_at: ""
  last_login: ""
  login_count: 0
_bindings:
  access_status: comp_access_status
  access_enabled: comp_access_enabled
```

