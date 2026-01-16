# Week 2 - 核心认证服务

> 周期: 2026-01-06 ~ 2026-01-10  
> 状态: ✅ 已完成

## 本周目标

完成认证索引服务、登录 API、邮件服务集成

## 任务进度

| ID | 任务 | 工期 | 状态 | 完成度 |
|----|------|------|------|--------|
| 4.2.4 | 认证索引服务 | 3天 | ✅ | 100% |
| 4.2.5 | 登录认证 API | 2天 | ✅ | 100% |
| 4.2.8 | 邮件服务集成 | 2天 | ✅ | 100% |
| 4.2.11 | 凭证唯一性校验 | 1天 | ✅ | 100% |
| 4.2.12 | 用户ID预生成 API | 1天 | ✅ | 100% |

## 完成内容

### 4.2.4 认证索引服务

**新增文件**:
- `backend/src/services/auth-credential-indexer.ts`

**功能**:
- 扫描所有文档，识别 `type: __atlas_user_auth__` 数据块
- 构建 `auth-users.json` 索引
- 支持单文档多用户
- 维护凭证映射（用户名/邮箱/手机 -> user_id）

**核心函数**:
- `scanDocumentForAuthBlocks()` - 扫描文档认证数据块
- `rebuildAuthUsersIndex()` - 重建索引
- `getAuthUsersIndex()` - 获取索引
- `findUserByCredential()` - 通过凭证查找用户
- `validateCredentialUniqueness()` - 凭证唯一性校验

**索引结构**:
```json
{
  "_meta": {
    "index_name": "auth-users",
    "version": "2.0",
    "identifier": "__atlas_user_auth__"
  },
  "credentials": {
    "username": { "type": "username", "user_id": "U..." }
  },
  "users": {
    "U...": { /* 用户记录 */ }
  }
}
```

### 4.2.5 登录认证 API

**修改文件**:
- `backend/src/api/auth.ts` - 完全重写
- `backend/src/services/auth-service.ts` - 重写适配新索引
- `backend/src/middleware/permission.ts` - 更新

**API 端点**:
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录（用户名/邮箱/手机） |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/change-password | 修改密码 |
| GET | /api/auth/generate-user-id | 生成用户ID |
| POST | /api/auth/generate-user-ids | 批量生成用户ID |
| POST | /api/auth/validate-credential | 凭证唯一性校验 |
| GET | /api/auth/password-policy | 获取密码策略 |

**登录流程**:
1. 查找凭证 → 获取用户 → 检查状态 → 验证密码
2. 检查过期 → 获取角色权限 → 生成 JWT → 更新登录时间

**状态检查**: pending/disabled/locked/expired 返回对应错误码

### 4.2.8 邮件服务集成

**新增文件**:
- `backend/src/services/email-service.ts`
- `backend/src/templates/email/activation.html`
- `backend/src/templates/email/reset-password.html`
- `backend/src/templates/email/welcome.html`

**功能**:
- 支持预设服务商（QQ/163/Gmail/Outlook/阿里企业邮）
- 支持自定义 SMTP 配置
- 美观的 HTML 邮件模板
- 测试邮件功能

**核心函数**:
- `sendEmail()` - 发送邮件
- `sendActivationEmail()` - 发送激活邮件
- `sendPasswordResetEmail()` - 发送密码重置邮件
- `sendWelcomeEmail()` - 发送欢迎邮件
- `testEmailConfig()` - 测试邮件配置

**API 端点**:
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings/email/providers | 获取预设服务商列表 |
| GET | /api/settings/email/status | 获取邮件服务状态 |
| POST | /api/settings/email/test | 测试邮件配置 |
| POST | /api/settings/email/send-test | 发送测试邮件 |

### 4.2.11 凭证唯一性校验

已集成到 `auth-credential-indexer.ts`:
- `validateCredentialUniqueness()` 函数
- POST /api/auth/validate-credential API

### 4.2.12 用户ID预生成 API

已集成到 `auth-credential-indexer.ts`:
- `generateUserId()` - 生成单个ID
- `generateUserIds()` - 批量生成ID
- ID格式: `U + 日期 + 序号`（如 U20260106001）

### 索引管理 API

**新增文件**:
- `backend/src/api/indexes.ts`

**API 端点**:
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/indexes/auth/rebuild | 重建认证索引 |
| GET | /api/indexes/auth | 获取认证索引元数据 |
| GET | /api/indexes/auth/stats | 获取索引统计 |
| POST | /api/indexes/rebuild-all | 重建所有索引 |

## 新增依赖

```bash
npm install jsonwebtoken @types/jsonwebtoken
npm install nodemailer @types/nodemailer
```

## 周总结

### 完成情况

- ✅ 认证索引服务完整实现
- ✅ 登录认证 API 完全重写
- ✅ 邮件服务支持预设+自定义 SMTP
- ✅ 凭证唯一性校验
- ✅ 用户ID预生成
- ✅ 索引管理 API
- ✅ 权限中间件更新

### 技术亮点

1. **严格标识符设计**: 只识别 `__atlas_user_auth__` 数据块
2. **单文档多用户**: 支持一个文档包含多个用户
3. **完整状态机**: pending/active/disabled/locked/expired
4. **美观邮件模板**: 现代化设计，支持深色主题

### 下周计划

- 前端认证界面（登录/注册/找回密码/激活）
- Week 3 的任务

---

*更新日期: 2026-01-06*
