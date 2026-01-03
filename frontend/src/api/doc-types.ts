/**
 * 文档类型 API 客户端
 */

const API_BASE = '/api/doc-types';

// ============================================================
// 类型定义
// ============================================================

export type DocTypeCategory = 'system' | 'business' | 'content';

export interface DocTypeItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: DocTypeCategory;
    defaultFunction?: string;
    defaultDisplay?: string;
    isSystem?: boolean;
}

export interface DocTypeGroup {
    id: DocTypeCategory;
    label: string;
    description: string;
    items: DocTypeItem[];
}

export interface DocTypeConfig {
    version: string;
    updatedAt: string;
    groups: DocTypeGroup[];
}

// ============================================================
// 查询 API
// ============================================================

/**
 * 获取完整配置
 */
export async function fetchDocTypeConfig(): Promise<DocTypeConfig> {
    const res = await fetch(API_BASE, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch doc type config: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
}

/**
 * 获取所有类型（扁平列表）
 */
export async function fetchAllDocTypes(): Promise<DocTypeItem[]> {
    const res = await fetch(`${API_BASE}/all`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch doc types: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
}

/**
 * 按分类获取类型
 */
export async function fetchDocTypesByCategory(category: DocTypeCategory): Promise<DocTypeItem[]> {
    const res = await fetch(`${API_BASE}/category/${category}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch doc types: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
}

/**
 * 获取单个类型
 */
export async function fetchDocType(id: string): Promise<DocTypeItem> {
    const res = await fetch(`${API_BASE}/type/${encodeURIComponent(id)}`, {
        credentials: 'include',
    });
    if (!res.ok) {
        throw new Error(`Failed to fetch doc type: ${res.statusText}`);
    }
    const data = await res.json();
    return data.data;
}

// ============================================================
// 管理 API
// ============================================================

/**
 * 添加类型
 */
export async function addDocType(item: Omit<DocTypeItem, 'isSystem'>): Promise<DocTypeItem> {
    const res = await fetch(`${API_BASE}/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add doc type');
    }
    const data = await res.json();
    return data.data;
}

/**
 * 更新类型
 */
export async function updateDocType(
    id: string,
    updates: Partial<Omit<DocTypeItem, 'id' | 'category' | 'isSystem'>>
): Promise<DocTypeItem> {
    const res = await fetch(`${API_BASE}/types/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update doc type');
    }
    const data = await res.json();
    return data.data;
}

/**
 * 删除类型
 */
export async function deleteDocType(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/types/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete doc type');
    }
}

