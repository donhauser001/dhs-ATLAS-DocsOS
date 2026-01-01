/**
 * Token API - Design Tokens 接口
 * 
 * Phase 2.5: 语言与显现校正
 * 
 * 提供：
 * - Token 定义查询
 * - Token 解析
 * - 缓存重建
 */

import { Router, type Request, type Response } from 'express';
import {
  loadTokens,
  rebuildTokenCache,
  getTokenDefinition,
  resolveToken,
  resolveTokenVariant,
  getAllTokenGroups,
  getTokensByGroup,
  searchTokens,
  getStatusDisplay,
  getTypeDisplay,
} from '../services/token-resolver.js';

const router = Router();

// ============================================================
// Token 查询接口
// ============================================================

/**
 * GET /api/tokens
 * 
 * 获取所有 Token（完整缓存）
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cache = await loadTokens();
    res.json({
      success: true,
      data: cache,
    });
  } catch (error) {
    console.error('[API] GET /tokens error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load tokens',
    });
  }
});

/**
 * GET /api/tokens/groups
 * 
 * 获取所有 Token 组
 */
router.get('/groups', async (_req: Request, res: Response) => {
  try {
    const groups = await getAllTokenGroups();
    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error('[API] GET /tokens/groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load token groups',
    });
  }
});

/**
 * GET /api/tokens/group/:groupId
 * 
 * 获取指定组的所有 Token
 */
router.get('/group/:groupId', async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const tokens = await getTokensByGroup(groupId);
    
    if (!tokens) {
      return res.status(404).json({
        success: false,
        error: `Token group '${groupId}' not found`,
      });
    }
    
    res.json({
      success: true,
      data: tokens,
    });
  } catch (error) {
    console.error('[API] GET /tokens/group/:groupId error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load token group',
    });
  }
});

/**
 * GET /api/tokens/resolve/:path
 * 
 * 解析 Token 路径为值
 * 
 * 可选 query: ?variant=bg
 */
router.get('/resolve/:path(*)', async (req: Request, res: Response) => {
  try {
    const { path } = req.params;
    const variant = req.query.variant as string | undefined;
    
    let value: string | null;
    if (variant) {
      value = await resolveTokenVariant(path, variant);
    } else {
      value = await resolveToken(path);
    }
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        error: `Token '${path}' not found`,
      });
    }
    
    // 同时返回完整定义
    const definition = await getTokenDefinition(path);
    
    res.json({
      success: true,
      data: {
        path,
        value,
        definition,
      },
    });
  } catch (error) {
    console.error('[API] GET /tokens/resolve/:path error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve token',
    });
  }
});

/**
 * GET /api/tokens/search
 * 
 * 搜索 Token
 * 
 * Query: ?q=brand
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }
    
    const results = await searchTokens(query);
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[API] GET /tokens/search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tokens',
    });
  }
});

// ============================================================
// 快捷解析接口
// ============================================================

/**
 * GET /api/tokens/status/:status
 * 
 * 获取状态的显现配置
 */
router.get('/status/:status', async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const display = await getStatusDisplay(status);
    
    res.json({
      success: true,
      data: {
        status,
        display,
      },
    });
  } catch (error) {
    console.error('[API] GET /tokens/status/:status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status display',
    });
  }
});

/**
 * GET /api/tokens/type/:type
 * 
 * 获取类型的显现配置
 */
router.get('/type/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const display = await getTypeDisplay(type);
    
    res.json({
      success: true,
      data: {
        type,
        display,
      },
    });
  } catch (error) {
    console.error('[API] GET /tokens/type/:type error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get type display',
    });
  }
});

// ============================================================
// 缓存管理接口
// ============================================================

/**
 * POST /api/tokens/rebuild
 * 
 * 重建 Token 缓存
 */
router.post('/rebuild', async (_req: Request, res: Response) => {
  try {
    const cache = await rebuildTokenCache();
    
    res.json({
      success: true,
      message: 'Token cache rebuilt',
      data: {
        groups: Object.keys(cache.groups).length,
        tokens: Object.keys(cache.index).length,
        updated_at: cache.updated_at,
      },
    });
  } catch (error) {
    console.error('[API] POST /tokens/rebuild error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild token cache',
    });
  }
});

export default router;

