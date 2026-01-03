/**
 * 文档类型 API
 * 
 * 提供文档类型配置的管理接口
 */

import { Router, Request, Response } from 'express';
import {
    getDocTypeConfig,
    getDocType,
    getAllDocTypes,
    getDocTypesByCategory,
    addDocType,
    updateDocType,
    deleteDocType,
    type DocTypeCategory,
} from '../services/doc-type-config.js';

const router = Router();

// ============================================================
// 查询接口
// ============================================================

/**
 * GET /api/doc-types
 * 获取完整配置
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const config = getDocTypeConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('[DocTypes API] Failed to get config:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get config'
        });
    }
});

/**
 * GET /api/doc-types/all
 * 获取所有类型（扁平列表）
 */
router.get('/all', (_req: Request, res: Response) => {
    try {
        const types = getAllDocTypes();
        res.json({ success: true, data: types });
    } catch (error) {
        console.error('[DocTypes API] Failed to get all types:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get types'
        });
    }
});

/**
 * GET /api/doc-types/category/:category
 * 按分类获取类型
 */
router.get('/category/:category', (req: Request, res: Response) => {
    try {
        const category = req.params.category as DocTypeCategory;
        if (!['system', 'business', 'content'].includes(category)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid category. Must be system, business, or content.'
            });
        }
        const types = getDocTypesByCategory(category);
        res.json({ success: true, data: types });
    } catch (error) {
        console.error('[DocTypes API] Failed to get types by category:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get types'
        });
    }
});

/**
 * GET /api/doc-types/type/:id
 * 获取单个类型
 */
router.get('/type/:id', (req: Request, res: Response) => {
    try {
        const type = getDocType(req.params.id);
        if (!type) {
            return res.status(404).json({
                success: false,
                error: `Document type ${req.params.id} not found`
            });
        }
        res.json({ success: true, data: type });
    } catch (error) {
        console.error('[DocTypes API] Failed to get type:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get type'
        });
    }
});

// ============================================================
// 管理接口
// ============================================================

/**
 * POST /api/doc-types/types
 * 添加新类型
 */
router.post('/types', (req: Request, res: Response) => {
    try {
        const { id, label, description, icon, category, defaultFunction, defaultDisplay } = req.body;

        if (!id || !label || !category) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: id, label, category'
            });
        }

        const newType = addDocType({
            id,
            label,
            description,
            icon,
            category,
            defaultFunction,
            defaultDisplay,
        });

        res.json({ success: true, data: newType });
    } catch (error) {
        console.error('[DocTypes API] Failed to add type:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add type'
        });
    }
});

/**
 * PUT /api/doc-types/types/:id
 * 更新类型
 */
router.put('/types/:id', (req: Request, res: Response) => {
    try {
        const { label, description, icon, defaultFunction, defaultDisplay } = req.body;

        const updated = updateDocType(req.params.id, {
            label,
            description,
            icon,
            defaultFunction,
            defaultDisplay,
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('[DocTypes API] Failed to update type:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update type'
        });
    }
});

/**
 * DELETE /api/doc-types/types/:id
 * 删除类型
 */
router.delete('/types/:id', (req: Request, res: Response) => {
    try {
        deleteDocType(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('[DocTypes API] Failed to delete type:', error);
        res.status(400).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete type'
        });
    }
});

export default router;

