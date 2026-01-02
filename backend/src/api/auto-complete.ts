/**
 * Auto-Complete API - 自动补齐 API 端点
 * 
 * Phase 3.5: 固定键系统
 * 
 * 端点：
 * - POST /api/documents/auto-complete - 单文档补齐预览
 * - POST /api/documents/auto-complete/apply - 应用单文档补齐
 * - POST /api/documents/auto-complete-all - 批量补齐预览
 * - GET /api/documents/:path/missing-fields - 获取缺失字段
 */

import { Router, Request, Response } from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';
import { parseADL } from '../adl/parser.js';
import { serializeADL } from '../adl/executor.js';
import { getWorkspaceIndex } from '../services/workspace-service.js';
import {
  autoCompleteDocument,
  autoCompleteDocuments,
  detectMissingFields,
  previewAutoComplete,
  type AutoCompleteContext,
} from '../services/auto-complete.js';

const router = Router();

// ============================================================
// API 端点
// ============================================================

/**
 * POST /api/documents/auto-complete
 * 
 * 预览单文档的自动补齐
 * 返回将要进行的变更，不实际修改文件
 */
router.post('/auto-complete', async (req: Request, res: Response) => {
  try {
    const { path: docPath } = req.body;
    
    if (!docPath) {
      return res.status(400).json({
        error: 'Missing required field: path',
      });
    }
    
    const fullPath = join(config.repositoryRoot, docPath);
    
    if (!existsSync(fullPath)) {
      return res.status(404).json({
        error: `Document not found: ${docPath}`,
      });
    }
    
    // 解析文档
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, docPath);
    
    // 收集所有已存在的 ID
    const existingIds = await collectAllExistingIds();
    
    // 创建上下文
    const context: AutoCompleteContext = {
      currentUser: req.user ? { id: req.user.id, display_name: req.user.name } : undefined,
      isUpdate: false,
      existingIds,
    };
    
    // 预览补齐
    const preview = previewAutoComplete(doc, context);
    
    res.json({
      path: docPath,
      ...preview,
    });
  } catch (error) {
    console.error('[AutoComplete] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/documents/auto-complete/apply
 * 
 * 应用单文档的自动补齐
 * 实际修改文件
 */
router.post('/auto-complete/apply', async (req: Request, res: Response) => {
  try {
    const { path: docPath } = req.body;
    
    if (!docPath) {
      return res.status(400).json({
        error: 'Missing required field: path',
      });
    }
    
    const fullPath = join(config.repositoryRoot, docPath);
    
    if (!existsSync(fullPath)) {
      return res.status(404).json({
        error: `Document not found: ${docPath}`,
      });
    }
    
    // 解析文档
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, docPath);
    
    // 收集所有已存在的 ID
    const existingIds = await collectAllExistingIds();
    
    // 创建上下文
    const context: AutoCompleteContext = {
      currentUser: req.user ? { id: req.user.id, display_name: req.user.name } : undefined,
      isUpdate: false,
      existingIds,
    };
    
    // 执行补齐
    const result = await autoCompleteDocument(doc, context);
    
    if (!result.needsWrite) {
      return res.json({
        path: docPath,
        changes: [],
        message: '文档已完整，无需补齐',
      });
    }
    
    // 序列化并写回文件
    const newContent = serializeADL(result.document);
    writeFileSync(fullPath, newContent, 'utf-8');
    
    res.json({
      path: docPath,
      changes: result.changes,
      message: `已补齐 ${result.changes.length} 个字段`,
    });
  } catch (error) {
    console.error('[AutoComplete] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/documents/auto-complete-all
 * 
 * 批量预览所有文档的自动补齐
 */
router.post('/auto-complete-all', async (req: Request, res: Response) => {
  try {
    const { apply = false } = req.body;
    
    // 获取所有文档
    const workspaceIndex = await getWorkspaceIndex();
    const existingIds = await collectAllExistingIds();
    
    const context: AutoCompleteContext = {
      currentUser: req.user ? { id: req.user.id, display_name: req.user.name } : undefined,
      isUpdate: false,
      existingIds,
    };
    
    const results: {
      path: string;
      totalChanges: number;
      changes?: Array<{ key: string; newValue: unknown; reason: string }>;
    }[] = [];
    
    let totalDocuments = 0;
    let documentsNeedingUpdate = 0;
    let totalChanges = 0;
    
    for (const docInfo of workspaceIndex.documents) {
      totalDocuments++;
      
      const fullPath = join(config.repositoryRoot, docInfo.path);
      if (!existsSync(fullPath)) {
        continue;
      }
      
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const doc = parseADL(content, docInfo.path);
        
        const result = await autoCompleteDocument(doc, context);
        
        if (result.needsWrite) {
          documentsNeedingUpdate++;
          totalChanges += result.changes.length;
          
          // 将新生成的 ID 添加到集合
          for (const change of result.changes) {
            if (change.key === 'id' && change.newValue) {
              existingIds.add(change.newValue as string);
            }
          }
          
          results.push({
            path: docInfo.path,
            totalChanges: result.changes.length,
            changes: result.changes.map(c => ({
              key: c.blockAnchor ? `${c.blockAnchor}.${c.key}` : c.key,
              newValue: c.newValue,
              reason: c.reason,
            })),
          });
          
          // 如果需要应用变更
          if (apply) {
            const newContent = serializeADL(result.document);
            writeFileSync(fullPath, newContent, 'utf-8');
          }
        }
      } catch (error) {
        console.error(`[AutoComplete] Failed to process ${docInfo.path}:`, error);
      }
    }
    
    res.json({
      totalDocuments,
      documentsNeedingUpdate,
      totalChanges,
      applied: apply,
      documents: results,
    });
  } catch (error) {
    console.error('[AutoComplete] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/documents/:path/missing-fields
 * 
 * 获取文档的缺失字段
 */
router.get('/:path(*)/missing-fields', async (req: Request, res: Response) => {
  try {
    const docPath = req.params.path;
    
    if (!docPath) {
      return res.status(400).json({
        error: 'Missing document path',
      });
    }
    
    const fullPath = join(config.repositoryRoot, docPath);
    
    if (!existsSync(fullPath)) {
      return res.status(404).json({
        error: `Document not found: ${docPath}`,
      });
    }
    
    // 解析文档
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, docPath);
    
    // 收集所有已存在的 ID
    const existingIds = await collectAllExistingIds();
    
    // 创建上下文
    const context: AutoCompleteContext = {
      currentUser: req.user ? { id: req.user.id, display_name: req.user.name } : undefined,
      existingIds,
    };
    
    // 检测缺失字段
    const missingFields = detectMissingFields(doc, context);
    
    res.json({
      path: docPath,
      missingFields,
      total: missingFields.length,
    });
  } catch (error) {
    console.error('[AutoComplete] Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================================
// 辅助函数
// ============================================================

/**
 * 收集所有已存在的 ID
 */
async function collectAllExistingIds(): Promise<Set<string>> {
  const existingIds = new Set<string>();
  
  try {
    const workspaceIndex = await getWorkspaceIndex();
    
    for (const docInfo of workspaceIndex.documents) {
      const fullPath = join(config.repositoryRoot, docInfo.path);
      if (!existsSync(fullPath)) {
        continue;
      }
      
      try {
        const content = readFileSync(fullPath, 'utf-8');
        const doc = parseADL(content, docInfo.path);
        
        for (const block of doc.blocks) {
          if (block.machine?.id) {
            existingIds.add(block.machine.id);
          }
        }
      } catch {
        // 忽略解析错误的文档
      }
    }
  } catch {
    // 忽略获取索引的错误
  }
  
  return existingIds;
}

export default router;

