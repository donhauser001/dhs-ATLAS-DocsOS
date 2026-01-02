/**
 * Auto-Complete API - 自动补齐 API 客户端
 * 
 * Phase 3.5: 固定键系统
 */

// ============================================================
// 类型定义
// ============================================================

export interface AutoCompleteChange {
  type: 'frontmatter' | 'block';
  key: string;
  oldValue: unknown;
  newValue: unknown;
  reason: string;
  blockAnchor?: string;
}

export interface MissingField {
  key: string;
  label: string;
  suggestedValue: unknown;
  reason: string;
  category: 'structural' | 'metadata' | 'function';
  blockAnchor?: string;
}

export interface AutoCompletePreviewResult {
  path: string;
  missingFields: MissingField[];
  suggestedChanges: AutoCompleteChange[];
  totalMissing: number;
}

export interface AutoCompleteApplyResult {
  path: string;
  changes: AutoCompleteChange[];
  message: string;
}

export interface AutoCompleteAllResult {
  totalDocuments: number;
  documentsNeedingUpdate: number;
  totalChanges: number;
  applied: boolean;
  documents: Array<{
    path: string;
    totalChanges: number;
    changes?: Array<{
      key: string;
      newValue: unknown;
      reason: string;
    }>;
  }>;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 预览自动补齐
 * 返回将要进行的变更，不实际修改文件
 */
export async function previewAutoComplete(path: string): Promise<AutoCompletePreviewResult> {
  const response = await fetch('/api/documents/auto-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to preview auto-complete');
  }

  return response.json();
}

/**
 * 应用自动补齐
 * 实际修改文件
 */
export async function applyAutoComplete(path: string): Promise<AutoCompleteApplyResult> {
  const response = await fetch('/api/documents/auto-complete/apply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to apply auto-complete');
  }

  return response.json();
}

/**
 * 获取文档的缺失字段
 */
export async function getMissingFields(path: string): Promise<{
  path: string;
  missingFields: MissingField[];
  total: number;
}> {
  const response = await fetch(`/api/documents/${encodeURIComponent(path)}/missing-fields`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get missing fields');
  }

  return response.json();
}

/**
 * 批量预览/应用自动补齐
 */
export async function autoCompleteAll(apply: boolean = false): Promise<AutoCompleteAllResult> {
  const response = await fetch('/api/documents/auto-complete-all', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apply }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to auto-complete all');
  }

  return response.json();
}

