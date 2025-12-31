import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 上传根目录
const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

// 允许的文件类型
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

// 文件大小限制 (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// 文件分类配置
const FILE_CATEGORIES: Record<string, {
  path: string;
  allowedTypes: string[];
  maxSize: number;
}> = {
  // 组织相关
  'organization-logo': {
    path: 'organization/logo',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 2 * 1024 * 1024, // 2MB
  },
  'organization-business-license': {
    path: 'organization/business-license',
    allowedTypes: ALLOWED_DOC_TYPES,
    maxSize: MAX_FILE_SIZE,
  },
  'organization-bank-permit': {
    path: 'organization/bank-permit',
    allowedTypes: ALLOWED_DOC_TYPES,
    maxSize: MAX_FILE_SIZE,
  },
  'organization-legal-person-id': {
    path: 'organization/legal-person-id',
    allowedTypes: ALLOWED_DOC_TYPES,
    maxSize: MAX_FILE_SIZE,
  },
  // 用户相关
  'user-avatar': {
    path: 'users/{userId}/avatar',
    allowedTypes: ALLOWED_IMAGE_TYPES,
    maxSize: 2 * 1024 * 1024,
  },
  'user-id-card': {
    path: 'users/{userId}/id-card',
    allowedTypes: ALLOWED_DOC_TYPES,
    maxSize: MAX_FILE_SIZE,
  },
};

// 生成唯一文件名
function generateFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

// 获取文件存储路径
function getStoragePath(category: string, userId?: string): string {
  const config = FILE_CATEGORIES[category];
  if (!config) {
    throw new Error('无效的文件分类');
  }
  
  let storagePath = config.path;
  if (userId) {
    storagePath = storagePath.replace('{userId}', userId);
  }
  
  return path.join(UPLOADS_ROOT, storagePath);
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const category = req.body.category || req.query.category;
      const userId = (req as any).user?.username;
      const destPath = getStoragePath(category, userId);
      
      // 确保目录存在
      await fs.mkdir(destPath, { recursive: true });
      cb(null, destPath);
    } catch (error: any) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file.originalname));
  },
});

// 文件过滤器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const category = req.body.category || req.query.category;
  const config = FILE_CATEGORIES[category as string];
  
  if (!config) {
    cb(new Error('无效的文件分类'));
    return;
  }
  
  if (!config.allowedTypes.includes(file.mimetype)) {
    cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    return;
  }
  
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const uploadRouter = Router();

/**
 * POST /api/upload
 * 上传单个文件
 * Body: category (文件分类)
 */
uploadRouter.post(
  '/',
  authenticate,
  (req, res, next) => {
    // 先检查 category 参数
    const category = req.body.category || req.query.category;
    if (!category || !FILE_CATEGORIES[category]) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: '无效的文件分类',
          validCategories: Object.keys(FILE_CATEGORIES),
        },
      });
    }
    next();
  },
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: '未提供文件' },
        });
      }

      const category = req.body.category || req.query.category;
      const userId = (req as any).user?.username;
      
      // 生成相对路径用于存储到数据库
      let relativePath = FILE_CATEGORIES[category].path;
      if (userId) {
        relativePath = relativePath.replace('{userId}', userId);
      }
      relativePath = `${relativePath}/${req.file.filename}`;

      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: relativePath,
          url: `/api/files/${relativePath}`,
        },
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'UPLOAD_ERROR', message: error.message || '上传失败' },
      });
    }
  }
);

/**
 * GET /api/files/*
 * 获取文件
 * 注意：此端点不需要认证，文件安全性依赖于随机文件名
 * 后续可以实现签名 URL 机制增强安全性
 */
uploadRouter.get('/files/*', async (req: Request, res: Response) => {
  try {
    const filePath = req.params[0];
    const fullPath = path.join(UPLOADS_ROOT, filePath);
    
    // 安全检查：确保路径在 uploads 目录内
    const normalizedPath = path.normalize(fullPath);
    if (!normalizedPath.startsWith(UPLOADS_ROOT)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: '无权访问该文件' },
      });
    }
    
    // 检查文件是否存在
    try {
      await fs.access(normalizedPath);
    } catch {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '文件不存在' },
      });
    }
    
    // 设置缓存头
    res.setHeader('Cache-Control', 'private, max-age=31536000');
    res.sendFile(normalizedPath);
  } catch (error: any) {
    console.error('File access error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: '获取文件失败' },
    });
  }
});

/**
 * DELETE /api/upload
 * 删除文件
 */
uploadRouter.delete(
  '/',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response) => {
    try {
      const { path: filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PATH', message: '未提供文件路径' },
        });
      }
      
      const fullPath = path.join(UPLOADS_ROOT, filePath);
      
      // 安全检查
      const normalizedPath = path.normalize(fullPath);
      if (!normalizedPath.startsWith(UPLOADS_ROOT)) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权删除该文件' },
        });
      }
      
      await fs.unlink(normalizedPath);
      
      res.json({
        success: true,
        message: '文件已删除',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'DELETE_ERROR', message: '删除失败' },
      });
    }
  }
);

/**
 * GET /api/upload/categories
 * 获取文件分类列表
 */
uploadRouter.get('/categories', authenticate, (req: Request, res: Response) => {
  const categories = Object.entries(FILE_CATEGORIES).map(([key, config]) => ({
    key,
    path: config.path,
    allowedTypes: config.allowedTypes,
    maxSize: config.maxSize,
    maxSizeMB: Math.round(config.maxSize / 1024 / 1024 * 10) / 10,
  }));
  
  res.json({
    success: true,
    categories,
  });
});

