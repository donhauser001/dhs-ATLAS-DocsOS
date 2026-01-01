/**
 * Profile API - 用户档案 API
 * 
 * Phase 3.1: Principal + Profile 用户体系
 * 
 * 端点：
 * - GET /api/profiles - 获取档案列表（可按 type 筛选）
 * - GET /api/profiles/:id - 获取档案详情
 * - GET /api/profiles/by-client/:clientId - 获取客户的所有联系人档案
 * - GET /api/profiles/by-type/:type - 按类型获取档案列表
 */

import { Router, Request, Response } from 'express';
import { optionalAuth } from '../middleware/permission.js';
import {
  getAllProfiles,
  getProfileById,
  getContactsByClient,
  getPrincipalById,
} from '../services/principal-indexer.js';

const router = Router();

/**
 * GET /api/profiles
 * 获取档案列表（可按 type 筛选）
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    
    const profiles = getAllProfiles(type as string | undefined);
    
    res.json({
      success: true,
      data: {
        profiles,
        count: profiles.length,
        filter: type ? { type } : null,
      },
    });
  } catch (error) {
    console.error('[API] GET /profiles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profiles',
    });
  }
});

/**
 * GET /api/profiles/by-type/:type
 * 按类型获取档案列表
 */
router.get('/by-type/:type', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const profiles = getAllProfiles(type);
    
    res.json({
      success: true,
      data: {
        profiles,
        count: profiles.length,
        profile_type: type,
      },
    });
  } catch (error) {
    console.error('[API] GET /profiles/by-type/:type error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profiles by type',
    });
  }
});

/**
 * GET /api/profiles/by-client/:clientId
 * 获取客户的所有联系人档案
 */
router.get('/by-client/:clientId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    
    const profiles = getContactsByClient(clientId);
    
    // 同时获取每个 profile 对应的 principal 信息
    const profilesWithPrincipal = profiles.map(profile => {
      const principal = getPrincipalById(profile.principal_id);
      return {
        ...profile,
        principal: principal ? {
          id: principal.id,
          display_name: principal.display_name,
          emails: principal.emails,
          phones: principal.phones,
        } : null,
      };
    });
    
    res.json({
      success: true,
      data: {
        client_id: clientId,
        contacts: profilesWithPrincipal,
        count: profilesWithPrincipal.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /profiles/by-client/:clientId error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client contacts',
    });
  }
});

/**
 * GET /api/profiles/:id
 * 获取档案详情
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const profile = getProfileById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Profile '${id}' not found`,
      });
    }
    
    // 获取关联的 principal
    const principal = getPrincipalById(profile.principal_id);
    
    res.json({
      success: true,
      data: {
        profile,
        principal: principal ? {
          id: principal.id,
          display_name: principal.display_name,
          emails: principal.emails,
          phones: principal.phones,
          document: principal.document,
          anchor: principal.anchor,
        } : null,
      },
    });
  } catch (error) {
    console.error('[API] GET /profiles/:id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

/**
 * GET /api/profiles/:id/context
 * 获取档案完整上下文（含 principal 和关联信息）
 * AI 友好接口
 */
router.get('/:id/context', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const profile = getProfileById(id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: `Profile '${id}' not found`,
      });
    }
    
    // 获取关联的 principal
    const principal = getPrincipalById(profile.principal_id);
    
    // 构建上下文
    const context: Record<string, unknown> = {
      profile,
      principal,
    };
    
    // 如果是 client_contact，添加客户信息
    if (profile.profile_type === 'client_contact' && profile.client_id) {
      context.client_id = profile.client_id;
      // 可以在这里添加更多客户信息（如果需要）
    }
    
    res.json({
      success: true,
      data: context,
    });
  } catch (error) {
    console.error('[API] GET /profiles/:id/context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile context',
    });
  }
});

export default router;

