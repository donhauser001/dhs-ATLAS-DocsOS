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

# 张三 {#u-zhangsan}

```yaml
type: principal
id: u-zhangsan
display_name: 张三
status: active

identity:
  emails:
    - zhang-san@example.com
  phones:
    - "13899213514"
  avatar: { token: avatar.default }

auth:
  password_hash: "$2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a"

profiles:
  - { ref: "users/profiles/client-contacts.md#p-client-contact-zhangsan" }

$display:
  color: { token: color.brand.primary }
  icon: { token: icon.general.user }
```

张三是星云科技有限公司的市场总监。

