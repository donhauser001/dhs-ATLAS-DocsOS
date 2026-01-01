/**
 * Auth API 路由
 * 
 * Phase 1: 提供用户认证接口
 * Phase 3.3: 支持 email 登录（基于 Principal 文档）
 */

import { Router, Request, Response } from 'express';
import {
  getUserByEmail,
  getUserByUsername,
  getUserById,
  getUserByIdSync,
  verifyPassword,
  toPublicUser,
  type PublicUser,
} from '../services/auth-service.js';

const router = Router();

// 扩展 Session 类型
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    /** 认证来源：principal 或 legacy */
    authSource?: 'principal' | 'legacy';
  }
}

/**
 * POST /api/auth/login
 * 用户登录
 * 
 * Phase 3.3: 支持两种登录方式
 * 1. email + password（新，从 Principal 文档认证）
 * 2. username + password（旧，从 users.json 认证，将废弃）
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!password) {
    res.status(400).json({ error: 'Missing password' });
    return;
  }

  if (!username && !email) {
    res.status(400).json({ error: 'Missing username or email' });
    return;
  }

  let user = null;
  let authSource: 'principal' | 'legacy' = 'legacy';

  // 优先使用 email 登录（新方式）
  if (email) {
    user = await getUserByEmail(email);
    if (user) {
      authSource = 'principal';
    }
  }

  // Fallback: 使用 username 登录（旧方式）
  if (!user && username) {
    // 先尝试把 username 当作 email 查找
    user = await getUserByEmail(username);
    if (user) {
      authSource = 'principal';
    } else {
      // 再从 users.json 查找
      user = getUserByUsername(username);
      authSource = 'legacy';
    }
  }

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!verifyPassword(user, password)) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // 设置 session
  req.session.userId = user.id;
  req.session.authSource = authSource;

  res.json({
    success: true,
    user: toPublicUser(user, authSource),
  });
});

/**
 * POST /api/auth/logout
 * 用户登出
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.json({ success: true });
  });
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', async (req: Request, res: Response) => {
  const userId = req.session.userId;
  const authSource = req.session.authSource || 'legacy';

  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  // 根据认证来源选择获取方式
  let user = null;

  if (authSource === 'principal') {
    user = await getUserById(userId);
  } else {
    user = getUserByIdSync(userId);
  }

  if (!user) {
    req.session.destroy(() => { });
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json({ user: toPublicUser(user, authSource) });
});

export default router;
