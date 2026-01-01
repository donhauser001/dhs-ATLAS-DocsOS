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

# 李四 {#u-lisi}

```yaml
type: principal
id: u-lisi
display_name: 李四
status: active

identity:
  emails:
    - li-si@example.com
  phones:
    - "13867394852"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-lisi" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

李四是蓝海集团的品牌经理。

