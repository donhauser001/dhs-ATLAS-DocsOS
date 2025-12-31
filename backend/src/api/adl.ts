/**
 * ADL API 路由
 * 
 * 提供 ADL 文档的读取、解析和操作接口
 */

import { Router, Request, Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parseADL, findBlockByAnchor } from '../adl/parser.js';
import type { ADLDocument, Proposal, ValidationResult } from '../adl/types.js';

const router = Router();

// 文档仓库根目录
const REPOSITORY_ROOT = join(process.cwd(), '..', 'repository');

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
  
  const fullPath = join(REPOSITORY_ROOT, docPath);
  
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
  
  const fullPath = join(REPOSITORY_ROOT, docPath);
  
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

// Proposal 存储（Phase 0 使用内存存储）
const proposals = new Map<string, Proposal>();

/**
 * POST /api/adl/proposal
 * 创建变更提案
 */
router.post('/proposal', (req: Request, res: Response) => {
  const proposalData = req.body as Omit<Proposal, 'id' | 'status'>;
  
  // 生成 Proposal ID
  const id = `PROP-${Date.now()}`;
  
  const proposal: Proposal = {
    ...proposalData,
    id,
    status: 'pending',
  };
  
  proposals.set(id, proposal);
  
  res.json({ 
    success: true, 
    proposal_id: id,
    proposal 
  });
});

/**
 * GET /api/adl/proposal/:id
 * 获取指定提案
 */
router.get('/proposal/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = proposals.get(id);
  
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
  const proposal = proposals.get(id);
  
  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }
  
  // 动态导入 validator
  const { validateProposal } = await import('../adl/validator.js');
  const result = validateProposal(proposal, REPOSITORY_ROOT);
  
  res.json(result);
});

/**
 * POST /api/adl/proposal/:id/execute
 * 执行提案
 */
router.post('/proposal/:id/execute', async (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = proposals.get(id);
  
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
    const result = await executeProposal(proposal, REPOSITORY_ROOT);
    
    // 更新 proposal 状态
    proposal.status = result.success ? 'executed' : 'rejected';
    proposals.set(id, proposal);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute proposal', details: String(error) });
  }
});

export default router;

