/**
 * Labels API 客户端 - 系统级标签管理
 * 
 * 核心原则：
 * - 原始名（key）：写入文档的字段名
 * - 映射名（label）：界面显示的友好名称
 */

const API_BASE = '/api/labels';

// ============================================================
// 类型定义
// ============================================================

export interface LabelItem {
  /** 原始名（英文，写入文档） */
  key: string;
  /** 映射名（显示名称） */
  label: string;
  /** 图标名称（Lucide Icons） */
  icon?: string;
  /** 颜色 */
  color?: string;
  /** 描述 */
  description?: string;
  /** 是否系统标签 */
  isSystem?: boolean;
}

export interface LabelCategory {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  items: LabelItem[];
}

export interface LabelConfig {
  version: string;
  updatedAt: string;
  categories: LabelCategory[];
  hiddenFields: string[];
}

export interface ResolvedLabel {
  key: string;
  label: string;
  icon?: string;
  color?: string;
  hidden: boolean;
}

// ============================================================
// 查询 API
// ============================================================

/**
 * 获取完整标签配置
 */
export async function fetchLabelConfig(): Promise<LabelConfig> {
  const res = await fetch(API_BASE, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch label config: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * 解析单个标签
 */
export async function resolveLabel(key: string): Promise<ResolvedLabel> {
  const res = await fetch(`${API_BASE}/resolve/${encodeURIComponent(key)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to resolve label: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * 批量解析标签
 */
export async function resolveLabels(keys: string[]): Promise<Record<string, ResolvedLabel>> {
  const res = await fetch(`${API_BASE}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ keys }),
  });
  if (!res.ok) {
    throw new Error(`Failed to resolve labels: ${res.statusText}`);
  }
  const data = await res.json();
  return data.data;
}

// ============================================================
// 分类管理 API
// ============================================================

/**
 * 添加分类
 */
export async function addCategory(id: string, name: string, description?: string): Promise<LabelCategory> {
  const res = await fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, name, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add category');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 更新分类
 */
export async function updateCategory(id: string, name?: string, description?: string): Promise<LabelCategory> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update category');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 删除分类
 */
export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/categories/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete category');
  }
}

// ============================================================
// 标签管理 API
// ============================================================

/**
 * 添加标签
 */
export async function addLabelItem(
  categoryId: string,
  item: Omit<LabelItem, 'isSystem'>
): Promise<LabelItem> {
  const res = await fetch(`${API_BASE}/items/${categoryId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to add label');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 更新标签
 */
export async function updateLabelItem(
  key: string,
  updates: Partial<Omit<LabelItem, 'key' | 'isSystem'>>
): Promise<LabelItem> {
  const res = await fetch(`${API_BASE}/items/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update label');
  }
  const data = await res.json();
  return data.data;
}

/**
 * 删除标签
 */
export async function deleteLabelItem(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/items/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete label');
  }
}
