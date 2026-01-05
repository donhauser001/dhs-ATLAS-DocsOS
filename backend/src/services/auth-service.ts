/**
 * Auth Service - 认证服务
 * 
 * Phase 4.2: 完全基于 auth-users.json 索引的认证系统
 * 
 * 职责：
 * - 提供用户查询接口（供中间件使用）
 * - 权限检查
 * - 密码验证
 */

import bcrypt from 'bcryptjs';
import { minimatch } from 'minimatch';
import {
  findUserByCredential,
  findUserById as findUserByIdFromIndex,
  type UserRecord,
} from './auth-credential-indexer.js';
import { getRoleById } from './user-settings.js';

// ============================================================
// 类型定义
// ============================================================

export interface UserPermissions {
  /** 可访问的路径（glob 模式） */
  paths: string[];
  /** 是否可以创建 Proposal */
  can_create_proposal: boolean;
  /** 是否可以执行 Proposal */
  can_execute_proposal: boolean;
}

/**
 * 公开用户信息（不含密码）
 */
export interface PublicUser {
  id: string;
  username: string;
  role: string;
  name: string;
  email?: string;
  phone?: string;
  permissions: UserPermissions;
  /** 登录方式 */
  auth_source?: 'index' | 'legacy';
}

/**
 * 内部用户（兼容旧接口）
 */
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  name: string;
  client_id?: string;
  permissions: UserPermissions;
  principal_path?: string;
}

// ============================================================
// 用户查询（从新索引系统）
// ============================================================

/**
 * 通过凭证（用户名/邮箱/手机）获取用户
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const record = await findUserByCredential(email);
  if (!record) return null;
  return userRecordToUser(record);
}

/**
 * 通过用户名获取用户
 */
export async function getUserByUsername(username: string): Promise<User | null> {
  const record = await findUserByCredential(username);
  if (!record) return null;
  return userRecordToUser(record);
}

/**
 * 通过 ID 获取用户（异步版本）
 */
export async function getUserById(id: string): Promise<User | null> {
  const record = await findUserByIdFromIndex(id);
  if (!record) return null;
  return userRecordToUser(record);
}

/**
 * 同步版本：通过 ID 获取用户
 * 注意：这个函数现在是同步的包装，实际上会阻塞
 * 在可能的情况下应该使用异步版本 getUserById
 * 
 * @deprecated 尽量使用异步版本 getUserById
 */
export function getUserByIdSync(id: string): User | null {
  // 由于新索引系统是异步的，这里需要特殊处理
  // 在这个简化版本中，我们返回 null 并建议使用异步版本
  console.warn('[AuthService] getUserByIdSync is deprecated, use getUserById instead');
  return null;
}

/**
 * 将 UserRecord 转换为 User 格式
 */
async function userRecordToUser(record: UserRecord): Promise<User> {
  const roleInfo = await getRoleById(record.role);
  const permissions: UserPermissions = roleInfo?.permissions ? {
    paths: roleInfo.permissions.paths,
    can_create_proposal: roleInfo.permissions.can_create_proposal,
    can_execute_proposal: roleInfo.permissions.can_execute_proposal,
  } : {
    paths: ['@public'],
    can_create_proposal: false,
    can_execute_proposal: false,
  };
  
  return {
    id: record.user_id,
    username: record.username,
    password_hash: record.password_hash,
    role: record.role,
    name: record.username, // 使用 username 作为 name
    permissions,
  };
}

// ============================================================
// 认证功能
// ============================================================

/**
 * 验证密码
 */
export function verifyPassword(user: User, password: string): boolean {
  if (!user.password_hash) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

/**
 * 转换为公开用户信息（不含密码）
 */
export function toPublicUser(user: User, authSource: 'index' | 'legacy' = 'index'): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    permissions: user.permissions,
    auth_source: authSource,
  };
}

/**
 * 生成密码哈希
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

// ============================================================
// 权限检查
// ============================================================

/**
 * 检查用户是否有权访问指定路径
 */
export function checkPathPermission(user: PublicUser, path: string): boolean {
  // Admin 角色可以访问所有路径
  if (user.role === 'admin') {
    return true;
  }
  
  // Staff 角色也可以访问所有路径
  if (user.role === 'staff') {
    return true;
  }
  
  // 检查 ** 通配符
  if (user.permissions.paths.includes('**')) {
    return true;
  }
  
  // 检查特殊路径模式
  for (const pattern of user.permissions.paths) {
    // @public - 公开内容
    if (pattern === '@public') {
      // 公开内容的判断逻辑（需要根据文档属性判断）
      continue;
    }
    
    // @self - 自己的文档
    if (pattern === '@self') {
      // 自己文档的判断逻辑
      continue;
    }
    
    // @related - 关联的文档
    if (pattern === '@related') {
      // 关联文档的判断逻辑
      continue;
    }
    
    // 普通 glob 模式匹配
    if (minimatch(path, pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * 过滤用户可访问的文档列表
 */
export function filterDocumentsByPermission<T extends { path: string }>(
  user: PublicUser,
  documents: T[]
): T[] {
  if (user.role === 'admin' || user.role === 'staff') {
    return documents;
  }
  
  return documents.filter(doc => checkPathPermission(user, doc.path));
}

/**
 * 检查用户是否可以创建 Proposal
 */
export function canCreateProposal(user: PublicUser): boolean {
  return user.permissions.can_create_proposal;
}

/**
 * 检查用户是否可以执行 Proposal
 */
export function canExecuteProposal(user: PublicUser): boolean {
  return user.permissions.can_execute_proposal;
}
