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

# 孙九 {#u-sunjiu}

```yaml
type: principal
id: u-sunjiu
display_name: 孙九
status: active

identity:
  emails:
    - sun-jiu@example.com
  phones:
    - "13855909346"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-sunjiu" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

孙九是远航物流的运营总监。

