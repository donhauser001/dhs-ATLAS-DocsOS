/**
 * Auth Service - 认证服务
 * 
 * Phase 1: 实现用户认证和会话管理
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';
import { config, ensureDirectories } from '../config.js';
import { minimatch } from 'minimatch';

// ============================================================
// 类型定义
// ============================================================

export type UserRole = 'admin' | 'staff' | 'client';

export interface UserPermissions {
  /** 可访问的路径（glob 模式） */
  paths: string[];
  /** 是否可以创建 Proposal */
  can_create_proposal: boolean;
  /** 是否可以执行 Proposal */
  can_execute_proposal: boolean;
}

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  name: string;
  /** 关联的客户 ID（仅 client 角色） */
  client_id?: string;
  permissions: UserPermissions;
}

export interface UsersData {
  users: User[];
}

export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  client_id?: string;
  permissions: UserPermissions;
}

// ============================================================
// 用户数据管理
// ============================================================

/**
 * 获取所有用户数据
 */
export function getUsersData(): UsersData {
  ensureDirectories();
  
  if (!existsSync(config.usersPath)) {
    // 创建默认用户数据
    const defaultData = createDefaultUsersData();
    writeFileSync(config.usersPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  
  try {
    return JSON.parse(readFileSync(config.usersPath, 'utf-8'));
  } catch {
    const defaultData = createDefaultUsersData();
    writeFileSync(config.usersPath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

/**
 * 创建默认用户数据
 */
function createDefaultUsersData(): UsersData {
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const staffPasswordHash = bcrypt.hashSync('staff123', 10);
  const clientPasswordHash = bcrypt.hashSync('client123', 10);
  
  return {
    users: [
      {
        id: 'user-admin',
        username: 'admin',
        password_hash: adminPasswordHash,
        role: 'admin',
        name: '系统管理员',
        permissions: {
          paths: ['**'],
          can_create_proposal: true,
          can_execute_proposal: true,
        },
      },
      {
        id: 'user-staff-001',
        username: 'designer',
        password_hash: staffPasswordHash,
        role: 'staff',
        name: '设计师小王',
        permissions: {
          paths: ['**'],
          can_create_proposal: true,
          can_execute_proposal: false,
        },
      },
      {
        id: 'user-client-001',
        username: 'client-zhang',
        password_hash: clientPasswordHash,
        role: 'client',
        name: '张总',
        client_id: 'contact-zhang-san',
        permissions: {
          paths: [
            'projects/2025/P-001/**',
            'contacts/客户-张三.md',
          ],
          can_create_proposal: false,
          can_execute_proposal: false,
        },
      },
    ],
  };
}

// ============================================================
// 认证功能
// ============================================================

/**
 * 通过用户名获取用户
 */
export function getUserByUsername(username: string): User | null {
  const data = getUsersData();
  return data.users.find(u => u.username === username) || null;
}

/**
 * 通过 ID 获取用户
 */
export function getUserById(id: string): User | null {
  const data = getUsersData();
  return data.users.find(u => u.id === id) || null;
}

/**
 * 验证密码
 */
export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

/**
 * 转换为公开用户信息（不含密码）
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    client_id: user.client_id,
    permissions: user.permissions,
  };
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
  
  // 检查路径是否匹配任一允许的模式
  return user.permissions.paths.some(pattern => minimatch(path, pattern));
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
