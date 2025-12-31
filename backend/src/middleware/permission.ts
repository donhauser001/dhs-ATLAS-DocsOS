/**
 * Permission Middleware - 权限中间件
 * 
 * Phase 1: 实现路径权限检查
 */

import { Request, Response, NextFunction } from 'express';
import {
  getUserById,
  toPublicUser,
  checkPathPermission,
  canCreateProposal,
  canExecuteProposal,
  type PublicUser,
} from '../services/auth-service.js';

// 扩展 Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}

/**
 * 认证中间件 - 检查用户是否已登录
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session?.userId;
  
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  const user = getUserById(userId);
  
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }
  
  req.user = toPublicUser(user);
  next();
}

/**
 * 可选认证中间件 - 如果有 session 则加载用户
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session?.userId;
  
  if (userId) {
    const user = getUserById(userId);
    if (user) {
      req.user = toPublicUser(user);
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

