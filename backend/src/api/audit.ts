/**
 * Audit Log API - 审计日志 API
 * 
 * Phase 4.2: 审计日志查询接口
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../middleware/permission.js';
import {
  getAuditLogs,
  getUserAuditLogs,
  getAuditStats,
  type AuditEventType,
} from '../services/audit-log.js';

const router = Router();

/**
 * GET /api/audit-logs
 * 获取审计日志列表
 * Query:
 *   - startDate: 开始日期 (ISO 格式)
 *   - endDate: 结束日期 (ISO 格式)
 *   - userId: 用户 ID (可选)
 *   - eventType: 事件类型 (可选)
 *   - limit: 数量限制 (默认 50)
 *   - offset: 偏移量 (默认 0)
 * 
 * 需要管理员权限
 */
router.get('/', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      eventType,
      limit = '50',
      offset = '0',
    } = req.query;
    
    const result = await getAuditLogs({
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      userId: userId as string | undefined,
      eventType: eventType as AuditEventType | undefined,
      limit: parseInt(limit as string) || 50,
      offset: parseInt(offset as string) || 0,
    });
    
    res.json({
      success: true,
      logs: result.logs,
      total: result.total,
    });
  } catch (error) {
    console.error('[AuditAPI] Failed to get audit logs:', error);
    res.status(500).json({
      success: false,
      error: '获取审计日志失败',
    });
  }
});

/**
 * GET /api/audit-logs/stats
 * 获取审计日志统计
 * Query:
 *   - days: 统计天数 (默认 7)
 * 
 * 需要管理员权限
 */
router.get('/stats', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { days = '7' } = req.query;
    
    const stats = await getAuditStats(parseInt(days as string) || 7);
    
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[AuditAPI] Failed to get audit stats:', error);
    res.status(500).json({
      success: false,
      error: '获取统计失败',
    });
  }
});

/**
 * GET /api/audit-logs/user/:userId
 * 获取指定用户的审计日志
 * 
 * 需要管理员权限或本人
 */
router.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUser = req.user;
  
  // 检查权限：管理员或本人
  if (currentUser?.role !== 'admin' && currentUser?.id !== userId) {
    res.status(403).json({
      success: false,
      error: '无权查看其他用户的日志',
    });
    return;
  }
  
  try {
    const { limit = '50' } = req.query;
    
    const logs = await getUserAuditLogs(userId, parseInt(limit as string) || 50);
    
    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('[AuditAPI] Failed to get user audit logs:', error);
    res.status(500).json({
      success: false,
      error: '获取用户日志失败',
    });
  }
});

/**
 * GET /api/audit-logs/my
 * 获取当前用户的审计日志
 */
router.get('/my', requireAuth, async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    res.status(401).json({
      success: false,
      error: '未登录',
    });
    return;
  }
  
  try {
    const { limit = '50' } = req.query;
    
    const logs = await getUserAuditLogs(userId, parseInt(limit as string) || 50);
    
    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error('[AuditAPI] Failed to get my audit logs:', error);
    res.status(500).json({
      success: false,
      error: '获取日志失败',
    });
  }
});

export default router;

