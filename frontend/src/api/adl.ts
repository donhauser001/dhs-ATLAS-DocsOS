/**
 * ADL API 客户端
 */

const API_BASE = '/api/adl';

// ADL Types (与后端保持一致)
export interface Block {
  anchor: string;
  heading: string;
  level: number;
  machine: MachineBlock;
  body: string;
  startLine: number;
  endLine: number;
}

export interface MachineBlock {
  type: string;
  id: string;
  status: 'active' | 'archived' | 'draft';
  title: string;
  [key: string]: unknown;
}

export interface ADLDocument {
  path: string;
  frontmatter: Record<string, unknown>;
  blocks: Block[];
  raw: string;
}

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
  const res = await fetch(`${API_BASE}/document?path=${encodeURIComponent(path)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch document: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 获取指定 Block
 */
export async function fetchBlock(anchor: string, docPath: string): Promise<Block> {
  const res = await fetch(`${API_BASE}/block/${anchor}?path=${encodeURIComponent(docPath)}`);
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
  });
  if (!res.ok) {
    throw new Error(`Failed to execute proposal: ${res.statusText}`);
  }
  return res.json();
}

