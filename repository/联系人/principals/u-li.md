---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
atlas:
  function: principal
  capabilities: [auth.login, auth.session]
  navigation:
    visible: false
---

# 李主管 {#u-li}

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

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/employees.md#p-employee-u-li" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

李主管是项目管理部的负责人。

