/**
 * 插件市场 API 客户端
 * 
 * Phase 4.1: 与后端插件服务交互
 */

const API_BASE = 'http://localhost:3000/api';

// ============================================================
// 类型定义
// ============================================================

/** 基础插件信息 */
export interface BasePluginInfo {
    id: string;
    pluginType: 'type-package' | 'theme-package' | 'other';
    name: string;
    version: string;
    description: string;
    author: string;
    icon: string;
    color: string;
    tags: string[];
    downloads: number;
    rating: number;
    installed: boolean;
    isOfficial: boolean;
    updatedAt: string;
}

/** 类型包信息 */
export interface TypePackageInfo extends BasePluginInfo {
    pluginType: 'type-package';
    category: string;
    subcategory?: string;
    defaultFunction?: string;
    defaultDisplay?: string;
    blocksCount: number;
}

/** 主题包信息 */
export interface ThemePackageInfo extends BasePluginInfo {
    pluginType: 'theme-package';
    mode: 'light' | 'dark' | 'both';
    previewColors: string[];
}

/** 其他插件信息 */
export interface OtherPluginInfo extends BasePluginInfo {
    pluginType: 'other';
    capabilities: string[];
}

export type PluginInfo = TypePackageInfo | ThemePackageInfo | OtherPluginInfo;

/** 所有插件 */
export interface AllPlugins {
    typePackages: TypePackageInfo[];
    themePackages: ThemePackageInfo[];
    extensions: OtherPluginInfo[];
}

/** 插件统计 */
export interface PluginStats {
    totalInstalled: number;
    typePackagesCount: number;
    themePackagesCount: number;
    extensionsCount: number;
}

// ============================================================
// API 客户端
// ============================================================

/**
 * 获取所有插件
 */
export async function getAllPlugins(): Promise<AllPlugins> {
    const response = await fetch(`${API_BASE}/plugins`);
    if (!response.ok) {
        throw new Error('Failed to fetch plugins');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch plugins');
    }
    return result.data;
}

/**
 * 获取插件统计
 */
export async function getPluginStats(): Promise<PluginStats> {
    const response = await fetch(`${API_BASE}/plugins/stats`);
    if (!response.ok) {
        throw new Error('Failed to fetch plugin stats');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch plugin stats');
    }
    return result.data;
}

/**
 * 获取所有类型包
 */
export async function getTypePackages(): Promise<TypePackageInfo[]> {
    const response = await fetch(`${API_BASE}/plugins/type-packages`);
    if (!response.ok) {
        throw new Error('Failed to fetch type packages');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch type packages');
    }
    return result.data;
}

/**
 * 按分类获取类型包
 */
export async function getTypePackagesByCategory(): Promise<Record<string, TypePackageInfo[]>> {
    const response = await fetch(`${API_BASE}/plugins/type-packages/by-category`);
    if (!response.ok) {
        throw new Error('Failed to fetch type packages by category');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch type packages by category');
    }
    return result.data;
}

/**
 * 获取所有主题包
 */
export async function getThemePackages(): Promise<ThemePackageInfo[]> {
    const response = await fetch(`${API_BASE}/plugins/theme-packages`);
    if (!response.ok) {
        throw new Error('Failed to fetch theme packages');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch theme packages');
    }
    return result.data;
}

/**
 * 获取所有扩展插件
 */
export async function getExtensions(): Promise<OtherPluginInfo[]> {
    const response = await fetch(`${API_BASE}/plugins/extensions`);
    if (!response.ok) {
        throw new Error('Failed to fetch extensions');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch extensions');
    }
    return result.data;
}

// ============================================================
// 数据块定义管理
// ============================================================

/** 数据块字段定义（新格式） */
export interface DataBlockField {
    key: string;
    label: string;
    component?: string;  // 绑定的组件 ID（新格式）
    defaultValue?: any;
    required?: boolean;
    // 兼容旧格式
    type?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    hidden?: boolean;
    readOnly?: boolean;
    description?: string;
}

/** 数据块定义（新格式：icon 直接在顶层） */
export interface DataBlockDefinition {
    id: string;
    name: string;
    description: string;
    icon?: string;       // 新格式：图标直接在顶层
    required?: boolean;
    enabled: boolean;    // 是否启用此数据块
    order?: number;
    fields: DataBlockField[];
    // 兼容旧格式
    display?: {
        icon?: string;
        color?: string;
        default_expanded?: boolean;
    };
}

/**
 * 获取类型包的数据块定义
 */
export async function getTypePackageBlocks(packageId: string): Promise<DataBlockDefinition[]> {
    // 添加时间戳防止缓存
    const timestamp = Date.now();
    const response = await fetch(
        `${API_BASE}/plugins/type-packages/${encodeURIComponent(packageId)}/blocks?_t=${timestamp}`,
        { cache: 'no-store' }
    );
    if (!response.ok) {
        throw new Error('Failed to fetch blocks');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch blocks');
    }
    return result.data;
}

/**
 * 更新数据块定义（保存到 JSON）
 */
export async function updateDataBlock(
    packageId: string,
    blockId: string,
    updates: Partial<DataBlockDefinition>
): Promise<void> {
    const response = await fetch(
        `${API_BASE}/plugins/type-packages/${encodeURIComponent(packageId)}/blocks/${encodeURIComponent(blockId)}`,
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }
    );
    if (!response.ok) {
        throw new Error('Failed to update block');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to update block');
    }
}

/**
 * 恢复单个数据块到初始状态
 */
export async function resetDataBlock(
    packageId: string,
    blockId: string
): Promise<void> {
    const response = await fetch(
        `${API_BASE}/plugins/type-packages/${encodeURIComponent(packageId)}/blocks/${encodeURIComponent(blockId)}/reset`,
        { method: 'POST' }
    );
    if (!response.ok) {
        throw new Error('Failed to reset block');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to reset block');
    }
}

/**
 * 恢复类型包所有数据块到初始状态
 */
export async function resetAllDataBlocks(packageId: string): Promise<string> {
    const response = await fetch(
        `${API_BASE}/plugins/type-packages/${encodeURIComponent(packageId)}/reset-all`,
        { method: 'POST' }
    );
    if (!response.ok) {
        throw new Error('Failed to reset blocks');
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Failed to reset blocks');
    }
    return result.message;
}

