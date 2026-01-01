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

# 陈七 {#u-chenqi}

```yaml
type: principal
id: u-chenqi
display_name: 陈七
status: active

identity:
  emails:
    - chen-qi@example.com
  phones:
    - "13893649480"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "联系人/profiles/client-contacts.md#p-client-contact-chenqi" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

陈七是华创投资的投资经理。

