/**
 * 插件 API
 * 
 * Phase 4.1: 提供插件市场的数据接口
 */

import { Router, Request, Response } from 'express';
import {
    getAllPlugins,
    getAllTypePackages,
    getAllThemePackages,
    getAllExtensions,
    getTypePackagesByCategory,
    getPluginStats,
    getTypePackageBlockDefinitions,
    updateDataBlockDefinition,
    resetDataBlockDefinition,
} from '../services/plugins.js';

const router = Router();

// ============================================================
// 聚合查询接口
// ============================================================

/**
 * GET /api/plugins
 * 获取所有插件
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const plugins = getAllPlugins();
        res.json({ success: true, data: plugins });
    } catch (error) {
        console.error('[Plugins API] Failed to get plugins:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get plugins'
        });
    }
});

/**
 * GET /api/plugins/stats
 * 获取插件统计信息
 */
router.get('/stats', (_req: Request, res: Response) => {
    try {
        const stats = getPluginStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('[Plugins API] Failed to get stats:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get stats'
        });
    }
});

// ============================================================
// 类型包接口
// ============================================================

/**
 * GET /api/plugins/type-packages
 * 获取所有类型包
 */
router.get('/type-packages', (_req: Request, res: Response) => {
    try {
        const packages = getAllTypePackages();
        res.json({ success: true, data: packages });
    } catch (error) {
        console.error('[Plugins API] Failed to get type packages:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get type packages'
        });
    }
});

/**
 * GET /api/plugins/type-packages/by-category
 * 按分类获取类型包
 */
router.get('/type-packages/by-category', (_req: Request, res: Response) => {
    try {
        const categories = getTypePackagesByCategory();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('[Plugins API] Failed to get type packages by category:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get type packages by category'
        });
    }
});

// ============================================================
// 主题包接口
// ============================================================

/**
 * GET /api/plugins/theme-packages
 * 获取所有主题包
 */
router.get('/theme-packages', (_req: Request, res: Response) => {
    try {
        const packages = getAllThemePackages();
        res.json({ success: true, data: packages });
    } catch (error) {
        console.error('[Plugins API] Failed to get theme packages:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get theme packages'
        });
    }
});

// ============================================================
// 扩展插件接口
// ============================================================

/**
 * GET /api/plugins/extensions
 * 获取所有扩展插件
 */
router.get('/extensions', (_req: Request, res: Response) => {
    try {
        const plugins = getAllExtensions();
        res.json({ success: true, data: plugins });
    } catch (error) {
        console.error('[Plugins API] Failed to get extensions:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get extensions'
        });
    }
});

// ============================================================
// 数据块定义管理
// ============================================================

/**
 * GET /api/plugins/type-packages/:id/blocks
 * 获取类型包的数据块定义
 */
router.get('/type-packages/:id/blocks', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const blocks = getTypePackageBlockDefinitions(id);
        res.json({ success: true, data: blocks });
    } catch (error) {
        console.error('[Plugins API] Failed to get blocks:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get blocks'
        });
    }
});

/**
 * PUT /api/plugins/type-packages/:id/blocks/:blockId
 * 更新数据块定义（保存到 JSON）
 */
router.put('/type-packages/:id/blocks/:blockId', (req: Request, res: Response) => {
    try {
        const { id, blockId } = req.params;
        const updates = req.body;
        
        const success = updateDataBlockDefinition(id, blockId, updates);
        
        if (success) {
            res.json({ success: true, message: '数据块已更新' });
        } else {
            res.status(404).json({
                success: false,
                error: '数据块未找到或更新失败'
            });
        }
    } catch (error) {
        console.error('[Plugins API] Failed to update block:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update block'
        });
    }
});

/**
 * POST /api/plugins/type-packages/:id/blocks/:blockId/reset
 * 恢复数据块到初始状态（从 YAML 重新生成 JSON）
 */
router.post('/type-packages/:id/blocks/:blockId/reset', (req: Request, res: Response) => {
    try {
        const { id, blockId } = req.params;
        
        const success = resetDataBlockDefinition(id, blockId);
        
        if (success) {
            res.json({ success: true, message: '数据块已恢复初始化' });
        } else {
            res.status(404).json({
                success: false,
                error: '数据块未找到或恢复失败'
            });
        }
    } catch (error) {
        console.error('[Plugins API] Failed to reset block:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reset block'
        });
    }
});

/**
 * POST /api/plugins/type-packages/:id/reset-all
 * 恢复类型包所有数据块到初始状态
 */
router.post('/type-packages/:id/reset-all', (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // 获取所有数据块并重置
        const blocks = getTypePackageBlockDefinitions(id);
        let successCount = 0;
        
        for (const block of blocks) {
            if (resetDataBlockDefinition(id, block.id)) {
                successCount++;
            }
        }
        
        res.json({ 
            success: true, 
            message: `已恢复 ${successCount}/${blocks.length} 个数据块` 
        });
    } catch (error) {
        console.error('[Plugins API] Failed to reset all blocks:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to reset blocks'
        });
    }
});

export default router;

