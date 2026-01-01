/**
 * Navigation API - 导航接口
 * 
 * Phase 3.3: 动态导航系统
 * 
 * 端点：
 * GET /api/navigation/sidebar - 获取侧边栏导航
 */

import { Router, Request, Response } from 'express';
import { getSidebarNavigation } from '../services/function-registry.js';

export const router = Router();

/**
 * GET /api/navigation/sidebar
 * 获取侧边栏导航
 */
router.get('/sidebar', async (_req: Request, res: Response) => {
    try {
        const navItems = await getSidebarNavigation();

        res.json({
            success: true,
            data: {
                items: navItems,
                count: navItems.length,
            },
        });
    } catch (error) {
        console.error('[Navigation API] Failed to get sidebar:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get sidebar navigation',
        });
    }
});

export default router;

