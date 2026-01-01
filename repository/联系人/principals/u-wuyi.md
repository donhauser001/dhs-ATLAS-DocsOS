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

# 吴一 {#u-wuyi}

```yaml
type: principal
id: u-wuyi
display_name: 吴一
status: active

identity:
  emails:
    - wu-yi@example.com
  phones:
    - "13802192418"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-wuyi" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

吴一是天宇教育的品牌经理。

