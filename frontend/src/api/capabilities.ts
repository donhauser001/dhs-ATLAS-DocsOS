/**
 * 能力类型 API 客户端
 */

const API_BASE = '/api/capabilities';

export type CapabilityCategory = 
    | 'data' | 'workflow' | 'time' | 'tracking' 
    | 'version' | 'collaboration' | 'relation' 
    | 'input' | 'output' | 'compute' | 'learning' | 'lifestyle';

export interface CapabilityItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: CapabilityCategory;
    configHints?: string[];
    isSystem?: boolean;
}

export interface CapabilityGroup {
    id: CapabilityCategory;
    label: string;
    description: string;
    items: CapabilityItem[];
}

export interface CapabilityConfig {
    version: string;
    updatedAt: string;
    groups: CapabilityGroup[];
}

export async function fetchCapabilityConfig(): Promise<CapabilityConfig> {
    const res = await fetch(API_BASE, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch config: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function fetchAllCapabilities(): Promise<CapabilityItem[]> {
    const res = await fetch(`${API_BASE}/all`, { credentials: 'include' });
    if (!res.ok) throw new Error(`Failed to fetch capabilities: ${res.statusText}`);
    const data = await res.json();
    return data.data;
}

export async function addCapability(item: Omit<CapabilityItem, 'isSystem'>): Promise<CapabilityItem> {
    const res = await fetch(`${API_BASE}/capabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(item),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add capability');
    }
    const data = await res.json();
    return data.data;
}

export async function updateCapability(
    id: string,
    updates: Partial<Omit<CapabilityItem, 'id' | 'category' | 'isSystem'>>
): Promise<CapabilityItem> {
    const res = await fetch(`${API_BASE}/capabilities/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update capability');
    }
    const data = await res.json();
    return data.data;
}

export async function deleteCapability(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/capabilities/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete capability');
    }
}

