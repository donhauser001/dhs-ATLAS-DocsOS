/**
 * Workspace API 路由
 * 
 * Phase 1: 提供工作空间索引和目录树接口
 */

import { Router, Request, Response } from 'express';
import {
  getWorkspaceIndex,
  getWorkspaceTree,
  rebuildWorkspaceIndex,
  type DocumentInfo,
  type TreeNode,
} from '../services/workspace-service.js';
import { filterDocumentsByPermission, checkPathPermission } from '../services/auth-service.js';

const router = Router();

/**
 * 根据用户权限过滤目录树
 */
function filterTreeByPermission(tree: TreeNode[], user: Express.Request['user']): TreeNode[] {
  if (!user || user.role === 'admin' || user.role === 'staff') {
    return tree;
  }
  
  return tree
    .map(node => filterNode(node, user))
    .filter((node): node is TreeNode => node !== null);
}

function filterNode(node: TreeNode, user: Express.Request['user']): TreeNode | null {
  if (!user) return null;
  
  if (node.type === 'document') {
    return checkPathPermission(user, node.path!) ? node : null;
  }
  
  // Directory node
  if (!node.children) return null;
  
  const filteredChildren = node.children
    .map(child => filterNode(child, user))
    .filter((child): child is TreeNode => child !== null);
  
  if (filteredChildren.length === 0) {
    return null;
  }
  
  return {
    ...node,
    children: filteredChildren,
  };
}

/**
 * GET /api/workspace/index
 * 获取完整的 Workspace 索引
 */
router.get('/index', async (req: Request, res: Response) => {
  try {
    const index = await getWorkspaceIndex();
    
    // 根据用户权限过滤文档
    const filteredDocuments = req.user 
      ? filterDocumentsByPermission(req.user, index.documents)
      : index.documents;
    
    // 重新计算统计
    const stats = {
      total_documents: filteredDocuments.length,
      total_blocks: filteredDocuments.reduce((sum, d) => sum + d.block_count, 0),
      total_anchors: filteredDocuments.reduce((sum, d) => sum + d.anchors.length, 0),
    };
    
    res.json({
      ...index,
      documents: filteredDocuments,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get workspace index', details: String(error) });
  }
});

/**
 * GET /api/workspace/tree
 * 获取目录树结构
 */
router.get('/tree', async (req: Request, res: Response) => {
  try {
    const tree = await getWorkspaceTree();
    
    // 根据用户权限过滤目录树
    const filteredTree = filterTreeByPermission(tree, req.user);
    
    res.json({ tree: filteredTree });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get workspace tree', details: String(error) });
  }
});

/**
 * POST /api/workspace/rebuild
 * 手动触发索引重建
 */
router.post('/rebuild', async (_req: Request, res: Response) => {
  try {
    const index = await rebuildWorkspaceIndex();
    res.json({ 
      success: true, 
      message: 'Workspace index rebuilt',
      stats: index.stats,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rebuild workspace index', details: String(error) });
  }
});

export default router;
