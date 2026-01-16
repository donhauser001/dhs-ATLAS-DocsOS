/**
 * Workspace API 客户端
 */

const API_BASE = '/api/workspace';

// ============================================================
// 类型定义
// ============================================================

export interface DocumentInfo {
  path: string;
  title: string;
  document_type: string;
  block_count: number;
  anchors: string[];
  types: string[];
  refs?: Record<string, string | string[]>;
  modified_at: string;
}

export interface DirectoryInfo {
  path: string;
  name: string;
  description?: string;
  document_count: number;
}

export interface WorkspaceIndex {
  version: string;
  generated_at: string;
  documents: DocumentInfo[];
  directories: DirectoryInfo[];
  stats: {
    total_documents: number;
    total_blocks: number;
    total_anchors: number;
  };
}

export interface TreeNode {
  name: string;
  type: 'directory' | 'document';
  path?: string;
  slug?: string;
  children?: TreeNode[];
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取 Workspace 索引
 */
export async function fetchWorkspaceIndex(): Promise<WorkspaceIndex> {
  const res = await fetch(`${API_BASE}/index`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch workspace index: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 获取目录树
 */
export async function fetchWorkspaceTree(): Promise<TreeNode[]> {
  const res = await fetch(`${API_BASE}/tree`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch workspace tree: ${res.statusText}`);
  }
  const data = await res.json();
  return data.tree;
}

/**
 * 重建索引（仅 Workspace）
 */
export async function rebuildWorkspaceIndex(): Promise<{ success: boolean; stats: WorkspaceIndex['stats'] }> {
  const res = await fetch(`${API_BASE}/rebuild`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to rebuild workspace index: ${res.statusText}`);
  }
  return res.json();
}

/**
 * 全局重建索引
 * 
 * Phase 3.3: 「双向奔赴」原则
 * 调用 /api/functions/rebuild 会：
 * 1. 重建 WorkspaceIndex（发现新/移动的文档）
 * 2. 刷新 Registry（更新 knownPaths）
 * 3. 重建 FunctionRegistry（更新功能索引）
 * 
 * 适用于文档移动后需要系统重新发现的场景
 */
export async function rebuildGlobalIndex(): Promise<{
  success: boolean;
  message: string;
  data: {
    functions: Record<string, { count: number }>;
    navigation: { sidebar: Array<{ path: string; label: string }> };
  };
}> {
  const res = await fetch('/api/functions/rebuild', {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to rebuild global index: ${res.statusText}`);
  }
  return res.json();
}

