/**
 * ADL API 客户端
 */

// 从统一类型定义导入
export type { Block, MachineBlock, ADLDocument, Frontmatter } from '@/types/adl';
import type { Block, MachineBlock, ADLDocument } from '@/types/adl';

const API_BASE = '/api/adl';

/**
 * Proposal - 变更提案
 * 
 * Phase 1.5: 升级为「可审计的认知行为」
 */
export interface Proposal {
  id: string;
  proposed_by: string;
  proposed_at: string;
  target_file: string;
  
  // 认知语义（Phase 1.5 新增）
  /** 变更原因 - 必填 */
  reason: string;
  /** 来源上下文 - 可选 */
  source_context?: string;
  
  ops: Operation[];
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

export type Operation = UpdateYamlOp | InsertBlockOp | AppendEventOp | UpdateBodyOp;

export interface UpdateYamlOp {
  op: 'update_yaml';
  anchor: string;
  path: string;
  value: unknown;
  old_value?: unknown;
}

export interface InsertBlockOp {
  op: 'insert_block';
  after: string;
  block: {
    heading: string;
    machine: MachineBlock;
    body: string;
  };
}

export interface AppendEventOp {
  op: 'append_event';
  after: string;
  event: MachineBlock;
}

export interface UpdateBodyOp {
  op: 'update_body';
  anchor: string;
  body: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    op_index: number;
    rule: string;
    message: string;
  }>;
}

export interface ExecuteResult {
  success: boolean;
  commit_hash?: string;
  error?: string;
}

/**
 * 获取并解析 ADL 文档
 */
export async function fetchDocument(path: string): Promise<ADLDocument> {
  const res = await fetch(`${API_BASE}/document?path=${encodeURIComponent(path)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 获取指定 Block
 */
export async function fetchBlock(anchor: string, docPath: string): Promise<Block> {
  const res = await fetch(`${API_BASE}/block/${anchor}?path=${encodeURIComponent(docPath)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch block: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 创建 Proposal
 */
export async function createProposal(proposal: Omit<Proposal, 'id' | 'status'>): Promise<{ success: boolean; proposal_id: string; proposal: Proposal }> {
  const res = await fetch(`${API_BASE}/proposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proposal),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to create proposal: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 校验 Proposal
 */
export async function validateProposal(proposalId: string): Promise<ValidationResult> {
  const res = await fetch(`${API_BASE}/proposal/${proposalId}/validate`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to validate proposal: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 执行 Proposal
 */
export async function executeProposal(proposalId: string): Promise<ExecuteResult> {
  const res = await fetch(`${API_BASE}/proposal/${proposalId}/execute`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to execute proposal: ${res.statusText}`);
  }
  return res.json();
}

// ============================================================
// Entity Index API - Phase 3.2: 关系型文档
// ============================================================

/**
 * 解析后的实体数据
 */
export interface ResolvedEntity {
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
  };
  error?: string;
}

/**
 * 批量解析引用
 * 用于 entity_index 类型的文档渲染
 */
export async function resolveRefs(refs: Array<{ ref: string }>): Promise<{ entities: ResolvedEntity[] }> {
  const res = await fetch(`${API_BASE}/resolve-refs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refs }),
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to resolve refs: ${res.statusText}`);
  }
  return res.json();
}

