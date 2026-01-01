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
principal_ref: { ref: "users/principals/u-wang.md#u-wang" }
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
principal_ref: { ref: "users/principals/u-zhang.md#u-zhang" }
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
principal_ref: { ref: "users/principals/u-zhao.md#u-zhao" }
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

---

## 张三 - 星云科技联系人 {#p-client-contact-zhangsan}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-zhangsan
principal_ref: { ref: "users/principals/u-zhangsan.md#u-zhangsan" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-xingyun" }
role_title: 市场总监
department: 市场部
relationship_strength: 3

tags:
  - 决策人
  - 市场

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

张三是星云科技有限公司的市场总监。

---

## 李四 - 蓝海集团联系人 {#p-client-contact-lisi}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-lisi
principal_ref: { ref: "users/principals/u-lisi.md#u-lisi" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-lanhai" }
role_title: 品牌经理
department: 品牌部
relationship_strength: 3

tags:
  - 品牌
  - 营销

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

李四是蓝海集团的品牌经理。

---

## 王五 - 云峰控股联系人 {#p-client-contact-wangwu}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-wangwu
principal_ref: { ref: "users/principals/u-wangwu.md#u-wangwu" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-yunfeng" }
role_title: CEO
department: 管理层
relationship_strength: 5

tags:
  - 决策人
  - 高管

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

王五是云峰控股的 CEO。

---

## 赵六 - 明日科技联系人 {#p-client-contact-zhaoliu}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-zhaoliu
principal_ref: { ref: "users/principals/u-zhaoliu.md#u-zhaoliu" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-mingri" }
role_title: 产品总监
department: 产品部
relationship_strength: 4

tags:
  - 产品
  - 决策人

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

赵六是明日科技的产品总监。

---

## 陈七 - 华创投资联系人 {#p-client-contact-chenqi}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-chenqi
principal_ref: { ref: "users/principals/u-chenqi.md#u-chenqi" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-huachuang" }
role_title: 投资经理
department: 投资部
relationship_strength: 4

tags:
  - 投资
  - 财务

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

陈七是华创投资的投资经理。

---

## 刘八 - 盛世传媒联系人 {#p-client-contact-liuba}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-liuba
principal_ref: { ref: "users/principals/u-liuba.md#u-liuba" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-shengshi" }
role_title: 创意总监
department: 创意部
relationship_strength: 4

tags:
  - 创意
  - 设计

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

刘八是盛世传媒的创意总监。

---

## 孙九 - 远航物流联系人 {#p-client-contact-sunjiu}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-sunjiu
principal_ref: { ref: "users/principals/u-sunjiu.md#u-sunjiu" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-yuanhang" }
role_title: 运营总监
department: 运营部
relationship_strength: 3

tags:
  - 运营
  - 物流

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

孙九是远航物流的运营总监。

---

## 周十 - 金鼎地产联系人 {#p-client-contact-zhoushi}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-zhoushi
principal_ref: { ref: "users/principals/u-zhoushi.md#u-zhoushi" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-jinding" }
role_title: 营销总监
department: 营销部
relationship_strength: 4

tags:
  - 营销
  - 决策人

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

周十是金鼎地产的营销总监。

---

## 吴一 - 天宇教育联系人 {#p-client-contact-wuyi}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-wuyi
principal_ref: { ref: "users/principals/u-wuyi.md#u-wuyi" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-tianyu" }
role_title: 品牌经理
department: 品牌部
relationship_strength: 3

tags:
  - 品牌
  - 教育

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

吴一是天宇教育的品牌经理。

---

## 郑二 - 海通商贸联系人 {#p-client-contact-zhenger}

```yaml
type: profile
profile_type: client_contact
id: p-client-contact-zhenger
principal_ref: { ref: "users/principals/u-zhenger.md#u-zhenger" }
status: active

client_ref: { ref: "genesis/客户管理.md#client-haitong" }
role_title: 采购经理
department: 采购部
relationship_strength: 3

tags:
  - 采购
  - 供应链

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
```

郑二是海通商贸的采购经理。

