/**
 * 功能类型 API 客户端
 */

const API_BASE = '/api/function-types';

export type FunctionCategory = 'list' | 'detail' | 'content' | 'planning' | 'display' | 'structure';

export interface FunctionTypeItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: FunctionCategory;
    supportedDisplays?: string[];
    isSystem?: boolean;
}

export interface FunctionTypeGroup {
    id: FunctionCategory;
    label: string;
    description: string;
    items: FunctionTypeItem[];
}

export interface FunctionTypeConfig {
    version: string;
    updatedAt: string;
    groups: FunctionTypeGroup[];
}

export async function fetchFunctionTypeConfig(): Promise<FunctionTypeConfig> {
    const res = await fetch(API_BASE, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function fetchAllFunctionTypes(): Promise<FunctionTypeItem[]> {
    const res = await fetch(`${API_BASE}/all`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch types: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function addFunctionType(item: Omit<FunctionTypeItem, 'isSystem'>): Promise<FunctionTypeItem> {
    const res = await fetch(`${API_BASE}/types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add type');
    }
    const data = await res.json();
    return data.data;
}

export async function updateFunctionType(
    id: string,
    updates: Partial<Omit<FunctionTypeItem, 'id' | 'category' | 'isSystem'>>
): Promise<FunctionTypeItem> {
    const res = await fetch(`${API_BASE}/types/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update type');
    }
    const data = await res.json();
    return data.data;
}

export async function deleteFunctionType(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/types/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete type');
    }
}

