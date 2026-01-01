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

# 周十 {#u-zhoushi}

```yaml
type: principal
id: u-zhoushi
display_name: 周十
status: active

identity:
  emails:
    - zhou-shi@example.com
  phones:
    - "13883841702"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-zhoushi" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

周十是金鼎地产的营销总监。

