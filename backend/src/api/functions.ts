/**
 * Functions API - 功能注册表接口
 * 
 * Phase 3.3: 功能声明系统 API
 * 
 * 端点：
 * GET  /api/functions              - 获取完整功能注册表
 * GET  /api/functions/:function    - 获取指定功能的所有文档
 * GET  /api/functions/:function/find - 按条件查找文档
 * POST /api/functions/rebuild      - 重建功能注册表
 */

import { Router, Request, Response } from 'express';
import {
  getFunctionRegistry,
  rebuildFunctionRegistry,
  getByFunction,
  findPrincipalByEmail,
  findPrincipalById,
} from '../services/function-registry.js';

export const router = Router();

/**
 * GET /api/functions
 * 获取完整功能注册表
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const registry = await getFunctionRegistry();
    res.json({
      success: true,
      data: registry,
    });
  } catch (error) {
    console.error('[Functions API] Failed to get registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get function registry',
    });
  }
});

/**
 * POST /api/functions/rebuild
 * 重建功能注册表
 */
router.post('/rebuild', async (_req: Request, res: Response) => {
  try {
    const registry = await rebuildFunctionRegistry();
    res.json({
      success: true,
      data: registry,
      message: `Rebuilt registry: ${Object.keys(registry.functions).length} function types`,
    });
  } catch (error) {
    console.error('[Functions API] Failed to rebuild registry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rebuild function registry',
    });
  }
});

/**
 * GET /api/functions/:function
 * 获取指定功能类型的所有文档
 */
router.get('/:function', async (req: Request, res: Response) => {
  try {
    const funcType = req.params.function;
    const documents = await getByFunction(funcType);
    
    res.json({
      success: true,
      data: {
        function: funcType,
        documents,
        count: documents.length,
      },
    });
  } catch (error) {
    console.error('[Functions API] Failed to get function:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get function documents',
    });
  }
});

/**
 * GET /api/functions/:function/find
 * 按条件查找文档
 * 
 * Query Parameters:
 * - email: 按邮箱查找 Principal
 * - id: 按 ID 查找
 */
router.get('/:function/find', async (req: Request, res: Response) => {
  try {
    const funcType = req.params.function;
    const { email, id } = req.query;
    
    // 目前只支持 principal 的特定查找
    if (funcType === 'principal') {
      let result = null;
      
      if (email && typeof email === 'string') {
        result = await findPrincipalByEmail(email);
      } else if (id && typeof id === 'string') {
        result = await findPrincipalById(id);
      }
      
      if (result) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Not found',
        });
      }
      return;
    }
    
    // 通用查找：遍历所有文档检查 indexed_fields
    const documents = await getByFunction(funcType);
    const filtered = documents.filter(doc => {
      for (const [key, value] of Object.entries(req.query)) {
        const docValue = doc.indexed_fields[key];
        if (Array.isArray(docValue)) {
          if (!docValue.includes(value)) return false;
        } else if (docValue !== value) {
          return false;
        }
      }
      return true;
    });
    
    res.json({
      success: true,
      data: filtered.length === 1 ? filtered[0] : filtered,
      count: filtered.length,
    });
  } catch (error) {
    console.error('[Functions API] Failed to find:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find documents',
    });
  }
});

export default router;

