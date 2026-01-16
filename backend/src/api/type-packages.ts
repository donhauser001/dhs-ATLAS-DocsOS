/**
 * 类型包 API
 * 
 * Phase 4.1: 提供类型包的查询接口
 */

import { Router, Request, Response } from 'express';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';
import { requireAuth } from '../middleware/permission.js';
import {
    getAllTypePackages,
    getTypePackage,
    getTypePackagesByCategory,
    getTypePackageManifest,
    getTypePackageBlocks,
    getTypePackageTemplate,
    renderTemplate,
    generateDocument,
    ensureTypePackageDirectories,
} from '../services/type-packages.js';

const router = Router();

// ============================================================
// 查询接口
// ============================================================

/**
 * GET /api/type-packages
 * 获取所有类型包
 */
router.get('/', (_req: Request, res: Response) => {
    try {
        const packages = getAllTypePackages();
        res.json({ success: true, data: packages });
    } catch (error) {
        console.error('[TypePackages API] Failed to get packages:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get packages'
        });
    }
});

/**
 * GET /api/type-packages/by-category
 * 按分类获取类型包
 */
router.get('/by-category', (_req: Request, res: Response) => {
    try {
        const categories = getTypePackagesByCategory();
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('[TypePackages API] Failed to get packages by category:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get packages'
        });
    }
});

/**
 * GET /api/type-packages/:id
 * 获取单个类型包详情
 */
router.get('/:id', (req: Request, res: Response) => {
    try {
        const pkg = getTypePackage(req.params.id);
        if (!pkg) {
            return res.status(404).json({
                success: false,
                error: `Type package ${req.params.id} not found`
            });
        }
        res.json({ success: true, data: pkg });
    } catch (error) {
        console.error('[TypePackages API] Failed to get package:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get package'
        });
    }
});

/**
 * GET /api/type-packages/:id/manifest
 * 获取类型包原始 manifest
 */
router.get('/:id/manifest', (req: Request, res: Response) => {
    try {
        const manifest = getTypePackageManifest(req.params.id);
        if (!manifest) {
            return res.status(404).json({
                success: false,
                error: `Type package ${req.params.id} not found`
            });
        }
        res.json({ success: true, data: manifest });
    } catch (error) {
        console.error('[TypePackages API] Failed to get manifest:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get manifest'
        });
    }
});

/**
 * GET /api/type-packages/:id/blocks
 * 获取类型包的数据块定义
 */
router.get('/:id/blocks', (req: Request, res: Response) => {
    try {
        const blocks = getTypePackageBlocks(req.params.id);
        res.json({ success: true, data: blocks });
    } catch (error) {
        console.error('[TypePackages API] Failed to get blocks:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get blocks'
        });
    }
});

// ============================================================
// 文档创建接口
// ============================================================

interface CreateDocumentRequest {
    typePackageId: string;
    title: string;
    path?: string;      // 目标目录，默认为 repository 根目录
    blocks?: string[];  // 选择的数据块
}

/**
 * POST /api/type-packages/create-document
 * 基于类型包创建文档
 * 
 * Phase 4.1: 使用动态生成，根据 JSON 配置生成数据块
 */
router.post('/create-document', requireAuth, (req: Request, res: Response) => {
    try {
        const { typePackageId, title, path: targetPath, blocks } = req.body as CreateDocumentRequest;

        // 校验参数
        if (!typePackageId) {
            return res.status(400).json({
                success: false,
                error: '缺少类型包 ID'
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                error: '缺少文档标题'
            });
        }

        // 检查类型包是否存在
        const pkg = getTypePackage(typePackageId);
        if (!pkg) {
            return res.status(404).json({
                success: false,
                error: `类型包 ${typePackageId} 不存在`
            });
        }

        // 确保类型包所需的目录存在（如 /客户 目录）
        const createdDirs = ensureTypePackageDirectories(typePackageId);
        if (createdDirs.length > 0) {
            console.log(`[TypePackages API] Created directories for ${typePackageId}:`, createdDirs);
        }

        // 获取当前登录用户的用户名作为作者
        const authorName = req.user?.name || req.user?.username || 'user';

        // 使用动态生成文档内容（根据 JSON 配置）
        const content = generateDocument(typePackageId, {
            title: title.trim(),
            author: authorName,
            blocks: blocks
        });

        // 生成文件名（使用 title 作为文件名）
        const safeFilename = title.trim()
            .replace(/[<>:"/\\|?*]/g, '')   // 移除非法字符
            .replace(/\s+/g, '-')           // 空格替换为连字符
            .substring(0, 100);             // 限制长度

        // 目标目录
        const targetDir = targetPath && targetPath !== '/'
            ? join(config.repositoryRoot, targetPath.replace(/^\//, ''))
            : config.repositoryRoot;

        // 确保目录存在
        if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
        }

        // 完整文件路径
        let filePath = join(targetDir, `${safeFilename}.md`);

        // 如果文件已存在，添加时间戳
        if (existsSync(filePath)) {
            const timestamp = Date.now();
            filePath = join(targetDir, `${safeFilename}-${timestamp}.md`);
        }

        // 写入文件
        writeFileSync(filePath, content, 'utf-8');

        // 计算相对路径（相对于 repository）
        const relativePath = filePath.replace(config.repositoryRoot, '').replace(/^[\/\\]/, '');

        console.log(`[TypePackages API] Created document: ${relativePath}`);

        res.json({
            success: true,
            data: {
                path: relativePath,
                absolutePath: filePath,
                title: title.trim(),
                typePackageId
            }
        });
    } catch (error) {
        console.error('[TypePackages API] Failed to create document:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '创建文档失败'
        });
    }
});

export default router;

