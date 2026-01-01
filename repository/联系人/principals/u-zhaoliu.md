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

# 赵六 {#u-zhaoliu}

```yaml
type: principal
id: u-zhaoliu
display_name: 赵六
status: active

identity:
  emails:
    - zhao-liu@example.com
  phones:
    - "13873954565"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-zhaoliu" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

赵六是明日科技的产品总监。

