# Phase 4.2 API Reference

> 版本: 1.0.0  
> 更新日期: 2026-01-06  
> 基础 URL: `http://localhost:3001`

---

## 目录

- [认证 API](#认证-api)
- [用户设置 API](#用户设置-api)
- [索引管理 API](#索引管理-api)
- [审计日志 API](#审计日志-api)
- [通用响应格式](#通用响应格式)
- [错误码](#错误码)

---

## 认证 API

### POST /api/auth/login

用户登录。

**请求体**

```json
{
  "credential": "zhangsan",       // 用户名、邮箱或手机
  "password": "password123",      // 密码
  "remember_me": true             // 可选，记住我
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "user": {
    "user_id": "U20260106001",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "role": "staff",
    "status": "active"
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2026-01-13T00:00:00.000Z"
}
```

**错误响应**

| 状态码 | 错误信息 |
|--------|---------|
| 401 | 用户不存在或密码错误 |
| 401 | 账户尚未激活 |
| 401 | 账户已被禁用 |
| 401 | 账户已被锁定 |
| 401 | 账户已过期 |

---

### POST /api/auth/logout

用户登出。

**请求头**

```
Authorization: Bearer <token>
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

### GET /api/auth/me

获取当前登录用户信息。

**请求头**

```
Authorization: Bearer <token>
```

**成功响应 (200)**

```json
{
  "success": true,
  "user": {
    "user_id": "U20260106001",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "role": "staff",
    "status": "active",
    "last_login": "2026-01-06T10:00:00.000Z",
    "permissions": {
      "paths": ["**"],
      "can_create_proposal": true,
      "can_execute_proposal": false,
      "can_manage_users": false,
      "can_manage_roles": false,
      "can_view_audit_logs": true
    }
  }
}
```

---

### POST /api/auth/register

用户注册。

**请求体**

```json
{
  "user_id": "U20260106001",        // 可选，由后端预生成
  "username": "zhangsan",           // 必填
  "email": "zhangsan@example.com",  // 必填
  "phone": "13800138000",           // 可选
  "password": "password123"         // 必填
}
```

**成功响应 (201)**

```json
{
  "success": true,
  "user_id": "U20260106001",
  "status": "pending",
  "message": "注册成功，请查收激活邮件"
}
```

**错误响应**

| 状态码 | 错误信息 |
|--------|---------|
| 400 | 用户名已存在 |
| 400 | 邮箱已被使用 |
| 400 | 密码不符合安全策略 |
| 403 | 系统不允许自助注册 |

---

### POST /api/auth/change-password

修改密码（需要登录）。

**请求头**

```
Authorization: Bearer <token>
```

**请求体**

```json
{
  "current_password": "oldPassword123",
  "new_password": "newPassword456"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误响应**

| 状态码 | 错误信息 |
|--------|---------|
| 401 | 当前密码错误 |
| 400 | 新密码不能与历史密码相同 |
| 400 | 新密码不符合安全策略 |

---

### POST /api/auth/forgot-password

发送密码重置邮件。

**请求体**

```json
{
  "email": "zhangsan@example.com"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "如果该邮箱已注册，您将收到密码重置邮件"
}
```

> **注意**: 出于安全考虑，无论邮箱是否存在都返回成功。

---

### POST /api/auth/reset-password

使用重置链接设置新密码。

**请求体**

```json
{
  "token": "reset-token-from-email",
  "password": "newPassword123"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "密码重置成功"
}
```

**错误响应**

| 状态码 | 错误信息 |
|--------|---------|
| 400 | 无效的重置链接 |
| 400 | 重置链接已过期 |
| 400 | 新密码不能与历史密码相同 |

---

### POST /api/auth/activate

激活账户。

**请求体**

```json
{
  "token": "activation-token-from-email"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "账户激活成功"
}
```

**错误响应**

| 状态码 | 错误信息 |
|--------|---------|
| 400 | 无效的激活链接 |
| 400 | 激活链接已过期 |
| 400 | 账户已激活 |

---

### POST /api/auth/resend-activation

重新发送激活邮件。

**请求体**

```json
{
  "email": "zhangsan@example.com"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "message": "激活邮件已发送"
}
```

---

### GET /api/auth/generate-user-id

预生成唯一用户ID。

**成功响应 (200)**

```json
{
  "success": true,
  "user_id": "U20260106001"
}
```

---

### POST /api/auth/validate-credential

验证凭证唯一性。

**请求体**

```json
{
  "type": "username",    // username | email | phone
  "value": "zhangsan",
  "exclude_user_id": "U20260106001"  // 可选，排除指定用户
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "available": true,
  "message": "凭证可用"
}
```

---

### POST /api/auth/validate-password

验证密码强度。

**请求体**

```json
{
  "password": "TestPass123!"
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "valid": true,
  "strength": "strong",
  "errors": []
}
```

---

## 用户设置 API

### GET /api/settings/user

获取用户管理设置。

**成功响应 (200)**

```json
{
  "success": true,
  "settings": {
    "version": "1.0",
    "registration": {
      "default_status": "pending",
      "activation_method": "email",
      "allow_self_register": false,
      "require_email_verification": true,
      "user_document_directory": "_users",
      "document_naming": "user_id"
    },
    "login": {
      "allowed_methods": ["username", "email", "phone"],
      "lockout_attempts": 5,
      "lockout_duration_minutes": 30,
      "session_duration_days": 7,
      "remember_me_enabled": true
    },
    "password": {
      "min_length": 8,
      "require_uppercase": false,
      "require_lowercase": true,
      "require_number": true,
      "require_special": false,
      "max_age_days": null,
      "history_count": 5
    },
    "email": {
      "enabled": false,
      "provider": "smtp"
    }
  }
}
```

---

### PUT /api/settings/user

更新用户管理设置（需要管理员权限）。

**请求头**

```
Authorization: Bearer <admin-token>
```

**请求体**

```json
{
  "registration": {
    "allow_self_register": true
  },
  "login": {
    "lockout_attempts": 3
  }
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "settings": { ... }
}
```

---

### GET /api/settings/user/roles

获取角色列表。

**成功响应 (200)**

```json
{
  "success": true,
  "roles": [
    {
      "id": "admin",
      "name": "管理员",
      "description": "系统管理员",
      "level": 100,
      "color": "#EF4444",
      "permissions": {
        "paths": ["**"],
        "can_create_proposal": true,
        "can_execute_proposal": true,
        "can_manage_users": true,
        "can_manage_roles": true,
        "can_view_audit_logs": true
      }
    },
    {
      "id": "staff",
      "name": "职员",
      "level": 50,
      "permissions": { ... }
    }
  ],
  "default_role": "guest"
}
```

---

### POST /api/settings/user/roles

创建新角色（需要管理员权限）。

**请求体**

```json
{
  "id": "editor",
  "name": "编辑",
  "description": "内容编辑人员",
  "level": 40,
  "color": "#10B981",
  "permissions": {
    "paths": ["content/**"],
    "can_create_proposal": true,
    "can_execute_proposal": false,
    "can_manage_users": false,
    "can_manage_roles": false,
    "can_view_audit_logs": false
  }
}
```

**成功响应 (201)**

```json
{
  "success": true,
  "role": { ... }
}
```

---

### PUT /api/settings/user/roles/:id

更新角色（需要管理员权限）。

---

### DELETE /api/settings/user/roles/:id

删除角色（需要管理员权限）。

---

### PUT /api/settings/user/roles/default

设置默认角色（需要管理员权限）。

**请求体**

```json
{
  "role_id": "guest"
}
```

---

## 索引管理 API

### GET /api/indexes/auth/stats

获取认证索引统计。

**成功响应 (200)**

```json
{
  "success": true,
  "stats": {
    "total_users": 45,
    "by_status": {
      "active": 42,
      "pending": 1,
      "disabled": 2,
      "locked": 0,
      "expired": 0
    },
    "by_role": {
      "admin": 2,
      "staff": 15,
      "client": 25,
      "guest": 3
    },
    "last_full_scan": "2026-01-06T00:00:00.000Z",
    "last_update": "2026-01-06T12:00:00.000Z"
  }
}
```

---

### POST /api/indexes/auth/rebuild

重建认证索引（需要管理员权限）。

**成功响应 (200)**

```json
{
  "success": true,
  "message": "索引重建完成",
  "stats": {
    "scanned_documents": 150,
    "found_users": 45,
    "duration_ms": 2500
  }
}
```

---

### GET /api/indexes/auth/users

获取用户列表。

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 20 |
| role | string | 按角色筛选 |
| status | string | 按状态筛选 |
| search | string | 搜索关键词 |

**成功响应 (200)**

```json
{
  "success": true,
  "users": [
    {
      "user_id": "U20260106001",
      "username": "zhangsan",
      "email": "zhangsan@example.com",
      "role": "staff",
      "status": "active",
      "_doc_path": "users/zhangsan.md",
      "last_login": "2026-01-06T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

---

### PUT /api/indexes/auth/users/:userId/status

更新用户状态（需要管理员权限）。

**请求体**

```json
{
  "status": "disabled"   // active | pending | disabled | locked | expired
}
```

**成功响应 (200)**

```json
{
  "success": true,
  "user_id": "U20260106001",
  "old_status": "active",
  "new_status": "disabled"
}
```

---

## 审计日志 API

### GET /api/audit-logs

获取审计日志列表（需要管理员权限）。

**查询参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码，默认 1 |
| limit | number | 每页数量，默认 50 |
| event_type | string | 事件类型筛选 |
| user_id | string | 用户ID筛选 |
| start_date | string | 开始日期 |
| end_date | string | 结束日期 |

**成功响应 (200)**

```json
{
  "success": true,
  "logs": [
    {
      "id": "log_20260106_001",
      "timestamp": "2026-01-06T10:00:00.000Z",
      "event_type": "LOGIN_SUCCESS",
      "user_id": "U20260106001",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "details": {
        "credential_type": "username"
      },
      "success": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000
  }
}
```

---

### GET /api/audit-logs/user/:userId

获取指定用户的审计日志（需要管理员权限）。

---

### GET /api/audit-logs/my

获取当前用户的审计日志。

**请求头**

```
Authorization: Bearer <token>
```

---

## 通用响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

---

## 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| UNAUTHORIZED | 401 | 未登录或Token无效 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| INVALID_CREDENTIAL | 401 | 凭证无效 |
| ACCOUNT_PENDING | 401 | 账户待激活 |
| ACCOUNT_DISABLED | 401 | 账户已禁用 |
| ACCOUNT_LOCKED | 401 | 账户已锁定 |
| ACCOUNT_EXPIRED | 401 | 账户已过期 |
| PASSWORD_WEAK | 400 | 密码不符合策略 |
| PASSWORD_HISTORY | 400 | 密码与历史密码重复 |
| CREDENTIAL_EXISTS | 400 | 凭证已存在 |
| TOKEN_INVALID | 400 | Token无效 |
| TOKEN_EXPIRED | 400 | Token已过期 |
| EMAIL_NOT_CONFIGURED | 500 | 邮件服务未配置 |

---

## 事件类型

审计日志记录以下事件类型：

| 事件类型 | 说明 |
|---------|------|
| LOGIN_SUCCESS | 登录成功 |
| LOGIN_FAILURE | 登录失败 |
| LOGOUT | 登出 |
| PASSWORD_CHANGE | 密码修改 |
| PASSWORD_RESET | 密码重置 |
| ROLE_CHANGE | 角色变更 |
| STATUS_CHANGE | 状态变更 |
| USER_CREATE | 用户创建 |
| USER_DELETE | 用户删除 |
| ACCOUNT_LOCKED | 账户锁定 |
| ACCOUNT_UNLOCKED | 账户解锁 |

---

*创建日期: 2026-01-06*  
*版本: 1.0.0*

