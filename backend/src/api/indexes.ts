/**
 * Indexes API 路由
 * 
 * Phase 4.2: 提供索引管理接口
 * - 认证索引重建
 * - 索引统计查询
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/permission.js';
import {
  rebuildAuthUsersIndex,
  getAuthUsersIndex,
  getAuthIndexStats,
  getAllUsers,
  updateUserStatus,
  type AccountStatus,
} from '../services/auth-credential-indexer.js';
import { rebuildPersonIndex, getPersonIndexStats } from '../services/person-indexer.js';

const router = Router();

// ============================================================
// 认证索引 API
// ============================================================

/**
 * POST /api/indexes/auth/rebuild
 * 重建用户认证索引
 * 需要管理员权限
 */
router.post('/auth/rebuild', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    console.log('[IndexesAPI] Rebuilding auth users index...');
    const result = await rebuildAuthUsersIndex();
    
    res.json({
      success: true,
      message: '认证索引重建完成',
      stats: result.stats,
    });
  } catch (error) {
    console.error('[IndexesAPI] Failed to rebuild auth index:', error);
    res.status(500).json({
      error: '索引重建失败',
      details: String(error),
    });
  }
});

/**
 * GET /api/indexes/auth
 * 获取认证索引（仅返回元数据和统计，不返回用户数据）
 * 需要管理员权限
 */
router.get('/auth', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const index = await getAuthUsersIndex();
    
    res.json({
      _meta: index._meta,
      credential_count: Object.keys(index.credentials).length,
      user_count: Object.keys(index.users).length,
    });
  } catch (error) {
    res.status(500).json({
      error: '获取认证索引失败',
      details: String(error),
    });
  }
});

/**
 * GET /api/indexes/auth/stats
 * 获取认证索引统计
 */
router.get('/auth/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    const stats = await getAuthIndexStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: '获取统计失败',
      details: String(error),
    });
  }
});

/**
 * GET /api/indexes/auth/users
 * 获取用户列表（带分页和筛选）
 * 需要管理员权限
 */
router.get('/auth/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role, status, search, page = '1', limit = '20' } = req.query;
    
    let users = await getAllUsers();
    
    // 筛选角色
    if (role && typeof role === 'string') {
      users = users.filter(u => u.role === role);
    }
    
    // 筛选状态
    if (status && typeof status === 'string') {
      users = users.filter(u => u.status === status);
    }
    
    // 搜索
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      users = users.filter(u => 
        u.username.toLowerCase().includes(searchLower) ||
        (u.email && u.email.toLowerCase().includes(searchLower)) ||
        (u.phone && u.phone.includes(search))
      );
    }
    
    // 分页
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const total = users.length;
    const start = (pageNum - 1) * limitNum;
    const paginatedUsers = users.slice(start, start + limitNum);
    
    res.json({
      users: paginatedUsers,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('[IndexesAPI] Failed to get users:', error);
    res.status(500).json({
      error: '获取用户列表失败',
      details: String(error),
    });
  }
});

/**
 * PUT /api/indexes/auth/users/:userId/status
 * 更新用户状态
 * 需要管理员权限
 */
router.put('/auth/users/:userId/status', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body as { status: AccountStatus };
    
    if (!status || !['active', 'pending', 'disabled', 'locked', 'expired'].includes(status)) {
      res.status(400).json({ error: '无效的状态值' });
      return;
    }
    
    await updateUserStatus(userId, status);
    
    res.json({ success: true, message: '状态更新成功' });
  } catch (error) {
    console.error('[IndexesAPI] Failed to update user status:', error);
    res.status(500).json({
      error: '更新用户状态失败',
      details: String(error),
    });
  }
});

// ============================================================
// Person 索引 API
// ============================================================

/**
 * POST /api/indexes/person/rebuild
 * 重建 Person 索引
 * 需要管理员权限
 */
router.post('/person/rebuild', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    console.log('[IndexesAPI] Rebuilding person index...');
    const result = await rebuildPersonIndex();
    
    res.json({
      success: true,
      message: 'Person 索引重建完成',
      stats: result.stats,
    });
  } catch (error) {
    console.error('[IndexesAPI] Failed to rebuild person index:', error);
    res.status(500).json({
      error: '索引重建失败',
      details: String(error),
    });
  }
});

/**
 * GET /api/indexes/person/stats
 * 获取 Person 索引统计
 */
router.get('/person/stats', requireAuth, async (_req: Request, res: Response) => {
  try {
    const stats = getPersonIndexStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: '获取统计失败',
      details: String(error),
    });
  }
});

// ============================================================
// 全局索引 API
// ============================================================

/**
 * POST /api/indexes/rebuild-all
 * 重建所有索引
 * 需要管理员权限
 */
router.post('/rebuild-all', requireAuth, requireAdmin, async (_req: Request, res: Response) => {
  try {
    console.log('[IndexesAPI] Rebuilding all indexes...');
    
    const results: Record<string, unknown> = {};
    
    // 重建认证索引
    const authResult = await rebuildAuthUsersIndex();
    results.auth = {
      success: true,
      stats: authResult.stats,
    };
    
    // 重建 Person 索引
    const personResult = await rebuildPersonIndex();
    results.person = {
      success: true,
      stats: personResult.stats,
    };
    
    res.json({
      success: true,
      message: '所有索引重建完成',
      results,
    });
  } catch (error) {
    console.error('[IndexesAPI] Failed to rebuild all indexes:', error);
    res.status(500).json({
      error: '索引重建失败',
      details: String(error),
    });
  }
});

export default router;

