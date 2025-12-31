/**
 * ADL API 路由
 * 
 * 提供 ADL 文档的读取、解析和操作接口
 * 
 * Phase 0.5: 使用持久化 Proposal 存储和统一配置
 */

import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseADL, findBlockByAnchor } from '../adl/parser.js';
import { config, ensureDirectories } from '../config.js';
import {
  createProposal,
  getProposal,
  updateProposal,
  listProposals,
} from '../adl/proposal-store.js';
import { updateDocumentIndex, rebuildWorkspaceIndex } from '../services/workspace-service.js';
import { executeQuery, rebuildBlocksIndex, type Query } from '../services/query-service.js';
import type { ADLDocument, Proposal, ValidationResult } from '../adl/types.js';

const router = Router();

// 确保必要目录存在
ensureDirectories();

/**
 * GET /api/adl/document
 * 获取并解析指定的 ADL 文档
 */
router.get('/document', (req: Request, res: Response) => {
  const { path: docPath } = req.query;
  
  if (!docPath || typeof docPath !== 'string') {
    res.status(400).json({ error: 'Missing document path' });
    return;
  }
  
  const fullPath = join(config.repositoryRoot, docPath);
  
  if (!existsSync(fullPath)) {
    res.status(404).json({ error: 'Document not found', path: docPath });
    return;
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, docPath);
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: 'Failed to parse document', details: String(error) });
  }
});

/**
 * GET /api/adl/block/:anchor
 * 获取指定 Anchor 的 Block
 */
router.get('/block/:anchor', (req: Request, res: Response) => {
  const { anchor } = req.params;
  const { path: docPath } = req.query;
  
  if (!docPath || typeof docPath !== 'string') {
    res.status(400).json({ error: 'Missing document path' });
    return;
  }
  
  const fullPath = join(config.repositoryRoot, docPath);
  
  if (!existsSync(fullPath)) {
    res.status(404).json({ error: 'Document not found', path: docPath });
    return;
  }
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const doc = parseADL(content, docPath);
    const block = findBlockByAnchor(doc, anchor);
    
    if (!block) {
      res.status(404).json({ error: 'Block not found', anchor });
      return;
    }
    
    res.json(block);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get block', details: String(error) });
  }
});

/**
 * GET /api/adl/proposals
 * 列出所有提案
 */
router.get('/proposals', (req: Request, res: Response) => {
  try {
    const proposals = listProposals();
    res.json({ proposals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list proposals', details: String(error) });
  }
});

/**
 * POST /api/adl/proposal
 * 创建变更提案（持久化到文件）
 */
router.post('/proposal', (req: Request, res: Response) => {
  try {
    const proposalData = req.body as Omit<Proposal, 'id' | 'status'>;
    const proposal = createProposal(proposalData);
    
    res.json({ 
      success: true, 
      proposal_id: proposal.id,
      proposal 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create proposal', details: String(error) });
  }
});

/**
 * GET /api/adl/proposal/:id
 * 获取指定提案
 */
router.get('/proposal/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);
  
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }
  
  res.json(proposal);
});

/**
 * POST /api/adl/proposal/:id/validate
 * 校验提案
 */
router.post('/proposal/:id/validate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);
  
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }
  
  // 动态导入 validator
  const { validateProposal } = await import('../adl/validator.js');
  const result = validateProposal(proposal, config.repositoryRoot);
  
  res.json(result);
});

/**
 * POST /api/adl/proposal/:id/execute
 * 执行提案
 */
router.post('/proposal/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);
  
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }
  
  if (proposal.status !== 'pending') {
    res.status(400).json({ error: 'Proposal already processed', status: proposal.status });
    return;
  }
  
  try {
    // 动态导入 executor
    const { executeProposal } = await import('../adl/executor.js');
    const result = await executeProposal(proposal, config.repositoryRoot);
    
    // 更新 proposal 状态（持久化）
    updateProposal(id, { 
      status: result.success ? 'executed' : 'rejected' 
    });
    
    // 如果执行成功，更新 Workspace 索引和 Blocks 索引
    if (result.success) {
      await updateDocumentIndex(proposal.target_file);
      await rebuildBlocksIndex(); // 重建 Blocks 索引
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute proposal', details: String(error) });
  }
});

// ============================================================
// Query API
// ============================================================

/**
 * POST /api/adl/query
 * 执行 ADL 查询
 */
router.post('/query', async (req: Request, res: Response) => {
  try {
    const query = req.body as Query;
    const result = await executeQuery(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute query', details: String(error) });
  }
});

export default router;
