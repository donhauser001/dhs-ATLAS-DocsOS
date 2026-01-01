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

# 郑二 {#u-zhenger}

```yaml
type: principal
id: u-zhenger
display_name: 郑二
status: active

identity:
  emails:
    - zheng-er@example.com
  phones:
    - "13822227739"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-zhenger" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

郑二是海通商贸的采购经理。

