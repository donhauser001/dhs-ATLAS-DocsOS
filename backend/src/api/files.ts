/**
 * 文件管理 API - Phase 3.9
 * 
 * 提供文件上传、下载、目录管理等功能
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as fileService from '../services/file-service.js';

const router = Router();

// Multer 配置：内存存储
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: fileService.MAX_FILE_SIZE,
    },
});

/**
 * 修复中文文件名编码问题
 * Multer 将 UTF-8 文件名以 Latin-1 方式存储，需要重新解码
 */
function fixFileName(originalName: string): string {
    try {
        // 尝试将 Latin-1 编码的字符串转换回 UTF-8
        return Buffer.from(originalName, 'latin1').toString('utf8');
    } catch {
        return originalName;
    }
}

// ============================================================
// 目录操作
// ============================================================

/**
 * GET /api/files/folders
 * 获取目录树
 */
router.get('/folders', (_req: Request, res: Response) => {
    try {
        const tree = fileService.getFolderTree();
        res.json({ success: true, data: tree });
    } catch (error) {
        res.status(500).json({ success: false, error: '获取目录树失败' });
    }
});

/**
 * POST /api/files/folders
 * 创建文件夹
 * Body: { path: string }
 */
router.post('/folders', (req: Request, res: Response) => {
    const { path } = req.body;

    if (!path || typeof path !== 'string') {
        return res.status(400).json({ success: false, error: '请提供文件夹路径' });
    }

    const result = fileService.createFolder(path);
    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

/**
 * DELETE /api/files/folders
 * 删除文件夹
 * Query: path, force (可选)
 */
router.delete('/folders', (req: Request, res: Response) => {
    const { path, force } = req.query;

    if (!path || typeof path !== 'string') {
        return res.status(400).json({ success: false, error: '请提供文件夹路径' });
    }

    const result = fileService.deleteFolder(path, force === 'true');
    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

// ============================================================
// 文件列表
// ============================================================

/**
 * GET /api/files/list
 * 列出目录内容
 * Query: path (默认 /)
 */
router.get('/list', (req: Request, res: Response) => {
    const dirPath = (req.query.path as string) || '/';

    try {
        const files = fileService.listDirectory(dirPath);
        res.json({ success: true, data: files });
    } catch (error) {
        res.status(500).json({ success: false, error: '列出目录内容失败' });
    }
});

// ============================================================
// 文件上传
// ============================================================

/**
 * POST /api/files/upload
 * 上传文件
 * Query: path (目标目录，默认 /)
 * Body: multipart/form-data, file 字段
 */
router.post(
    '/upload',
    upload.single('file'),
    (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ success: false, error: '请选择文件' });
        }

        const dirPath = (req.query.path as string) || '/';
        // 修复中文文件名编码
        const fileName = fixFileName(req.file.originalname);
        const result = fileService.saveFile(dirPath, fileName, req.file.buffer);

        if (result.success) {
            res.json({ success: true, data: result.file });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    }
);

/**
 * POST /api/files/upload-multiple
 * 批量上传文件
 * Query: path (目标目录，默认 /)
 * Body: multipart/form-data, files 字段
 */
router.post(
    '/upload-multiple',
    upload.array('files', 20),
    (req: Request, res: Response) => {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, error: '请选择文件' });
        }

        const dirPath = (req.query.path as string) || '/';
        // 修复中文文件名编码
        const results = files.map(file =>
            fileService.saveFile(dirPath, fixFileName(file.originalname), file.buffer)
        );

        const succeeded = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        res.json({
            success: true,
            data: {
                uploaded: succeeded.map(r => r.file),
                failed: failed.map((r, i) => ({
                    name: fixFileName(files[results.indexOf(r)]?.originalname || ''),
                    error: r.error,
                })),
            },
        });
    }
);

// ============================================================
// 文件操作
// ============================================================

/**
 * GET /api/files/download
 * 下载文件
 * Query: path
 */
router.get('/download', (req: Request, res: Response) => {
    const filePath = req.query.path as string;

    if (!filePath) {
        return res.status(400).json({ success: false, error: '请提供文件路径' });
    }

    const absolutePath = fileService.getFilePath(filePath);
    if (!absolutePath) {
        return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const info = fileService.getFileInfo(filePath);
    if (!info) {
        return res.status(404).json({ success: false, error: '文件不存在' });
    }

    res.setHeader('Content-Type', info.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(info.name)}"`);
    res.sendFile(absolutePath);
});

/**
 * GET /api/files/info
 * 获取文件信息
 * Query: path
 */
router.get('/info', (req: Request, res: Response) => {
    const filePath = req.query.path as string;

    if (!filePath) {
        return res.status(400).json({ success: false, error: '请提供文件路径' });
    }

    const info = fileService.getFileInfo(filePath);
    if (!info) {
        return res.status(404).json({ success: false, error: '文件不存在' });
    }

    res.json({ success: true, data: info });
});

/**
 * DELETE /api/files/file
 * 删除文件
 * Query: path
 */
router.delete('/file', (req: Request, res: Response) => {
    const filePath = req.query.path as string;

    if (!filePath) {
        return res.status(400).json({ success: false, error: '请提供文件路径' });
    }

    const result = fileService.deleteFile(filePath);
    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

/**
 * POST /api/files/rename
 * 重命名文件或文件夹
 * Body: { path: string, newName: string }
 */
router.post('/rename', (req: Request, res: Response) => {
    const { path, newName } = req.body;

    if (!path || !newName) {
        return res.status(400).json({ success: false, error: '请提供路径和新名称' });
    }

    const result = fileService.rename(path, newName);
    if (result.success) {
        res.json({ success: true, data: { newPath: result.newPath } });
    } else {
        res.status(400).json({ success: false, error: result.error });
    }
});

/**
 * GET /api/files/preview
 * 获取文件预览（图片直接返回，其他返回信息）
 * Query: path
 */
router.get('/preview', (req: Request, res: Response) => {
    const filePath = req.query.path as string;

    if (!filePath) {
        return res.status(400).json({ success: false, error: '请提供文件路径' });
    }

    const absolutePath = fileService.getFilePath(filePath);
    if (!absolutePath) {
        return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const info = fileService.getFileInfo(filePath);
    if (!info) {
        return res.status(404).json({ success: false, error: '文件不存在' });
    }

    // 图片类型直接返回
    if (info.mimeType?.startsWith('image/')) {
        res.setHeader('Content-Type', info.mimeType);
        res.sendFile(absolutePath);
        return;
    }

    // 其他类型返回信息
    res.json({ success: true, data: info });
});

export default router;

