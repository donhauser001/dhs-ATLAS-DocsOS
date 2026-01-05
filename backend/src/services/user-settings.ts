/**
 * 用户管理设置服务
 * 
 * Phase 4.2: 统一管理用户相关配置
 * - 注册设置
 * - 登录设置
 * - 密码策略
 * - 角色配置
 * - 邮件服务配置
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

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

/** SMTP 配置 */
export interface SmtpSettings {
  /** SMTP 服务器 */
  host: string;
  /** 端口 */
  port: number;
  /** 是否使用 SSL/TLS */
  secure: boolean;
  /** 账号 */
  user: string;
  /** 密码（加密存储） */
  pass: string;
}

/** 邮件服务配置 */
export interface EmailSettings {
  /** 是否启用 */
  enabled: boolean;
  /** 提供商类型: preset | smtp */
  provider: 'preset' | 'smtp';
  /** 预设服务商: qq | 163 | gmail | outlook | aliyun */
  preset_provider?: 'qq' | '163' | 'gmail' | 'outlook' | 'aliyun';
  /** 邮箱账号 */
  account?: string;
  /** 授权码（加密存储） */
  auth_code?: string;
  /** 发件人名称 */
  sender_name: string;
  /** 发件人邮箱 */
  sender_email: string;
  /** 自定义 SMTP 配置 */
  smtp?: SmtpSettings;
  /** 站点 URL（用于邮件中的链接） */
  site_url: string;
}

/** 完整用户设置 */
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
  /** 邮件服务配置 */
  email: EmailSettings;
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: '管理员',
    description: '系统管理员，拥有所有权限',
    level: 100,
    color: '#EF4444',
    icon: 'shield-check',
    permissions: {
      paths: ['**'],
      can_create_proposal: true,
      can_execute_proposal: true,
      can_manage_users: true,
      can_manage_roles: true,
      can_view_audit_logs: true,
    },
  },
  {
    id: 'staff',
    name: '职员',
    description: '内部员工，可编辑大部分内容',
    level: 50,
    color: '#3B82F6',
    icon: 'user',
    permissions: {
      paths: ['**'],
      can_create_proposal: true,
      can_execute_proposal: false,
      can_manage_users: false,
      can_manage_roles: false,
      can_view_audit_logs: false,
    },
  },
  {
    id: 'client',
    name: '客户',
    description: '外部客户，只能查看相关内容',
    level: 20,
    color: '#10B981',
    icon: 'user-circle',
    permissions: {
      paths: ['@self', '@related'],
      can_create_proposal: false,
      can_execute_proposal: false,
      can_manage_users: false,
      can_manage_roles: false,
      can_view_audit_logs: false,
    },
  },
  {
    id: 'guest',
    name: '访客',
    description: '最低权限，仅能查看公开内容',
    level: 1,
    color: '#6B7280',
    icon: 'eye',
    permissions: {
      paths: ['@public'],
      can_create_proposal: false,
      can_execute_proposal: false,
      can_manage_users: false,
      can_manage_roles: false,
      can_view_audit_logs: false,
    },
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  version: '1.0',
  updated_at: new Date().toISOString(),
  registration: {
    default_status: 'pending',
    activation_method: 'email',
    allow_self_register: false,
    require_email_verification: true,
    user_document_directory: '_users',
    document_naming: 'user_id',
  },
  login: {
    allowed_methods: ['username', 'email', 'phone'],
    lockout_attempts: 5,
    lockout_duration_minutes: 30,
    session_duration_days: 7,
    remember_me_enabled: true,
  },
  password: {
    min_length: 8,
    require_uppercase: false,
    require_lowercase: true,
    require_number: true,
    require_special: false,
    max_age_days: null,
    history_count: 5,
  },
  roles: {
    default_role: 'guest',
    items: DEFAULT_ROLES,
  },
  email: {
    enabled: false,
    provider: 'smtp',
    sender_name: 'ATLAS 系统',
    sender_email: '',
    site_url: 'http://localhost:5173',
  },
};

// ============================================================
// 配置文件路径
// ============================================================

/** 获取配置文件路径 */
function getConfigPath(): string {
  return join(config.atlasDataDir, 'config', 'user-settings.json');
}

/** 确保配置目录存在 */
function ensureConfigDir(): void {
  const configDir = dirname(getConfigPath());
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

// ============================================================
// 公开 API
// ============================================================

/**
 * 确保用户设置文件存在
 * 如果不存在，创建默认配置
 */
export async function ensureUserSettingsFile(): Promise<void> {
  const configPath = getConfigPath();
  
  ensureConfigDir();
  
  if (!existsSync(configPath)) {
    const defaultSettings = {
      ...DEFAULT_SETTINGS,
      updated_at: new Date().toISOString(),
    };
    writeFileSync(configPath, JSON.stringify(defaultSettings, null, 2), 'utf-8');
    console.log('[UserSettings] Created default user-settings.json');
  }
}

/**
 * 获取用户设置
 */
export async function getUserSettings(): Promise<UserSettings> {
  await ensureUserSettingsFile();
  
  const configPath = getConfigPath();
  const content = readFileSync(configPath, 'utf-8');
  
  try {
    const settings = JSON.parse(content) as UserSettings;
    
    // 合并默认值（处理新增字段）
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      registration: { ...DEFAULT_SETTINGS.registration, ...settings.registration },
      login: { ...DEFAULT_SETTINGS.login, ...settings.login },
      password: { ...DEFAULT_SETTINGS.password, ...settings.password },
      roles: { ...DEFAULT_SETTINGS.roles, ...settings.roles },
      email: { ...DEFAULT_SETTINGS.email, ...settings.email },
    };
  } catch (error) {
    console.error('[UserSettings] Failed to parse user-settings.json:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 更新用户设置
 */
export async function updateUserSettings(updates: Partial<UserSettings>): Promise<UserSettings> {
  const currentSettings = await getUserSettings();
  
  const newSettings: UserSettings = {
    ...currentSettings,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  // 深度合并子对象
  if (updates.registration) {
    newSettings.registration = { ...currentSettings.registration, ...updates.registration };
  }
  if (updates.login) {
    newSettings.login = { ...currentSettings.login, ...updates.login };
  }
  if (updates.password) {
    newSettings.password = { ...currentSettings.password, ...updates.password };
  }
  if (updates.roles) {
    newSettings.roles = { ...currentSettings.roles, ...updates.roles };
  }
  if (updates.email) {
    newSettings.email = { ...currentSettings.email, ...updates.email };
  }
  
  const configPath = getConfigPath();
  writeFileSync(configPath, JSON.stringify(newSettings, null, 2), 'utf-8');
  
  console.log('[UserSettings] Updated user-settings.json');
  
  return newSettings;
}

/**
 * 获取角色列表
 */
export async function getRoles(): Promise<Role[]> {
  const settings = await getUserSettings();
  return settings.roles.items;
}

/**
 * 获取默认角色
 */
export async function getDefaultRole(): Promise<string> {
  const settings = await getUserSettings();
  return settings.roles.default_role;
}

/**
 * 根据 ID 获取角色
 */
export async function getRoleById(roleId: string): Promise<Role | undefined> {
  const roles = await getRoles();
  return roles.find(r => r.id === roleId);
}

/**
 * 创建角色
 */
export async function createRole(role: Role): Promise<void> {
  const settings = await getUserSettings();
  
  // 检查 ID 是否重复
  if (settings.roles.items.some(r => r.id === role.id)) {
    throw new Error(`Role with id "${role.id}" already exists`);
  }
  
  settings.roles.items.push(role);
  await updateUserSettings({ roles: settings.roles });
}

/**
 * 更新角色
 */
export async function updateRole(roleId: string, updates: Partial<Role>): Promise<void> {
  const settings = await getUserSettings();
  
  const index = settings.roles.items.findIndex(r => r.id === roleId);
  if (index === -1) {
    throw new Error(`Role with id "${roleId}" not found`);
  }
  
  // 不允许修改 id
  const { id, ...safeUpdates } = updates;
  settings.roles.items[index] = { ...settings.roles.items[index], ...safeUpdates };
  
  await updateUserSettings({ roles: settings.roles });
}

/**
 * 删除角色
 */
export async function deleteRole(roleId: string): Promise<void> {
  const settings = await getUserSettings();
  
  // 不允许删除默认角色
  if (roleId === settings.roles.default_role) {
    throw new Error('Cannot delete the default role');
  }
  
  // 不允许删除 admin 角色
  if (roleId === 'admin') {
    throw new Error('Cannot delete the admin role');
  }
  
  settings.roles.items = settings.roles.items.filter(r => r.id !== roleId);
  await updateUserSettings({ roles: settings.roles });
}

/**
 * 设置默认角色
 */
export async function setDefaultRole(roleId: string): Promise<void> {
  const settings = await getUserSettings();
  
  // 检查角色是否存在
  if (!settings.roles.items.some(r => r.id === roleId)) {
    throw new Error(`Role with id "${roleId}" not found`);
  }
  
  settings.roles.default_role = roleId;
  await updateUserSettings({ roles: settings.roles });
}

/**
 * 获取密码策略
 */
export async function getPasswordPolicy(): Promise<PasswordSettings> {
  const settings = await getUserSettings();
  return settings.password;
}

/**
 * 获取邮件配置（脱敏）
 */
export async function getEmailSettingsSafe(): Promise<Omit<EmailSettings, 'auth_code' | 'smtp'> & { smtp?: Omit<SmtpSettings, 'pass'> }> {
  const settings = await getUserSettings();
  const { auth_code, smtp, ...safeEmail } = settings.email;
  
  return {
    ...safeEmail,
    smtp: smtp ? {
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      user: smtp.user,
    } : undefined,
  };
}

