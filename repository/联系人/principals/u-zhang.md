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

# 张会计 {#u-zhang}

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

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/employees.md#p-employee-u-zhang" }
  - { ref: "users/profiles/client-contacts.md#p-client-contact-u-zhang" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

张会计负责财务工作，同时也是快手的财务对接人。

