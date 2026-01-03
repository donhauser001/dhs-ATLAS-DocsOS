/**
 * ADL API 路由
 * 
 * 提供 ADL 文档的读取、解析和操作接口
 * 
 * Phase 0.5: 使用持久化 Proposal 存储和统一配置
 * Phase 1.5: 使用 Registry 和 Visibility Resolver
 * Phase 2: 权限中间件全面接入
 */

import { Router, Request, Response } from 'express';
import { config, ensureDirectories } from '../config.js';
import { findBlockByAnchor } from '../adl/parser.js';
import {
  createProposal,
  getProposal,
  updateProposal,
  listProposals,
} from '../adl/proposal-store.js';
import { updateDocumentIndex } from '../services/workspace-service.js';
// Phase 2.1: 使用增量更新而非全量重建
import { executeQuery, updateBlocksIndexForDocument, type Query } from '../services/query-service.js';
// Phase 1.5: 使用 Registry 作为文档发现的唯一入口
import {
  documentExists,
  getDocument,
  resolveBlockByAnchor,
  canAccessDocument,
  getSafeAbsolutePath,
} from '../services/workspace-registry.js';
import { checkPathPermission } from '../services/auth-service.js';
import type { Proposal } from '../adl/types.js';
// Phase 2: 权限中间件
import {
  requireAuth,
  requirePathAccess,
  requireProposalCreate,
  requireProposalExecute,
} from '../middleware/permission.js';

const router = Router();

// 确保必要目录存在
ensureDirectories();

/**
 * GET /api/adl/document
 * 获取并解析指定的 ADL 文档
 * 
 * Phase 1.5: 通过 Registry 获取文档
 * Phase 2: 需要认证 + 路径权限
 */
router.get('/document', requireAuth, requirePathAccess, (req: Request, res: Response) => {
  const { path: docPath } = req.query;

  if (!docPath || typeof docPath !== 'string') {
    res.status(400).json({ error: 'Missing document path' });
    return;
  }

  // Phase 2: 再次检查访问权限（防御性编程）
  if (!canAccessDocument(req.user!, docPath)) {
    res.status(403).json({ error: 'Access denied', path: docPath });
    return;
  }

  // Phase 1.5: 使用 Registry 获取文档
  const content = getDocument(docPath);

  if (!content) {
    res.status(404).json({ error: 'Document not found', path: docPath });
    return;
  }

  res.json(content.document);
});

/**
 * PUT /api/adl/document
 * 保存/更新 ADL 文档
 * 
 * Phase 3.8: 支持可视化编辑器的保存功能
 */
router.put('/document', requireAuth, requirePathAccess, async (req: Request, res: Response) => {
  const { path: docPath } = req.query;

  if (!docPath || typeof docPath !== 'string') {
    res.status(400).json({ error: 'Missing document path' });
    return;
  }

  // Phase 2: 检查访问权限
  if (!canAccessDocument(req.user!, docPath)) {
    res.status(403).json({ error: 'Access denied', path: docPath });
    return;
  }

  // 获取请求体内容
  const content = req.body;
  if (typeof content !== 'string') {
    res.status(400).json({ error: 'Content must be a string (text/plain)' });
    return;
  }

  try {
    // 获取安全的绝对路径
    const absolutePath = getSafeAbsolutePath(docPath);
    if (!absolutePath) {
      res.status(400).json({ error: 'Invalid document path' });
      return;
    }

    // 写入文件
    const { writeFileSync } = await import('fs');
    writeFileSync(absolutePath, content, 'utf-8');

    // 更新索引
    const { updateDocumentIndex } = await import('../services/workspace-service.js');
    await updateDocumentIndex(docPath);

    // Git commit（可选，根据配置）
    try {
      const { default: simpleGit } = await import('simple-git');
      const git = simpleGit(config.repositoryRoot);
      await git.add(docPath);
      await git.commit(`[Editor] Update ${docPath}`, [docPath]);
    } catch (gitError) {
      console.warn('[ADL] Git commit failed (continuing anyway):', gitError);
    }

    res.json({ success: true, path: docPath });
  } catch (error) {
    console.error('[ADL] Failed to save document:', error);
    res.status(500).json({ error: 'Failed to save document', details: String(error) });
  }
});

/**
 * GET /api/adl/block/:anchor
 * 获取指定 Anchor 的 Block（完整内容）
 * 
 * Phase 1.5: 这是获取 Block 完整数据的唯一正确方式
 * Query 只返回定位信息，如需完整数据必须通过这个接口
 * Phase 2: 需要认证 + 路径权限
 */
router.get('/block/:anchor', requireAuth, requirePathAccess, (req: Request, res: Response) => {
  const { anchor } = req.params;
  const { path: docPath } = req.query;

  if (!docPath || typeof docPath !== 'string') {
    res.status(400).json({ error: 'Missing document path' });
    return;
  }

  // Phase 2: 检查访问权限
  if (!canAccessDocument(req.user!, docPath)) {
    res.status(403).json({ error: 'Access denied', path: docPath });
    return;
  }

  // Phase 1.5: 使用 Registry 获取文档
  const content = getDocument(docPath);

  if (!content) {
    res.status(404).json({ error: 'Document not found', path: docPath });
    return;
  }

  const block = findBlockByAnchor(content.document, anchor);

  if (!block) {
    res.status(404).json({ error: 'Block not found', anchor });
    return;
  }

  res.json(block);
});

/**
 * GET /api/adl/proposals
 * 列出所有提案
 * 
 * Phase 2: 需要认证
 */
router.get('/proposals', requireAuth, (req: Request, res: Response) => {
  try {
    const proposals = listProposals();

    // Phase 2: 过滤用户可访问的 proposals（按 target_file 权限）
    const filteredProposals = proposals.filter(p =>
      checkPathPermission(req.user!, p.target_file)
    );

    res.json({ proposals: filteredProposals });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list proposals', details: String(error) });
  }
});

/**
 * POST /api/adl/proposal
 * 创建变更提案（持久化到文件）
 * 
 * Phase 2: 需要认证 + 提案创建权限 + 目标文件路径权限
 */
router.post('/proposal', requireAuth, requireProposalCreate, requirePathAccess, (req: Request, res: Response) => {
  try {
    const proposalData = req.body as Omit<Proposal, 'id' | 'status'>;

    // Phase 2: 验证目标文件的访问权限
    if (!canAccessDocument(req.user!, proposalData.target_file)) {
      res.status(403).json({ error: 'Access denied to target file', path: proposalData.target_file });
      return;
    }

    // 自动填充 proposed_by（如果未提供）
    const enrichedProposalData = {
      ...proposalData,
      proposed_by: proposalData.proposed_by || req.user!.id,
    };

    const proposal = createProposal(enrichedProposalData);

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
 * 
 * Phase 2: 需要认证 + 目标文件路径权限
 */
router.get('/proposal/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }

  // Phase 2: 检查目标文件的访问权限
  if (!checkPathPermission(req.user!, proposal.target_file)) {
    res.status(403).json({ error: 'Access denied', path: proposal.target_file });
    return;
  }

  res.json(proposal);
});

/**
 * POST /api/adl/proposal/:id/validate
 * 校验提案
 * 
 * Phase 2: 需要认证 + 移除 repositoryRoot 参数
 */
router.post('/proposal/:id/validate', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }

  // Phase 2: 检查目标文件的访问权限
  if (!checkPathPermission(req.user!, proposal.target_file)) {
    res.status(403).json({ error: 'Access denied', path: proposal.target_file });
    return;
  }

  // 动态导入 validator
  const { validateProposal } = await import('../adl/validator.js');
  const result = validateProposal(proposal);

  res.json(result);
});

/**
 * POST /api/adl/proposal/:id/execute
 * 执行提案
 * 
 * Phase 2: 需要认证 + 执行权限 + 移除 repositoryRoot 参数
 */
router.post('/proposal/:id/execute', requireAuth, requireProposalExecute, async (req: Request, res: Response) => {
  const { id } = req.params;
  const proposal = getProposal(id);

  if (!proposal) {
    res.status(404).json({ error: 'Proposal not found', id });
    return;
  }

  // Phase 2: 检查目标文件的访问权限
  if (!checkPathPermission(req.user!, proposal.target_file)) {
    res.status(403).json({ error: 'Access denied', path: proposal.target_file });
    return;
  }

  if (proposal.status !== 'pending') {
    res.status(400).json({ error: 'Proposal already processed', status: proposal.status });
    return;
  }

  try {
    // 动态导入 executor（Phase 2: 不再传 repositoryRoot）
    const { executeProposal } = await import('../adl/executor.js');
    const result = await executeProposal(proposal);

    // 更新 proposal 状态（持久化）
    updateProposal(id, {
      status: result.success ? 'executed' : 'rejected'
    });

    // 如果执行成功，更新 Workspace 索引和 Blocks 索引
    if (result.success) {
      await updateDocumentIndex(proposal.target_file);
      // Phase 2.1: 使用增量更新（只重建单文档）
      await updateBlocksIndexForDocument(proposal.target_file);
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
 * 
 * Phase 2: 需要认证 + 结果按可见域过滤
 */
router.post('/query', requireAuth, async (req: Request, res: Response) => {
  try {
    const query = req.body as Query;
    const result = await executeQuery(query);

    // Phase 2: 按用户可见域过滤查询结果
    const filteredResults = result.results.filter(r =>
      checkPathPermission(req.user!, r.document)
    );

    res.json({
      ...result,
      results: filteredResults,
      count: filteredResults.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute query', details: String(error) });
  }
});

// ============================================================
// Entity Index API - Phase 3.2: 关系型文档
// ============================================================

/**
 * POST /api/adl/resolve-refs
 * 批量解析引用并提取字段
 * 
 * 用于 entity_index 类型的文档渲染
 * 输入: { refs: [{ ref: "path/to/doc.md#anchor" }, ...] }
 * 输出: { entities: [{ ref, data: { display_name, status, ... } }, ...] }
 */
router.post('/resolve-refs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { refs } = req.body as { refs: Array<{ ref: string }> };

    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Missing refs array' });
      return;
    }

    const entities: Array<{
      ref: string;
      resolved: boolean;
      data?: {
        id: string;
        type: string;
        title: string;
        display_name?: string;
        status: string;
        identity?: {
          emails?: string[];
          phones?: string[];
        };
        documentPath: string;
        anchor: string;
        // 可以扩展更多字段
      };
      error?: string;
    }> = [];

    for (const refObj of refs) {
      const refStr = refObj.ref;

      // 解析引用格式: "path/to/doc.md#anchor"
      const hashIndex = refStr.lastIndexOf('#');
      if (hashIndex === -1) {
        entities.push({ ref: refStr, resolved: false, error: 'Invalid ref format (missing #anchor)' });
        continue;
      }

      const docPath = refStr.substring(0, hashIndex);
      const anchor = refStr.substring(hashIndex + 1);

      // 检查访问权限
      if (!canAccessDocument(req.user!, docPath)) {
        entities.push({ ref: refStr, resolved: false, error: 'Access denied' });
        continue;
      }

      // 获取文档
      const content = getDocument(docPath);
      if (!content) {
        entities.push({ ref: refStr, resolved: false, error: 'Document not found' });
        continue;
      }

      // 查找 block
      const block = findBlockByAnchor(content.document, anchor);
      if (!block) {
        entities.push({ ref: refStr, resolved: false, error: 'Block not found' });
        continue;
      }

      // 提取关键字段
      const machine = block.machine;
      entities.push({
        ref: refStr,
        resolved: true,
        data: {
          id: machine.id as string,
          type: machine.type as string,
          title: machine.title as string,
          display_name: machine.display_name as string | undefined,
          status: machine.status as string,
          identity: machine.identity as { emails?: string[]; phones?: string[] } | undefined,
          documentPath: docPath,
          anchor: anchor,
        },
      });
    }

    res.json({ entities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve refs', details: String(error) });
  }
});

export default router;
