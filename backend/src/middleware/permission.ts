/**
 * Permission Middleware - 权限中间件
 * 
 * Phase 4.2: 基于新的认证索引系统
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  getUserById,
  toPublicUser,
  checkPathPermission,
  canCreateProposal,
  canExecuteProposal,
  type PublicUser,
} from '../services/auth-service.js';

/**
 * 异步中间件包装器
 * 确保 Express 正确处理异步中间件的错误和返回值
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

// 扩展 Session 类型
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    authSource?: 'index' | 'legacy';
  }
}

/**
 * 认证中间件 - 检查用户是否已登录
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // 从新索引系统获取用户
  const user = await getUserById(userId);

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  req.user = toPublicUser(user, 'index');
  next();
}

/**
 * 可选认证中间件 - 如果有 session 则加载用户
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;

  if (userId) {
    const user = await getUserById(userId);
    if (user) {
      req.user = toPublicUser(user, 'index');
    }
  }

  next();
}

/**
 * 路径权限中间件 - 检查用户是否有权访问指定路径
 */
export function requirePathAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // 从 query 或 body 获取路径
  const path = (req.query.path as string) || (req.body.path as string) || (req.body.target_file as string);

  if (!path) {
    next();
    return;
  }

  if (!checkPathPermission(req.user, path)) {
    res.status(403).json({ error: 'Access denied', path });
    return;
  }

  next();
}

/**
 * Proposal 创建权限中间件
 */
export function requireProposalCreate(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!canCreateProposal(req.user)) {
    res.status(403).json({ error: 'You do not have permission to create proposals' });
    return;
  }

  next();
}

/**
 * Proposal 执行权限中间件
 */
export function requireProposalExecute(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!canExecuteProposal(req.user)) {
    res.status(403).json({ error: 'You do not have permission to execute proposals' });
    return;
  }

  next();
}

/**
 * 管理员权限中间件
 * Phase 4.2: 用于限制仅管理员可访问的功能
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return;
  }

  next();
}
