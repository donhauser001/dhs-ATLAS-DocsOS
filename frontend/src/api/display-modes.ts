/**
 * 显现模式 API 客户端
 */

const API_BASE = '/api/display-modes';

export type DisplayCategory = 'list' | 'kanban' | 'calendar' | 'timeline' | 'gallery' | 'article' | 'detail' | 'structure';

export interface DisplayModeItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: DisplayCategory;
    configHints?: string[];
    isSystem?: boolean;
}

export interface DisplayModeGroup {
    id: DisplayCategory;
    label: string;
    description: string;
    items: DisplayModeItem[];
}

export interface DisplayModeConfig {
    version: string;
    updatedAt: string;
    groups: DisplayModeGroup[];
}

export async function fetchDisplayModeConfig(): Promise<DisplayModeConfig> {
    const res = await fetch(API_BASE, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function fetchAllDisplayModes(): Promise<DisplayModeItem[]> {
    const res = await fetch(`${API_BASE}/all`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch modes: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function addDisplayMode(item: Omit<DisplayModeItem, 'isSystem'>): Promise<DisplayModeItem> {
    const res = await fetch(`${API_BASE}/modes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add mode');
    }
    const data = await res.json();
    return data.data;
}

export async function updateDisplayMode(
    id: string,
    updates: Partial<Omit<DisplayModeItem, 'id' | 'category' | 'isSystem'>>
): Promise<DisplayModeItem> {
    const res = await fetch(`${API_BASE}/modes/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update mode');
    }
    const data = await res.json();
    return data.data;
}

export async function deleteDisplayMode(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/modes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete mode');
    }
}

