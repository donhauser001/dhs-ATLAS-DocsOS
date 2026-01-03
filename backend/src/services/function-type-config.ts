/**
 * FunctionTypeConfig - 功能类型配置服务
 * 
 * 管理文档的功能定义，决定文档能做什么。
 * 
 * 功能分类：
 * - 列表类：entity_list, record_list, checklist
 * - 详情类：entity_detail, profile
 * - 内容类：article, wiki, editor
 * - 计划类：calendar, timeline, planner
 * - 展示类：gallery, dashboard, kanban
 * - 结构类：tree, outliner, graph
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

export type FunctionCategory = 'list' | 'detail' | 'content' | 'planning' | 'display' | 'structure';

export interface FunctionTypeItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: FunctionCategory;
    /** 支持的显现模式 */
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

// ============================================================
// 系统预定义功能
// ============================================================

const SYSTEM_FUNCTION_TYPES: FunctionTypeConfig = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    groups: [
        {
            id: 'list',
            label: '列表类',
            description: '管理多个同类实体或记录',
            items: [
                {
                    id: 'entity_list',
                    label: '实体列表',
                    description: '管理客户、项目等实体',
                    icon: 'list',
                    category: 'list',
                    supportedDisplays: ['list.card', 'list.table', 'kanban.column'],
                    isSystem: true,
                },
                {
                    id: 'record_list',
                    label: '记录列表',
                    description: '流水账式记录',
                    icon: 'file-text',
                    category: 'list',
                    supportedDisplays: ['list.table', 'list.compact', 'calendar.heatmap'],
                    isSystem: true,
                },
                {
                    id: 'checklist',
                    label: '清单',
                    description: '可勾选的列表',
                    icon: 'check-square',
                    category: 'list',
                    supportedDisplays: ['list.compact'],
                    isSystem: true,
                },
            ],
        },
        {
            id: 'detail',
            label: '详情类',
            description: '单个实体的完整信息',
            items: [
                {
                    id: 'entity_detail',
                    label: '实体详情',
                    description: '单个实体的详细信息',
                    icon: 'file-text',
                    category: 'detail',
                    supportedDisplays: ['detail.card', 'detail.form'],
                    isSystem: true,
                },
                {
                    id: 'profile',
                    label: '档案',
                    description: '个人/对象档案',
                    icon: 'user',
                    category: 'detail',
                    supportedDisplays: ['detail.card', 'detail.form'],
                    isSystem: true,
                },
            ],
        },
        {
            id: 'content',
            label: '内容类',
            description: '长文本编辑和知识管理',
            items: [
                {
                    id: 'article',
                    label: '文章',
                    description: '长文本编辑阅读',
                    icon: 'file-text',
                    category: 'content',
                    supportedDisplays: ['article.single', 'article.double', 'article.zen'],
                    isSystem: true,
                },
                {
                    id: 'wiki',
                    label: '知识库',
                    description: '可互链的知识条目',
                    icon: 'book-open',
                    category: 'content',
                    supportedDisplays: ['article.double', 'graph.network'],
                    isSystem: true,
                },
                {
                    id: 'editor',
                    label: '编辑器',
                    description: '专注写作',
                    icon: 'edit',
                    category: 'content',
                    supportedDisplays: ['article.zen'],
                    isSystem: true,
                },
            ],
        },
        {
            id: 'planning',
            label: '计划类',
            description: '时间和计划管理',
            items: [
                {
                    id: 'calendar',
                    label: '日历',
                    description: '时间维度管理',
                    icon: 'calendar',
                    category: 'planning',
                    supportedDisplays: ['calendar.month', 'calendar.week', 'calendar.heatmap'],
                    isSystem: true,
                },
                {
                    id: 'timeline',
                    label: '时间线',
                    description: '按时间排列的事件',
                    icon: 'git-commit',
                    category: 'planning',
                    supportedDisplays: ['timeline.vertical', 'timeline.horizontal', 'timeline.gantt'],
                    isSystem: true,
                },
                {
                    id: 'planner',
                    label: '计划表',
                    description: '周期性计划',
                    icon: 'layout-grid',
                    category: 'planning',
                    supportedDisplays: ['calendar.week'],
                    isSystem: true,
                },
            ],
        },
        {
            id: 'display',
            label: '展示类',
            description: '数据可视化和展示',
            items: [
                {
                    id: 'gallery',
                    label: '画廊',
                    description: '视觉化展示',
                    icon: 'images',
                    category: 'display',
                    supportedDisplays: ['gallery.grid', 'gallery.masonry', 'gallery.shelf'],
                    isSystem: true,
                },
                {
                    id: 'dashboard',
                    label: '仪表盘',
                    description: '数据概览',
                    icon: 'layout-dashboard',
                    category: 'display',
                    supportedDisplays: ['dashboard'],
                    isSystem: true,
                },
                {
                    id: 'kanban',
                    label: '看板',
                    description: '状态流转管理',
                    icon: 'columns',
                    category: 'display',
                    supportedDisplays: ['kanban.column', 'kanban.swimlane'],
                    isSystem: true,
                },
            ],
        },
        {
            id: 'structure',
            label: '结构类',
            description: '层级和关系结构',
            items: [
                {
                    id: 'tree',
                    label: '树形',
                    description: '层级结构',
                    icon: 'git-branch',
                    category: 'structure',
                    supportedDisplays: ['tree.outline'],
                    isSystem: true,
                },
                {
                    id: 'outliner',
                    label: '大纲',
                    description: '可折叠的大纲',
                    icon: 'list-tree',
                    category: 'structure',
                    supportedDisplays: ['tree.outline', 'tree.mindmap'],
                    isSystem: true,
                },
                {
                    id: 'graph',
                    label: '图谱',
                    description: '关系网络',
                    icon: 'share-2',
                    category: 'structure',
                    supportedDisplays: ['graph.network'],
                    isSystem: true,
                },
            ],
        },
    ],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'function-types.json');

let typeCache: Map<string, FunctionTypeItem> | null = null;

// ============================================================
// 服务实现
// ============================================================

function ensureConfigDir(): void {
    const dir = dirname(CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

export function getFunctionTypeConfig(): FunctionTypeConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_PATH)) {
        saveFunctionTypeConfig(SYSTEM_FUNCTION_TYPES);
        return SYSTEM_FUNCTION_TYPES;
    }

    try {
        const content = readFileSync(CONFIG_PATH, 'utf-8');
        const userConfig = JSON.parse(content) as FunctionTypeConfig;
        return mergeWithSystemTypes(userConfig);
    } catch (error) {
        console.error('[FunctionTypeConfig] Failed to read config:', error);
        return SYSTEM_FUNCTION_TYPES;
    }
}

export function saveFunctionTypeConfig(configData: FunctionTypeConfig): void {
    ensureConfigDir();
    configData.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    clearTypeCache();
}

function mergeWithSystemTypes(userConfig: FunctionTypeConfig): FunctionTypeConfig {
    const merged: FunctionTypeConfig = {
        version: userConfig.version || SYSTEM_FUNCTION_TYPES.version,
        updatedAt: userConfig.updatedAt || new Date().toISOString(),
        groups: [],
    };

    for (const sysGroup of SYSTEM_FUNCTION_TYPES.groups) {
        const userGroup = userConfig.groups.find(g => g.id === sysGroup.id);

        if (userGroup) {
            const mergedItems = sysGroup.items.map(sysItem => {
                const userItem = userGroup.items.find(i => i.id === sysItem.id);
                return userItem ? { ...sysItem, ...userItem, isSystem: true } : sysItem;
            });

            for (const userItem of userGroup.items) {
                if (!sysGroup.items.find(i => i.id === userItem.id)) {
                    mergedItems.push(userItem);
                }
            }

            merged.groups.push({ ...sysGroup, items: mergedItems });
        } else {
            merged.groups.push(sysGroup);
        }
    }

    return merged;
}

export function clearTypeCache(): void {
    typeCache = null;
}

function buildCache(): Map<string, FunctionTypeItem> {
    if (typeCache) return typeCache;
    const configData = getFunctionTypeConfig();
    const cache = new Map<string, FunctionTypeItem>();
    for (const group of configData.groups) {
        for (const item of group.items) {
            cache.set(item.id, item);
        }
    }
    typeCache = cache;
    return cache;
}

export function getFunctionType(id: string): FunctionTypeItem | null {
    return buildCache().get(id) || null;
}

export function getAllFunctionTypes(): FunctionTypeItem[] {
    const configData = getFunctionTypeConfig();
    return configData.groups.flatMap(g => g.items);
}

export function addFunctionType(item: Omit<FunctionTypeItem, 'isSystem'>): FunctionTypeItem {
    const configData = getFunctionTypeConfig();

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.id)) {
        throw new Error(`Invalid type ID format: ${item.id}`);
    }

    if (buildCache().has(item.id)) {
        throw new Error(`Function type ${item.id} already exists`);
    }

    const group = configData.groups.find(g => g.id === item.category);
    if (!group) {
        throw new Error(`Invalid category: ${item.category}`);
    }

    const newItem: FunctionTypeItem = { ...item, isSystem: false };
    group.items.push(newItem);
    saveFunctionTypeConfig(configData);
    return newItem;
}

export function updateFunctionType(
    id: string,
    updates: Partial<Omit<FunctionTypeItem, 'id' | 'category' | 'isSystem'>>
): FunctionTypeItem {
    const configData = getFunctionTypeConfig();

    for (const group of configData.groups) {
        const item = group.items.find(i => i.id === id);
        if (item) {
            Object.assign(item, updates);
            saveFunctionTypeConfig(configData);
            return item;
        }
    }

    throw new Error(`Function type ${id} not found`);
}

export function deleteFunctionType(id: string): void {
    const configData = getFunctionTypeConfig();

    for (const group of configData.groups) {
        const index = group.items.findIndex(i => i.id === id);
        if (index !== -1) {
            if (group.items[index].isSystem) {
                throw new Error(`Cannot delete system type ${id}`);
            }
            group.items.splice(index, 1);
            saveFunctionTypeConfig(configData);
            return;
        }
    }

    throw new Error(`Function type ${id} not found`);
}

export default {
    getFunctionTypeConfig,
    saveFunctionTypeConfig,
    getFunctionType,
    getAllFunctionTypes,
    clearTypeCache,
    addFunctionType,
    updateFunctionType,
    deleteFunctionType,
};

