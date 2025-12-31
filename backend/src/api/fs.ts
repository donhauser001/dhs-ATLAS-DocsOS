import { Router, Request, Response } from 'express';
import { readFile, listDir, getTree } from '../git/file-operations.js';

export const fsRouter = Router();

/**
 * GET /api/fs/read
 * 读取单个文件
 */
fsRouter.get('/read', async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_PATH', message: '路径参数缺失' },
      });
      return;
    }

    const content = await readFile(path);

    if (content === null) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `文件 ${path} 不存在` },
      });
      return;
    }

    res.json({
      success: true,
      path,
      content,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'READ_FAILED', message: '读取文件失败' },
    });
  }
});

/**
 * GET /api/fs/list
 * 列出目录内容
 */
fsRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const { path, recursive } = req.query;

    const items = await listDir(
      (path as string) || '',
      recursive === 'true'
    );

    res.json({
      success: true,
      path: path || '/',
      items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'LIST_FAILED', message: '列出目录失败' },
    });
  }
});

/**
 * GET /api/fs/tree
 * 获取完整目录树
 */
fsRouter.get('/tree', async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    const tree = await getTree((path as string) || '');

    res.json({
      success: true,
      tree,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'TREE_FAILED', message: '获取目录树失败' },
    });
  }
});

