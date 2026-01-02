/**
 * Display Config API - 显示配置 API 端点
 * 
 * Phase 3.5: 渲染分区系统
 * 
 * 端点：
 * - GET /api/display-config - 获取显示配置
 * - GET /api/display-config/:entityType - 获取特定实体类型的配置
 */

import { Router, Request, Response } from 'express';
import {
  getDisplayConfig,
  getZoneConfigForType,
  categorizeFields,
  initDisplayConfig,
} from '../services/display-config.js';

const router = Router();

/**
 * GET /api/display-config
 * 
 * 获取完整的显示配置
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    // 确保配置文件存在
    initDisplayConfig();
    
    const config = getDisplayConfig();
    res.json(config);
  } catch (error) {
    console.error('[DisplayConfig] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/display-config/:entityType
 * 
 * 获取特定实体类型的分区配置
 */
router.get('/:entityType', (req: Request, res: Response) => {
  try {
    const { entityType } = req.params;
    const zoneConfig = getZoneConfigForType(entityType);
    
    res.json({
      entityType,
      zones: zoneConfig,
    });
  } catch (error) {
    console.error('[DisplayConfig] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/display-config/categorize
 * 
 * 对给定的字段进行分区分类
 */
router.post('/categorize', (req: Request, res: Response) => {
  try {
    const { machineData, frontmatter, entityType } = req.body;
    
    if (!machineData) {
      return res.status(400).json({
        error: 'Missing required field: machineData',
      });
    }
    
    const categorized = categorizeFields(
      machineData,
      frontmatter || {},
      entityType
    );
    
    res.json(categorized);
  } catch (error) {
    console.error('[DisplayConfig] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

