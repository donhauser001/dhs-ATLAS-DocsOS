/**
 * Labels API - 系统级标签管理接口
 * 
 * 核心原则：
 * - 原始名（key）：写入文档的字段名
 * - 映射名（label）：界面显示的友好名称
 * 
 * 端点：
 * GET    /api/labels              - 获取完整标签配置
 * GET    /api/labels/resolve/:key - 解析单个标签
 * POST   /api/labels/resolve      - 批量解析标签
 * 
 * 分类管理：
 * POST   /api/labels/categories           - 添加分类
 * PUT    /api/labels/categories/:id       - 更新分类
 * DELETE /api/labels/categories/:id       - 删除分类
 * 
 * 标签管理：
 * POST   /api/labels/items/:categoryId    - 添加标签
 * PUT    /api/labels/items/:key           - 更新标签
 * DELETE /api/labels/items/:key           - 删除标签
 */

import { Router, Request, Response } from 'express';
import {
  getLabelConfig,
  getLabel,
  getLabelText,
  getLabelIcon,
  getLabelColor,
  isHiddenField,
  clearLabelCache,
  addCategory,
  updateCategory,
  deleteCategory,
  addLabel,
  updateLabel,
  deleteLabel,
  type LabelItem,
  type LabelCategory,
} from '../services/label-config.js';

export const router = Router();

// ============================================================
// 查询 API
// ============================================================

/**
 * GET /api/labels
 * 获取完整标签配置
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const config = getLabelConfig();
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('[Labels API] Failed to get config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get label config',
    });
  }
});

/**
 * GET /api/labels/resolve/:key
 * 解析单个标签
 */
router.get('/resolve/:key', (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const hidden = isHiddenField(key);
    
    if (hidden) {
      res.json({
        success: true,
        data: {
          key,
          label: key,
          hidden: true,
        },
      });
      return;
    }
    
    const item = getLabel(key);
    res.json({
      success: true,
      data: {
        key,
        label: item?.label || key,
        icon: item?.icon,
        color: item?.color,
        hidden: false,
      },
    });
  } catch (error) {
    console.error('[Labels API] Failed to resolve label:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve label',
    });
  }
});

/**
 * POST /api/labels/resolve
 * 批量解析标签
 */
router.post('/resolve', (req: Request, res: Response) => {
  try {
    const { keys } = req.body as { keys: string[] };
    
    if (!keys || !Array.isArray(keys)) {
      res.status(400).json({
        success: false,
        error: 'Missing keys array',
      });
      return;
    }
    
    const results: Record<string, {
      key: string;
      label: string;
      icon?: string;
      color?: string;
      hidden: boolean;
    }> = {};
    
    for (const key of keys) {
      const hidden = isHiddenField(key);
      if (hidden) {
        results[key] = { key, label: key, hidden: true };
      } else {
        const item = getLabel(key);
        results[key] = {
          key,
          label: item?.label || key,
          icon: item?.icon,
          color: item?.color,
          hidden: false,
        };
      }
    }
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('[Labels API] Failed to resolve labels:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve labels',
    });
  }
});

/**
 * POST /api/labels/clear-cache
 * 清除缓存
 */
router.post('/clear-cache', (_req: Request, res: Response) => {
  try {
    clearLabelCache();
    res.json({
      success: true,
      message: 'Cache cleared',
    });
  } catch (error) {
    console.error('[Labels API] Failed to clear cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
    });
  }
});

// ============================================================
// 分类管理 API
// ============================================================

/**
 * POST /api/labels/categories
 * 添加分类
 */
router.post('/categories', (req: Request, res: Response) => {
  try {
    const { id, name, description } = req.body as { id: string; name: string; description?: string };
    
    if (!id || !name) {
      res.status(400).json({
        success: false,
        error: 'Missing id or name',
      });
      return;
    }
    
    const category = addCategory({ id, name, description, items: [] });
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('[Labels API] Failed to add category:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add category',
    });
  }
});

/**
 * PUT /api/labels/categories/:id
 * 更新分类
 */
router.put('/categories/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { name, description } = req.body as { name?: string; description?: string };
    
    const category = updateCategory(id, { name, description });
    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('[Labels API] Failed to update category:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update category',
    });
  }
});

/**
 * DELETE /api/labels/categories/:id
 * 删除分类
 */
router.delete('/categories/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    deleteCategory(id);
    res.json({
      success: true,
      message: `Category ${id} deleted`,
    });
  } catch (error) {
    console.error('[Labels API] Failed to delete category:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    });
  }
});

// ============================================================
// 标签管理 API
// ============================================================

/**
 * POST /api/labels/items/:categoryId
 * 添加标签到分类
 */
router.post('/items/:categoryId', (req: Request, res: Response) => {
  try {
    const categoryId = req.params.categoryId;
    const { key, label, icon, color, description } = req.body as LabelItem;
    
    if (!key || !label) {
      res.status(400).json({
        success: false,
        error: 'Missing key or label',
      });
      return;
    }
    
    const item = addLabel(categoryId, { key, label, icon, color, description });
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('[Labels API] Failed to add label:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add label',
    });
  }
});

/**
 * PUT /api/labels/items/:key
 * 更新标签
 */
router.put('/items/:key', (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { label, icon, color, description } = req.body as Partial<LabelItem>;
    
    const item = updateLabel(key, { label, icon, color, description });
    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('[Labels API] Failed to update label:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update label',
    });
  }
});

/**
 * DELETE /api/labels/items/:key
 * 删除标签
 */
router.delete('/items/:key', (req: Request, res: Response) => {
  try {
    const key = decodeURIComponent(req.params.key);
    deleteLabel(key);
    res.json({
      success: true,
      message: `Label ${key} deleted`,
    });
  } catch (error) {
    console.error('[Labels API] Failed to delete label:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete label',
    });
  }
});

export default router;
