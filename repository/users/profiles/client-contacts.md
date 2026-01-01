---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# 客户联系人档案

本文档存储所有客户联系人的 Client Contact Profile（客户联系人档案）信息。

---

## 王编辑 - 中信出版社联系人 {#p-client-contact-u-wang}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-u-wang
principal_ref: { ref: "users/principals.md#u-wang" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-zhongxin" }
role_title: 责任编辑
department: 编辑部
relationship_strength: 5

notes: |
  主要对接人，偏好微信沟通
  每周三下午可约会议

tags:
  - 决策人
  - 编辑

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

王编辑是中信出版社的主要联系人，负责编辑工作的对接。

---

## 张会计 - 快手联系人 {#p-client-contact-u-zhang}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-u-zhang
principal_ref: { ref: "users/principals.md#u-zhang" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-kuaishou" }
role_title: 财务对接
department: 财务部
relationship_strength: 4

notes: |
  负责结算和发票事宜
  响应迅速，工作认真

tags:
  - 财务
  - 结算

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

张会计是快手的财务对接人，负责项目结算相关事宜。

---

## 外部联系人 - 赵经理 {#p-client-contact-zhao}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-zhao
principal_ref: { ref: "users/principals.md#u-zhao" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-xinshijie" }
role_title: 项目经理
department: 市场部
relationship_strength: 3

notes: |
  新世界出版社的项目对接人
  通常通过邮件沟通

tags:
  - 项目管理
  - 市场

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

赵经理是新世界出版社的项目经理。

