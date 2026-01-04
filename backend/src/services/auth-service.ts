/**
 * Auth Service - 认证服务
 * 
 * Phase 1: 实现用户认证和会话管理
 * Phase 3.3: 重写为基于 FunctionRegistry 的 Principal 文档认证
 * 
 * 认证流程：
 * 1. 通过 email 在 FunctionRegistry 中查找 Principal
 * 2. 读取 Principal 文档获取 auth.password_hash
 * 3. 验证密码
 * 4. 创建会话
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import bcrypt from 'bcryptjs';
import { minimatch } from 'minimatch';
import { config, ensureDirectories } from '../config.js';
import { parseADL } from '../adl/parser.js';
import { findPrincipalByEmail, findPrincipalById, type FunctionEntry } from './function-registry.js';
import type { Block } from '../adl/types.js';

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

/**
 * Principal 认证信息（从文档中读取）
 */
export interface PrincipalAuth {
  /** 密码哈希 */
  password_hash: string;
  /** 上次登录时间 */
  last_login?: string;
  /** OAuth 配置 */
  oauth?: Record<string, unknown>;
}

/**
 * 用户（向后兼容旧接口）
 */
export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  name: string;
  /** 关联的客户 ID（仅 client 角色） */
  client_id?: string;
  permissions: UserPermissions;
  /** Principal 文档路径 */
  principal_path?: string;
}

/**
 * 旧版用户数据（用于 fallback）
 */
export interface UsersData {
  users: User[];
}

/**
 * 公开用户信息（不含密码）
 */
export interface PublicUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  client_id?: string;
  permissions: UserPermissions;
  /** Principal 文档路径 */
  principal_path?: string;
  /** 登录方式 */
  auth_source?: 'principal' | 'legacy';
}

// ============================================================
// Principal 文档认证（Phase 3.3 核心）
// ============================================================

/**
 * 通过 email 获取用户（从 Principal 文档）
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const entry = await findPrincipalByEmail(email);
    if (!entry) {
      return null;
    }

    return await loadUserFromPrincipal(entry);
  } catch (error) {
    console.error('[AuthService] Failed to get user by email:', error);
    return null;
  }
}

/**
 * 通过 Principal ID 获取用户
 */
export async function getUserByPrincipalId(principalId: string): Promise<User | null> {
  try {
    const entry = await findPrincipalById(principalId);
    if (!entry) {
      return null;
    }

    return await loadUserFromPrincipal(entry);
  } catch (error) {
    console.error('[AuthService] Failed to get user by principal id:', error);
    return null;
  }
}

/**
 * 从 FunctionEntry 加载完整用户信息
 */
async function loadUserFromPrincipal(entry: FunctionEntry): Promise<User | null> {
  const fullPath = join(config.repositoryRoot, entry.path);

  if (!existsSync(fullPath)) {
    console.error(`[AuthService] Principal document not found: ${entry.path}`);
    return null;
  }

  try {
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, entry.path);

    // 查找 principal block
    const principalBlock = doc.blocks.find(b => b.machine?.type === 'principal');
    if (!principalBlock) {
      console.error(`[AuthService] No principal block in document: ${entry.path}`);
      return null;
    }

    const machine = principalBlock.machine;
    const auth = machine.auth as PrincipalAuth | undefined;
    const identity = machine.identity as { emails?: string[]; phones?: string[] } | undefined;

    // 必须有密码才能登录
    if (!auth?.password_hash) {
      console.warn(`[AuthService] Principal ${entry.id} has no password_hash`);
      return null;
    }

    // 从 profiles 推断角色
    const role = inferRoleFromProfiles(machine.profiles as Array<{ ref: string }> | undefined);

    // 构建权限（基于角色）
    const permissions = buildPermissions(role, machine);

    return {
      id: machine.id as string || entry.id || '',
      username: (identity?.emails?.[0] || machine.id || '') as string,
      password_hash: auth.password_hash,
      role,
      name: (machine.display_name || machine.title || entry.title || '') as string,
      client_id: machine.client_id as string | undefined,
      permissions,
      principal_path: entry.path,
    };
  } catch (error) {
    console.error(`[AuthService] Failed to parse principal document ${entry.path}:`, error);
    return null;
  }
}

/**
 * 从 profiles 推断用户角色
 */
function inferRoleFromProfiles(profiles: Array<{ ref: string }> | undefined): UserRole {
  if (!profiles || profiles.length === 0) {
    return 'staff'; // 默认角色
  }

  for (const profile of profiles) {
    const ref = profile.ref?.toLowerCase() || '';
    // 如果有 admin 相关的 profile，返回 admin
    if (ref.includes('admin')) {
      return 'admin';
    }
    // 如果有 client-contact 相关的 profile，返回 client
    if (ref.includes('client-contact') || ref.includes('client_contact')) {
      return 'client';
    }
  }

  return 'staff';
}

/**
 * 根据角色构建权限
 */
function buildPermissions(role: UserRole, machine: Record<string, unknown>): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        paths: ['**'],
        can_create_proposal: true,
        can_execute_proposal: true,
      };
    case 'staff':
      return {
        paths: ['**'],
        can_create_proposal: true,
        can_execute_proposal: false,
      };
    case 'client': {
      // 客户只能访问关联的项目
      const paths: string[] = [];
      const clientId = machine.client_id as string | undefined;
      if (clientId) {
        paths.push(`projects/**/${clientId}/**`);
        paths.push(`genesis/${clientId}/**`);
      }
      return {
        paths: paths.length > 0 ? paths : ['**'], // fallback
        can_create_proposal: false,
        can_execute_proposal: false,
      };
    }
  }
}

// ============================================================
// 旧版兼容（Fallback to users.json）
// ============================================================

/**
 * 获取所有用户数据（旧版，用于 fallback）
 * @deprecated 将在后续版本移除
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

/**
 * 通过用户名获取用户（旧版 fallback）
 */
export function getUserByUsername(username: string): User | null {
  const data = getUsersData();
  return data.users.find(u => u.username === username) || null;
}

/**
 * 通过 ID 获取用户（支持新旧两种方式）
 */
export async function getUserById(id: string): Promise<User | null> {
  // 先尝试从 Principal 文档获取
  const principalUser = await getUserByPrincipalId(id);
  if (principalUser) {
    return principalUser;
  }

  // Fallback: 从 users.json 获取
  const data = getUsersData();
  return data.users.find(u => u.id === id) || null;
}

/**
 * 同步版本：通过 ID 获取用户（旧版兼容）
 */
export function getUserByIdSync(id: string): User | null {
  const data = getUsersData();
  return data.users.find(u => u.id === id) || null;
}

// ============================================================
// 认证功能
// ============================================================

/**
 * 验证密码
 */
export function verifyPassword(user: User, password: string): boolean {
  return bcrypt.compareSync(password, user.password_hash);
}

/**
 * 转换为公开用户信息（不含密码）
 */
export function toPublicUser(user: User, authSource: 'principal' | 'legacy' = 'legacy'): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
    client_id: user.client_id,
    permissions: user.permissions,
    principal_path: user.principal_path,
    auth_source: user.principal_path ? 'principal' : authSource,
  };
}

/**
 * 生成密码哈希（用于创建/更新 Principal 文档）
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
  // Admin 和 Staff 角色可以访问所有路径
  if (user.role === 'admin' || user.role === 'staff') {
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
