/**
 * Visibility Resolver - 统一可见域解析器
 * 
 * Phase 1.5: 范式校正
 * 
 * 所有权限检查必须通过这个解析器
 * 不允许散落的 startsWith / minimatch
 */

import { minimatch } from 'minimatch';
import type { PublicUser } from './auth-service.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 访问检查结果
 */
export interface AccessResult {
  /** 是否允许访问 */
  allowed: boolean;
  /** 拒绝原因（如果被拒绝） */
  reason?: string;
  /** 匹配的权限模式（如果允许） */
  matchedPattern?: string;
}

/**
 * 解析后的可见域
 */
export interface ResolvedVisibility {
  /** 用户 ID */
  userId: string;
  /** 用户角色 */
  role: string;
  /** 允许访问的路径模式 */
  allowedPatterns: string[];
  /** 是否是全局访问（admin） */
  isGlobalAccess: boolean;
  /** 是否可以创建 Proposal */
  canCreateProposal: boolean;
  /** 是否可以执行 Proposal */
  canExecuteProposal: boolean;
}

// ============================================================
// 核心 API
// ============================================================

/**
 * 解析用户的可见域
 * 
 * 这是获取用户权限的唯一正确方式
 */
export function resolveVisibility(user: PublicUser | null): ResolvedVisibility | null {
  if (!user) {
    return null;
  }
  
  return {
    userId: user.id,
    role: user.role,
    allowedPatterns: user.permissions.paths,
    isGlobalAccess: user.role === 'admin' || user.permissions.paths.includes('**'),
    canCreateProposal: user.permissions.can_create_proposal,
    canExecuteProposal: user.permissions.can_execute_proposal,
  };
}

/**
 * 检查文档访问权限
 * 
 * 这是检查路径权限的唯一正确方式
 */
export function checkDocumentAccess(
  user: PublicUser | null,
  path: string
): AccessResult {
  // 未认证用户
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }
  
  // Admin 全局访问
  if (user.role === 'admin') {
    return {
      allowed: true,
      matchedPattern: '** (admin)',
    };
  }
  
  // 检查路径模式
  for (const pattern of user.permissions.paths) {
    if (minimatch(path, pattern, { dot: true })) {
      return {
        allowed: true,
        matchedPattern: pattern,
      };
    }
  }
  
  return {
    allowed: false,
    reason: `Path '${path}' is not in your allowed paths`,
  };
}

/**
 * 检查 Proposal 创建权限
 */
export function checkProposalCreateAccess(
  user: PublicUser | null,
  targetPath: string
): AccessResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }
  
  // 首先检查文档访问权限
  const pathAccess = checkDocumentAccess(user, targetPath);
  if (!pathAccess.allowed) {
    return pathAccess;
  }
  
  // 然后检查 Proposal 创建权限
  if (!user.permissions.can_create_proposal) {
    return {
      allowed: false,
      reason: 'You do not have permission to create proposals',
    };
  }
  
  return {
    allowed: true,
    matchedPattern: pathAccess.matchedPattern,
  };
}

/**
 * 检查 Proposal 执行权限
 */
export function checkProposalExecuteAccess(
  user: PublicUser | null,
  targetPath: string
): AccessResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Authentication required',
    };
  }
  
  // 首先检查文档访问权限
  const pathAccess = checkDocumentAccess(user, targetPath);
  if (!pathAccess.allowed) {
    return pathAccess;
  }
  
  // 然后检查 Proposal 执行权限
  if (!user.permissions.can_execute_proposal) {
    return {
      allowed: false,
      reason: 'You do not have permission to execute proposals',
    };
  }
  
  return {
    allowed: true,
    matchedPattern: pathAccess.matchedPattern,
  };
}

/**
 * 过滤路径列表，只返回用户可见的路径
 */
export function filterVisiblePaths(
  user: PublicUser | null,
  paths: string[]
): string[] {
  if (!user) {
    return [];
  }
  
  // Admin 可以看到所有
  if (user.role === 'admin') {
    return paths;
  }
  
  return paths.filter(path => {
    const access = checkDocumentAccess(user, path);
    return access.allowed;
  });
}

/**
 * 批量检查路径访问权限
 */
export function checkBatchAccess(
  user: PublicUser | null,
  paths: string[]
): Map<string, AccessResult> {
  const results = new Map<string, AccessResult>();
  
  for (const path of paths) {
    results.set(path, checkDocumentAccess(user, path));
  }
  
  return results;
}

