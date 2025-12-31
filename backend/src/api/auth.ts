/**
 * Auth API 路由
 * 
 * Phase 1: 提供用户认证接口
 */

import { Router, Request, Response } from 'express';
import {
  getUserByUsername,
  getUserById,
  verifyPassword,
  toPublicUser,
  type PublicUser,
} from '../services/auth-service.js';

const router = Router();

// 扩展 Session 类型
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: 'Missing username or password' });
    return;
  }
  
  const user = getUserByUsername(username);
  
  if (!user) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }
  
  if (!verifyPassword(user, password)) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }
  
  // 设置 session
  req.session.userId = user.id;
  
  res.json({
    success: true,
    user: toPublicUser(user),
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
router.get('/me', (req: Request, res: Response) => {
  const userId = req.session.userId;
  
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  
  const user = getUserById(userId);
  
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: 'User not found' });
    return;
  }
  
  res.json({ user: toPublicUser(user) });
});

export default router;
