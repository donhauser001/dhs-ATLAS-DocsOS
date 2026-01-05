/**
 * User Settings API 客户端
 * 
 * Phase 4.2: 用户管理设置 API
 */

const API_BASE = '/api/settings';

// ============================================================
// 类型定义
// ============================================================

/** 注册设置 */
export interface RegistrationSettings {
  /** 新用户默认状态: pending | active */
  default_status: 'pending' | 'active';
  /** 激活方式: manual | email | first_login */
  activation_method: 'manual' | 'email' | 'first_login';
  /** 是否允许自助注册 */
  allow_self_register: boolean;
  /** 是否需要邮箱验证 */
  require_email_verification: boolean;
  /** 新用户文档默认存放目录 */
  user_document_directory: string;
  /** 文档命名规则: username | user_id | email_prefix */
  document_naming: 'username' | 'user_id' | 'email_prefix';
}

/** 登录设置 */
export interface LoginSettings {
  /** 允许的登录方式 */
  allowed_methods: ('username' | 'email' | 'phone')[];
  /** 锁定前允许的失败次数 */
  lockout_attempts: number;
  /** 锁定时长（分钟） */
  lockout_duration_minutes: number;
  /** 会话有效期（天） */
  session_duration_days: number;
  /** 是否启用"记住我" */
  remember_me_enabled: boolean;
}

/** 密码策略 */
export interface PasswordSettings {
  /** 最小长度 */
  min_length: number;
  /** 要求大写字母 */
  require_uppercase: boolean;
  /** 要求小写字母 */
  require_lowercase: boolean;
  /** 要求数字 */
  require_number: boolean;
  /** 要求特殊字符 */
  require_special: boolean;
  /** 密码有效期（天），null 表示永不过期 */
  max_age_days: number | null;
  /** 不能重复使用的历史密码数量 */
  history_count: number;
}

/** 角色权限 */
export interface RolePermissions {
  /** 可访问的路径模式 */
  paths: string[];
  /** 能否创建 Proposal */
  can_create_proposal: boolean;
  /** 能否执行 Proposal */
  can_execute_proposal: boolean;
  /** 能否管理用户 */
  can_manage_users: boolean;
  /** 能否管理角色 */
  can_manage_roles: boolean;
  /** 能否查看审计日志 */
  can_view_audit_logs: boolean;
}

/** 角色定义 */
export interface Role {
  /** 角色标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 权限级别 */
  level: number;
  /** 显示颜色 */
  color: string;
  /** 显示图标 */
  icon: string;
  /** 权限配置 */
  permissions: RolePermissions;
}

/** 角色设置 */
export interface RolesSettings {
  /** 默认角色 */
  default_role: string;
  /** 角色列表 */
  items: Role[];
}

/** 邮件设置（安全脱敏后） */
export interface EmailSettingsSafe {
  /** 是否启用 */
  enabled: boolean;
  /** 提供商类型: preset | smtp */
  provider: 'preset' | 'smtp';
  /** 预设服务商 */
  preset_provider?: 'qq' | '163' | 'gmail' | 'outlook' | 'aliyun';
  /** 邮箱账号 */
  account?: string;
  /** 发件人名称 */
  sender_name: string;
  /** 发件人邮箱 */
  sender_email: string;
  /** SMTP 配置（脱敏） */
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
  };
}

/** 完整用户设置（安全脱敏后） */
export interface UserSettings {
  /** 配置版本 */
  version: string;
  /** 更新时间 */
  updated_at: string;
  /** 注册设置 */
  registration: RegistrationSettings;
  /** 登录设置 */
  login: LoginSettings;
  /** 密码策略 */
  password: PasswordSettings;
  /** 角色设置 */
  roles: RolesSettings;
  /** 邮件服务配置（脱敏） */
  email: EmailSettingsSafe;
}

/** 角色列表响应 */
export interface RolesResponse {
  roles: Role[];
  default_role: string;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取用户管理设置
 */
export async function getUserSettings(): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/user`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('Failed to get user settings');
  }
  
  return res.json();
}

/**
 * 更新用户管理设置
 */
export async function updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const res = await fetch(`${API_BASE}/user`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update settings' }));
    throw new Error(error.error || 'Failed to update settings');
  }
  
  const data = await res.json();
  return data.settings;
}

/**
 * 获取密码策略
 */
export async function getPasswordPolicy(): Promise<PasswordSettings> {
  const res = await fetch(`${API_BASE}/user/password-policy`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('Failed to get password policy');
  }
  
  return res.json();
}

/**
 * 获取角色列表
 */
export async function getRoles(): Promise<RolesResponse> {
  const res = await fetch(`${API_BASE}/user/roles`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    throw new Error('Failed to get roles');
  }
  
  return res.json();
}

/**
 * 获取单个角色
 */
export async function getRole(roleId: string): Promise<Role> {
  const res = await fetch(`${API_BASE}/user/roles/${encodeURIComponent(roleId)}`, {
    credentials: 'include',
  });
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Role not found');
    }
    throw new Error('Failed to get role');
  }
  
  return res.json();
}

/**
 * 创建角色
 */
export async function createRole(role: Role): Promise<Role> {
  const res = await fetch(`${API_BASE}/user/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(role),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to create role' }));
    throw new Error(error.error || 'Failed to create role');
  }
  
  const data = await res.json();
  return data.role;
}

/**
 * 更新角色
 */
export async function updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
  const res = await fetch(`${API_BASE}/user/roles/${encodeURIComponent(roleId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to update role' }));
    throw new Error(error.error || 'Failed to update role');
  }
  
  const data = await res.json();
  return data.role;
}

/**
 * 删除角色
 */
export async function deleteRole(roleId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/roles/${encodeURIComponent(roleId)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to delete role' }));
    throw new Error(error.error || 'Failed to delete role');
  }
}

/**
 * 设置默认角色
 */
export async function setDefaultRole(roleId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/user/roles/${encodeURIComponent(roleId)}/set-default`, {
    method: 'POST',
    credentials: 'include',
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to set default role' }));
    throw new Error(error.error || 'Failed to set default role');
  }
}

