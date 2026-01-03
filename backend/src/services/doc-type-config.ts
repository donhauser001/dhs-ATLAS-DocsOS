/**
 * DocTypeConfig - 文档类型配置服务
 * 
 * 管理文档的本质类型定义，决定文档在系统中的角色定位。
 * 
 * 类型体系：
 * - system: 系统运行所需（用户、配置、权限）
 * - business: 业务数据记录（客户、项目、任务）
 * - content: 内容创作/知识（文章、笔记、相册）
 * 
 * 参照 label-config.ts 的注册制模式：
 * - 系统预定义类型不可删除
 * - 用户可添加自定义类型
 * - 配置存储在 .atlas/config/doc-types.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

/**
 * 文档类型分类
 */
export type DocTypeCategory = 'system' | 'business' | 'content';

/**
 * 单个文档类型定义
 */
export interface DocTypeItem {
    /** 类型标识（英文，写入文档） */
    id: string;
    /** 显示名称 */
    label: string;
    /** 类型描述 */
    description?: string;
    /** 图标（Lucide Icons） */
    icon?: string;
    /** 所属分类 */
    category: DocTypeCategory;
    /** 默认功能类型 */
    defaultFunction?: string;
    /** 默认显现模式 */
    defaultDisplay?: string;
    /** 是否系统类型（不可删除） */
    isSystem?: boolean;
}

/**
 * 文档类型分组
 */
export interface DocTypeGroup {
    /** 分组 ID */
    id: DocTypeCategory;
    /** 分组名称 */
    label: string;
    /** 分组描述 */
    description: string;
    /** 类型列表 */
    items: DocTypeItem[];
}

/**
 * 完整的文档类型配置
 */
export interface DocTypeConfig {
    /** 版本 */
    version: string;
    /** 最后更新时间 */
    updatedAt: string;
    /** 类型分组 */
    groups: DocTypeGroup[];
}

// ============================================================
// 系统预定义类型
// ============================================================

const SYSTEM_DOC_TYPES: DocTypeConfig = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    groups: [
        {
            id: 'system',
            label: '系统文档',
            description: '系统运行所需的配置和数据',
            items: [
                {
                    id: 'user',
                    label: '用户',
                    description: '系统用户账户',
                    icon: 'user',
                    category: 'system',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.form',
                    isSystem: true,
                },
                {
                    id: 'config',
                    label: '配置',
                    description: '系统配置项',
                    icon: 'settings',
                    category: 'system',
                    defaultFunction: 'config',
                    defaultDisplay: 'detail.form',
                    isSystem: true,
                },
                {
                    id: 'template',
                    label: '模板',
                    description: '可复用的文档模板',
                    icon: 'file-plus',
                    category: 'system',
                    defaultFunction: 'template',
                    defaultDisplay: 'article.single',
                    isSystem: true,
                },
            ],
        },
        {
            id: 'business',
            label: '业务文档',
            description: '业务数据和记录',
            items: [
                {
                    id: 'client',
                    label: '客户',
                    description: '客户/公司档案',
                    icon: 'building',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.card',
                    isSystem: true,
                },
                {
                    id: 'contact',
                    label: '联系人',
                    description: '联系人信息',
                    icon: 'user',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.card',
                    isSystem: true,
                },
                {
                    id: 'project',
                    label: '项目',
                    description: '项目管理',
                    icon: 'folder',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.card',
                    isSystem: true,
                },
                {
                    id: 'task',
                    label: '任务',
                    description: '待办任务',
                    icon: 'check-square',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.form',
                    isSystem: true,
                },
                {
                    id: 'record',
                    label: '记录',
                    description: '业务流水记录',
                    icon: 'file-text',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.form',
                    isSystem: true,
                },
                {
                    id: 'event',
                    label: '事件',
                    description: '日程/会议/提醒',
                    icon: 'calendar',
                    category: 'business',
                    defaultFunction: 'entity_detail',
                    defaultDisplay: 'detail.form',
                    isSystem: true,
                },
            ],
        },
        {
            id: 'content',
            label: '内容文档',
            description: '内容创作和知识管理',
            items: [
                {
                    id: 'article',
                    label: '文章',
                    description: '长文本内容',
                    icon: 'file-text',
                    category: 'content',
                    defaultFunction: 'article',
                    defaultDisplay: 'article.single',
                    isSystem: true,
                },
                {
                    id: 'note',
                    label: '笔记',
                    description: '知识记录',
                    icon: 'sticky-note',
                    category: 'content',
                    defaultFunction: 'wiki',
                    defaultDisplay: 'article.double',
                    isSystem: true,
                },
                {
                    id: 'album',
                    label: '相册',
                    description: '图片集合',
                    icon: 'images',
                    category: 'content',
                    defaultFunction: 'gallery',
                    defaultDisplay: 'gallery.masonry',
                    isSystem: true,
                },
                {
                    id: 'collection',
                    label: '集合',
                    description: '内容聚合',
                    icon: 'folder-open',
                    category: 'content',
                    defaultFunction: 'entity_list',
                    defaultDisplay: 'list.card',
                    isSystem: true,
                },
            ],
        },
    ],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'doc-types.json');

// ============================================================
// 缓存
// ============================================================

let typeCache: Map<string, DocTypeItem> | null = null;

// ============================================================
// 服务实现
// ============================================================

/**
 * 确保配置目录存在
 */
function ensureConfigDir(): void {
    const dir = dirname(CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

/**
 * 获取文档类型配置
 */
export function getDocTypeConfig(): DocTypeConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_PATH)) {
        saveDocTypeConfig(SYSTEM_DOC_TYPES);
        return SYSTEM_DOC_TYPES;
    }

    try {
        const content = readFileSync(CONFIG_PATH, 'utf-8');
        const userConfig = JSON.parse(content) as DocTypeConfig;
        return mergeWithSystemTypes(userConfig);
    } catch (error) {
        console.error('[DocTypeConfig] Failed to read config:', error);
        return SYSTEM_DOC_TYPES;
    }
}

/**
 * 保存文档类型配置
 */
export function saveDocTypeConfig(configData: DocTypeConfig): void {
    ensureConfigDir();
    configData.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    clearTypeCache();
    console.log(`[DocTypeConfig] Saved: ${countTypes(configData)} types`);
}

/**
 * 合并用户配置与系统类型
 */
function mergeWithSystemTypes(userConfig: DocTypeConfig): DocTypeConfig {
    const merged: DocTypeConfig = {
        version: userConfig.version || SYSTEM_DOC_TYPES.version,
        updatedAt: userConfig.updatedAt || new Date().toISOString(),
        groups: [],
    };

    // 合并系统分组
    for (const sysGroup of SYSTEM_DOC_TYPES.groups) {
        const userGroup = userConfig.groups.find(g => g.id === sysGroup.id);

        if (userGroup) {
            // 合并系统类型的用户修改
            const mergedItems = sysGroup.items.map(sysItem => {
                const userItem = userGroup.items.find(i => i.id === sysItem.id);
                return userItem ? {
                    ...sysItem,
                    label: userItem.label || sysItem.label,
                    description: userItem.description || sysItem.description,
                    icon: userItem.icon || sysItem.icon,
                    defaultFunction: userItem.defaultFunction || sysItem.defaultFunction,
                    defaultDisplay: userItem.defaultDisplay || sysItem.defaultDisplay,
                } : sysItem;
            });

            // 添加用户自定义类型
            for (const userItem of userGroup.items) {
                if (!sysGroup.items.find(i => i.id === userItem.id)) {
                    mergedItems.push(userItem);
                }
            }

            merged.groups.push({
                ...sysGroup,
                items: mergedItems,
            });
        } else {
            merged.groups.push(sysGroup);
        }
    }

    // 添加用户自定义分组（理论上不应该有，因为分类是固定的三种）
    for (const userGroup of userConfig.groups) {
        if (!merged.groups.find(g => g.id === userGroup.id)) {
            merged.groups.push(userGroup);
        }
    }

    return merged;
}

/**
 * 统计类型数量
 */
function countTypes(configData: DocTypeConfig): number {
    return configData.groups.reduce((sum, group) => sum + group.items.length, 0);
}

// ============================================================
// 类型查询 API
// ============================================================

/**
 * 构建缓存
 */
function buildCache(): Map<string, DocTypeItem> {
    if (typeCache) return typeCache;

    const configData = getDocTypeConfig();
    const cache = new Map<string, DocTypeItem>();

    for (const group of configData.groups) {
        for (const item of group.items) {
            cache.set(item.id, item);
        }
    }

    typeCache = cache;
    return cache;
}

/**
 * 清除缓存
 */
export function clearTypeCache(): void {
    typeCache = null;
}

/**
 * 根据 ID 获取文档类型
 */
export function getDocType(id: string): DocTypeItem | null {
    const cache = buildCache();
    return cache.get(id) || null;
}

/**
 * 获取类型的显示名称
 */
export function getDocTypeLabel(id: string): string {
    const item = getDocType(id);
    return item?.label || id;
}

/**
 * 获取类型的图标
 */
export function getDocTypeIcon(id: string): string | undefined {
    const item = getDocType(id);
    return item?.icon;
}

/**
 * 获取类型的默认功能
 */
export function getDocTypeDefaultFunction(id: string): string | undefined {
    const item = getDocType(id);
    return item?.defaultFunction;
}

/**
 * 获取类型的默认显现模式
 */
export function getDocTypeDefaultDisplay(id: string): string | undefined {
    const item = getDocType(id);
    return item?.defaultDisplay;
}

/**
 * 获取所有类型（按分类）
 */
export function getAllDocTypes(): DocTypeItem[] {
    const configData = getDocTypeConfig();
    return configData.groups.flatMap(g => g.items);
}

/**
 * 按分类获取类型
 */
export function getDocTypesByCategory(category: DocTypeCategory): DocTypeItem[] {
    const configData = getDocTypeConfig();
    const group = configData.groups.find(g => g.id === category);
    return group?.items || [];
}

// ============================================================
// 类型管理 API
// ============================================================

/**
 * 添加自定义类型
 */
export function addDocType(item: Omit<DocTypeItem, 'isSystem'>): DocTypeItem {
    const configData = getDocTypeConfig();

    // 验证 ID 格式
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.id)) {
        throw new Error(`Invalid type ID format: ${item.id}`);
    }

    // 检查 ID 冲突
    const cache = buildCache();
    if (cache.has(item.id)) {
        throw new Error(`Document type ${item.id} already exists`);
    }

    // 找到对应分类
    const group = configData.groups.find(g => g.id === item.category);
    if (!group) {
        throw new Error(`Invalid category: ${item.category}`);
    }

    const newItem: DocTypeItem = {
        ...item,
        isSystem: false,
    };

    group.items.push(newItem);
    saveDocTypeConfig(configData);

    return newItem;
}

/**
 * 更新类型
 */
export function updateDocType(
    id: string,
    updates: Partial<Omit<DocTypeItem, 'id' | 'category' | 'isSystem'>>
): DocTypeItem {
    const configData = getDocTypeConfig();

    for (const group of configData.groups) {
        const item = group.items.find(i => i.id === id);
        if (item) {
            if (updates.label !== undefined) item.label = updates.label;
            if (updates.description !== undefined) item.description = updates.description;
            if (updates.icon !== undefined) item.icon = updates.icon;
            if (updates.defaultFunction !== undefined) item.defaultFunction = updates.defaultFunction;
            if (updates.defaultDisplay !== undefined) item.defaultDisplay = updates.defaultDisplay;

            saveDocTypeConfig(configData);
            return item;
        }
    }

    throw new Error(`Document type ${id} not found`);
}

/**
 * 删除类型（只能删除非系统类型）
 */
export function deleteDocType(id: string): void {
    const configData = getDocTypeConfig();

    for (const group of configData.groups) {
        const index = group.items.findIndex(i => i.id === id);
        if (index !== -1) {
            if (group.items[index].isSystem) {
                throw new Error(`Cannot delete system type ${id}`);
            }
            group.items.splice(index, 1);
            saveDocTypeConfig(configData);
            return;
        }
    }

    throw new Error(`Document type ${id} not found`);
}

export default {
    getDocTypeConfig,
    saveDocTypeConfig,
    getDocType,
    getDocTypeLabel,
    getDocTypeIcon,
    getDocTypeDefaultFunction,
    getDocTypeDefaultDisplay,
    getAllDocTypes,
    getDocTypesByCategory,
    clearTypeCache,
    addDocType,
    updateDocType,
    deleteDocType,
};

