/**
 * Proposal Store - 提案持久化存储
 * 
 * Phase 0.5: 从内存 Map 改为文件存储
 * 存储位置: repository/.atlas/proposals/<id>.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import type { Proposal } from './types.js';

// 确保目录存在
ensureDirectories();

/**
 * 生成 Proposal ID
 */
export function generateProposalId(): string {
  return `PROP-${Date.now()}`;
}

/**
 * 获取 Proposal 文件路径
 */
function getProposalPath(id: string): string {
  return join(config.proposalsDir, `${id}.json`);
}

/**
 * 保存 Proposal
 */
export function saveProposal(proposal: Proposal): void {
  const filePath = getProposalPath(proposal.id);
  const data = {
    ...proposal,
    _meta: {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 获取 Proposal
 */
export function getProposal(id: string): Proposal | null {
  const filePath = getProposalPath(id);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    // 移除 _meta 字段返回纯 Proposal
    const { _meta, ...proposal } = data;
    return proposal as Proposal;
  } catch {
    return null;
  }
}

/**
 * 更新 Proposal
 */
export function updateProposal(id: string, updates: Partial<Proposal>): Proposal | null {
  const existing = getProposal(id);
  
  if (!existing) {
    return null;
  }
  
  const updated: Proposal = {
    ...existing,
    ...updates,
    id: existing.id, // 确保 ID 不被覆盖
  };
  
  const filePath = getProposalPath(id);
  const data = {
    ...updated,
    _meta: {
      created_at: getProposalMeta(id)?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return updated;
}

/**
 * 获取 Proposal 元数据
 */
function getProposalMeta(id: string): { created_at: string; updated_at: string } | null {
  const filePath = getProposalPath(id);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    return data._meta || null;
  } catch {
    return null;
  }
}

/**
 * 删除 Proposal
 */
export function deleteProposal(id: string): boolean {
  const filePath = getProposalPath(id);
  
  if (!existsSync(filePath)) {
    return false;
  }
  
  try {
    unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 列出所有 Proposal
 */
export function listProposals(): Proposal[] {
  if (!existsSync(config.proposalsDir)) {
    return [];
  }
  
  const files = readdirSync(config.proposalsDir)
    .filter(f => f.endsWith('.json'));
  
  const proposals: Proposal[] = [];
  
  for (const file of files) {
    const id = file.replace('.json', '');
    const proposal = getProposal(id);
    if (proposal) {
      proposals.push(proposal);
    }
  }
  
  // 按创建时间排序（最新的在前）
  return proposals.sort((a, b) => {
    const aId = parseInt(a.id.replace('PROP-', ''), 10);
    const bId = parseInt(b.id.replace('PROP-', ''), 10);
    return bId - aId;
  });
}

/**
 * 创建新 Proposal
 */
export function createProposal(data: Omit<Proposal, 'id' | 'status'>): Proposal {
  const id = generateProposalId();
  
  const proposal: Proposal = {
    ...data,
    id,
    status: 'pending',
  };
  
  saveProposal(proposal);
  return proposal;
}

