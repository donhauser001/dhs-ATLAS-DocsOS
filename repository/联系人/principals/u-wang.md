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

# 王编辑 {#u-wang}

```yaml
type: principal
id: wangbianji
display_name: 王编辑
status: active
identity:
  emails:
    - wang@zhongxin.com
  phones:
    - 138-0000-0001
auth:
  password_hash: $2a$10$rQnKz5zH5V5b5Q5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a
profiles:
  - ref: users/profiles/employees.md#p-employee-u-wang
  - ref: users/profiles/client-contacts.md#p-client-contact-u-wang
$display:
  color:
    token: color.brand.primary
  icon:
    token: icon.general.user
```

王编辑是公司的创意总监，同时也是中信出版社的主要对接人。

