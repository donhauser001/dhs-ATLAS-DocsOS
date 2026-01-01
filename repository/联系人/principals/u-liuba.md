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

# 刘八 {#u-liuba}

```yaml
type: principal
id: u-liuba
display_name: 刘八
status: active

identity:
  emails:
    - liu-ba@example.com
  phones:
    - "13857618579"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-liuba" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

刘八是盛世传媒的创意总监。

