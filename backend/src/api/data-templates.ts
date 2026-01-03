/**
 * Data Templates API - 数据模板管理
 */

import { Router, Request, Response, NextFunction } from 'express';
import * as templateService from '../services/data-template.js';

const router = Router();

// ============================================================
// 查询 API
// ============================================================

/**
 * 获取完整模板配置
 * GET /api/data-templates
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = templateService.getTemplateConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取所有模板（扁平列表）
 * GET /api/data-templates/all
 */
router.get('/all', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = templateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取单个模板
 * GET /api/data-templates/template/:id
 */
router.get('/template/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = templateService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * 从模板生成 YAML 内容
 * GET /api/data-templates/template/:id/yaml
 */
router.get('/template/:id/yaml', (req: Request, res: Response, next: NextFunction) => {
  try {
    const yaml = templateService.generateYamlFromTemplate(req.params.id);
    res.json({ success: true, data: yaml });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 分类管理 API
// ============================================================

/**
 * 添加分类
 * POST /api/data-templates/categories
 */
router.post('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name, description } = req.body;

    if (!id || !name) {
      return res.status(400).json({ success: false, error: 'id and name are required' });
    }

    const category = templateService.addCategory(id, name, description);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新分类
 * PUT /api/data-templates/categories/:id
 */
router.put('/categories/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const category = templateService.updateCategory(req.params.id, name, description);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除分类
 * DELETE /api/data-templates/categories/:id
 */
router.delete('/categories/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    templateService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// 模板管理 API
// ============================================================

/**
 * 添加模板
 * POST /api/data-templates/templates/:categoryId
 */
router.post('/templates/:categoryId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, name, description, dataType, fields } = req.body;

    if (!id || !name || !dataType || !fields) {
      return res.status(400).json({
        success: false,
        error: 'id, name, dataType, and fields are required',
      });
    }

    const template = templateService.addTemplate(req.params.categoryId, {
      id,
      name,
      description,
      dataType,
      fields,
    });
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * 从数据创建模板
 * POST /api/data-templates/from-data
 */
router.post('/from-data', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, templateId, name, description, dataType, fieldKeys } = req.body;

    if (!categoryId || !templateId || !name || !dataType || !fieldKeys) {
      return res.status(400).json({
        success: false,
        error: 'categoryId, templateId, name, dataType, and fieldKeys are required',
      });
    }

    const template = templateService.createTemplateFromData(
      categoryId,
      templateId,
      name,
      description || '',
      dataType,
      fieldKeys
    );
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新模板
 * PUT /api/data-templates/templates/:id
 */
router.put('/templates/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, dataType, fields } = req.body;
    const template = templateService.updateTemplate(req.params.id, {
      name,
      description,
      dataType,
      fields,
    });
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除模板
 * DELETE /api/data-templates/templates/:id
 */
router.delete('/templates/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    templateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

