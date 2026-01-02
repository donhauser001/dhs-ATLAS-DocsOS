---
version: "1.0"
document_type: system
atlas:
  function: registry
  entity_type: label_registry
---

# 标签注册表 {#label-registry}

```yaml
type: label_registry
id: reg-labels
status: active
title: ATLAS 标签注册表

labels:
  # ====================================
  # 结构字段
  # ====================================
  类型:
    icon: box
    aliases: [type]
  标识符:
    icon: hash
    aliases: [id]
  状态:
    icon: activity
    aliases: [status]
  
  # ====================================
  # 常用字段
  # ====================================
  标题:
    icon: heading
    aliases: [title]
  显示名称:
    icon: user
    aliases: [display_name, name]
  描述:
    icon: align-left
    aliases: [description, desc]
  
  # ====================================
  # 元数据字段（Phase 3.5 扩展）
  # ====================================
  版本:
    icon: git-branch
    aliases: [version]
  文档类型:
    icon: file-type
    aliases: [document_type, doc_type]
  创建时间:
    icon: calendar-plus
    aliases: [created, created_at, create_time]
  更新时间:
    icon: calendar-check
    aliases: [updated, updated_at, update_time]
  作者:
    icon: user-pen
    aliases: [author, creator]
  
  # ====================================
  # 功能声明字段
  # ====================================
  功能类型:
    icon: zap
    aliases: [atlas.function, function]
  实体类型:
    icon: database
    aliases: [atlas.entity_type, entity_type]
  能力标签:
    icon: tags
    aliases: [atlas.capabilities, capabilities]
  导航配置:
    icon: navigation
    aliases: [atlas.navigation, navigation]
  
  # ====================================
  # 联系人/用户字段
  # ====================================
  邮箱:
    icon: mail
    aliases: [email, emails]
  电话:
    icon: phone
    aliases: [phone, phones]
  微信:
    icon: message-circle
    aliases: [wechat]
  地址:
    icon: map-pin
    aliases: [address]
  备注:
    icon: sticky-note
    aliases: [notes, remark]
  
  # ====================================
  # 组织/关系字段
  # ====================================
  组织:
    icon: building-2
    aliases: [organization, org]
  部门:
    icon: briefcase
    aliases: [department, dept]
  职位:
    icon: badge
    aliases: [position, job_title]
  关联客户:
    icon: link
    aliases: [client, client_ref]
  关联项目:
    icon: folder-kanban
    aliases: [project, project_ref]
  
  # ====================================
  # 项目/业务字段
  # ====================================
  预算:
    icon: wallet
    aliases: [budget]
  价格:
    icon: dollar-sign
    aliases: [price]
  时间范围:
    icon: calendar-range
    aliases: [duration, timeframe]
  优先级:
    icon: signal
    aliases: [priority]
  截止日期:
    icon: alarm-clock
    aliases: [deadline, due_date]
  
  # ====================================
  # 服务/分类字段
  # ====================================
  服务:
    icon: settings
    aliases: [service, services]
  分类:
    icon: folder
    aliases: [category, categories]
  标签:
    icon: tag
    aliases: [tags]
  引用:
    icon: link-2
    aliases: [refs, references]

hidden_fields:
  - password_hash
  - auth
  - _checksum
  - _indexed_at
  - _source_hash
```

本注册表定义了 ATLAS 系统中使用的所有字段标签及其图标。

## 使用方式

1. **直接使用中文标签**：在 Machine Zone 中使用中文键名，如 `邮箱: wang@example.com`
2. **使用英文别名**：系统会自动将 `email` 映射到 `邮箱`
3. **隐藏图标**：在标签名后加 `!`，如 `备注!: 私密内容`

## Phase 3.5 扩展

新增元数据字段标签：
- 版本 (version)
- 文档类型 (document_type)
- 创建时间 (created)
- 更新时间 (updated)
- 作者 (author)

新增功能声明字段标签：
- 功能类型 (atlas.function)
- 实体类型 (atlas.entity_type)
- 能力标签 (atlas.capabilities)
- 导航配置 (atlas.navigation)

