---
slug: doc-q8xo21
---
# Week 4 - 管理界面

> 周期: 2026-01-06 ~ 2026-01-06  
> 状态: ✅ 已完成

## 本周目标

完成系统设置界面、用户管理界面

## 任务进度

| ID | 任务 | 工期 | 状态 | 完成度 |
|----|------|------|------|--------|
| 4.2.14 | 系统设置界面 | 3天 | ✅ | 100% |
| 4.2.15 | 用户管理界面 | 2天 | ✅ | 100% |

## 完成内容

### 4.2.14 系统设置界面

在现有的 SettingsPage 中添加了 4 个新的设置板块：

**新增组件：**

- `frontend/src/pages/settings/RegistrationSettings.tsx` - 注册设置
  - 新用户默认状态（待激活/直接启用）
  - 激活方式（邮箱验证/管理员手动/首次登录）
  - 允许自助注册开关
  - 需要邮箱验证开关
  - 用户文档存放目录
  - 文档命名规则

- `frontend/src/pages/settings/LoginSettings.tsx` - 登录设置
  - 允许的登录方式（用户名/邮箱/手机）
  - 锁定前失败次数
  - 锁定时长（分钟）
  - 会话有效期（天）
  - 记住我功能开关

- `frontend/src/pages/settings/PasswordPolicySettings.tsx` - 密码策略
  - 最小长度
  - 复杂度要求（大写/小写/数字/特殊字符）
  - 密码有效期
  - 历史密码限制
  - 策略预览

- `frontend/src/pages/settings/EmailSettings.tsx` - 邮件服务配置
  - 启用/禁用开关
  - 服务商选择（预设/自定义 SMTP）
  - 预设服务商支持（QQ/163/Gmail/Outlook/阿里企业邮）
  - 自定义 SMTP 配置
  - 发件人设置
  - 连接测试功能

**修改文件：**

- `frontend/src/pages/settings/SettingsPage.tsx` - 集成新设置页面

### 4.2.15 用户管理界面

**新增组件：**

- `frontend/src/pages/users/UserManagementPage.tsx` - 用户管理主页面
  - 统计概览卡片
  - 用户列表表格
  - 重建索引功能
  - 错误/成功提示

- `frontend/src/pages/users/components/UserStatsCard.tsx` - 统计概览
  - 总用户数
  - 各状态统计（启用/待激活/禁用/锁定/过期）
  - 加载状态

- `frontend/src/pages/users/components/UserTable.tsx` - 用户列表
  - 角色筛选
  - 状态筛选
  - 关键字搜索
  - 分页功能
  - 状态操作（启用/禁用/解锁）
  - 查看文档链接

**新增 API：**

- `frontend/src/api/indexes.ts` - 索引管理 API
  - `getAuthIndexStats()` - 获取统计
  - `rebuildAuthIndex()` - 重建索引
  - `getAuthUsers()` - 获取用户列表
  - `updateUserStatus()` - 更新用户状态

**后端新增接口：**

- `GET /api/indexes/auth/users` - 获取用户列表（带分页和筛选）
- `PUT /api/indexes/auth/users/:userId/status` - 更新用户状态

**路由配置：**

- `/users/management` - 用户管理页面

## 周总结

### 完成情况

- 所有 2 个子任务全部完成
- 系统设置界面：4 个设置页面
- 用户管理界面：完整的用户列表和管理功能

### 技术要点

1. 设置页面使用统一的表单模式：加载 → 编辑 → 保存
2. 用户管理支持实时筛选和分页
3. 状态操作直接修改索引中的用户状态
4. 邮件配置支持连接测试功能

### 下周计划

- Phase 4.2 后续任务
- 继续完善认证系统集成

---

*更新日期: 2026-01-06*

