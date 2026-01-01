/**
 * Principal API - 用户主体 API
 * 
 * Phase 3.1: Principal + Profile 用户体系
 * 
 * 端点：
 * - GET /api/principals - 获取所有主体列表
 * - GET /api/principals/:id - 获取主体详情
 * - GET /api/principals/:id/profiles - 获取主体的所有档案
 * - GET /api/principals/search - 搜索主体
 */

import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/permission.js';
import {
  getAllPrincipals,
  getPrincipalById,
  getProfilesByPrincipal,
  searchPrincipals,
  rebuildPrincipalIndex,
  getPrincipalIndex,
} from '../services/principal-indexer.js';

const router = Router();

/**
 * GET /api/principals
 * 获取所有主体列表
 */
router.get('/', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const principals = getAllPrincipals();
    
    res.json({
      success: true,
      data: {
        principals,
        count: principals.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /principals error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch principals',
    });
  }
});

/**
 * GET /api/principals/search
 * 搜索主体（支持 email/phone/name）
 */
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required',
      });
    }
    
    const results = searchPrincipals(q);
    
    res.json({
      success: true,
      data: {
        results,
        count: results.length,
        query: q,
      },
    });
  } catch (error) {
    console.error('[API] GET /principals/search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search principals',
    });
  }
});

/**
 * POST /api/principals/rebuild-index
 * 重建索引
 */
router.post('/rebuild-index', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const result = await rebuildPrincipalIndex();
    
    res.json({
      success: true,
      data: {
        principals_count: result.principals.count,
        profiles_count: result.profiles.count,
        updated_at: result.principals.updated_at,
      },
    });
  } catch (error) {
    console.error('[API] POST /principals/rebuild-index error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild index',
    });
  }
});

/**
 * GET /api/principals/:id
 * 获取主体详情（含 profiles 摘要）
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const principal = getPrincipalById(id);
    
    if (!principal) {
      return res.status(404).json({
        success: false,
        error: `Principal '${id}' not found`,
      });
    }
    
    // 获取关联的 profiles
    const profiles = getProfilesByPrincipal(id);
    
    res.json({
      success: true,
      data: {
        principal,
        profiles,
      },
    });
  } catch (error) {
    console.error('[API] GET /principals/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch principal',
    });
  }
});

/**
 * GET /api/principals/:id/profiles
 * 获取主体的所有档案
 */
router.get('/:id/profiles', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const principal = getPrincipalById(id);
    
    if (!principal) {
      return res.status(404).json({
        success: false,
        error: `Principal '${id}' not found`,
      });
    }
    
    const profiles = getProfilesByPrincipal(id);
    
    res.json({
      success: true,
      data: {
        principal_id: id,
        profiles,
        count: profiles.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /principals/:id/profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profiles',
    });
  }
});

/**
 * GET /api/principals/:id/context
 * 获取主体完整上下文（含所有关联信息）
 * AI 友好接口
 */
router.get('/:id/context', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const principal = getPrincipalById(id);
    
    if (!principal) {
      return res.status(404).json({
        success: false,
        error: `Principal '${id}' not found`,
      });
    }
    
    const profiles = getProfilesByPrincipal(id);
    
    // 按 profile_type 分组
    const profilesByType: Record<string, typeof profiles> = {};
    for (const profile of profiles) {
      if (!profilesByType[profile.profile_type]) {
        profilesByType[profile.profile_type] = [];
      }
      profilesByType[profile.profile_type].push(profile);
    }
    
    res.json({
      success: true,
      data: {
        principal,
        profiles,
        profiles_by_type: profilesByType,
        summary: {
          profile_count: profiles.length,
          profile_types: Object.keys(profilesByType),
          has_employee: profilesByType['employee']?.length > 0,
          has_client_contact: profilesByType['client_contact']?.length > 0,
        },
      },
    });
  } catch (error) {
    console.error('[API] GET /principals/:id/context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch principal context',
    });
  }
});

export default router;

