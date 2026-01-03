/**
 * DisplayModeConfig - 显现模式配置服务
 * 
 * 管理文档的呈现方式。
 * 
 * 显现分类：
 * - 列表模式：card, table, compact
 * - 看板模式：column, swimlane
 * - 日历模式：month, week, heatmap
 * - 时间模式：vertical, horizontal, gantt
 * - 画廊模式：grid, masonry, shelf
 * - 文章模式：single, double, zen
 * - 详情模式：card, form, split
 * - 结构模式：outline, mindmap, network
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

export type DisplayCategory = 'list' | 'kanban' | 'calendar' | 'timeline' | 'gallery' | 'article' | 'detail' | 'structure';

export interface DisplayModeItem {
    id: string;
    label: string;
    description?: string;
    icon?: string;
    category: DisplayCategory;
    /** 配置项说明 */
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

// ============================================================
// 系统预定义显现模式
// ============================================================

const SYSTEM_DISPLAY_MODES: DisplayModeConfig = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    groups: [
        {
            id: 'list',
            label: '列表模式',
            description: '列表形式展示数据',
            items: [
                { id: 'list.card', label: '卡片列表', description: '卡片式展示', icon: 'layout-grid', category: 'list', isSystem: true },
                { id: 'list.table', label: '表格列表', description: '表格式展示', icon: 'table', category: 'list', isSystem: true },
                { id: 'list.compact', label: '紧凑列表', description: '简洁行式', icon: 'list', category: 'list', isSystem: true },
            ],
        },
        {
            id: 'kanban',
            label: '看板模式',
            description: '状态分列展示',
            items: [
                { id: 'kanban.column', label: '列看板', description: '按状态分列', icon: 'columns', category: 'kanban', isSystem: true },
                { id: 'kanban.swimlane', label: '泳道看板', description: '双维度看板', icon: 'layout', category: 'kanban', isSystem: true },
            ],
        },
        {
            id: 'calendar',
            label: '日历模式',
            description: '时间维度展示',
            items: [
                { id: 'calendar.month', label: '月视图', description: '月历展示', icon: 'calendar', category: 'calendar', isSystem: true },
                { id: 'calendar.week', label: '周视图', description: '周历展示', icon: 'calendar-days', category: 'calendar', isSystem: true },
                { id: 'calendar.heatmap', label: '热力图', description: '数值热力图', icon: 'flame', category: 'calendar', isSystem: true },
            ],
        },
        {
            id: 'timeline',
            label: '时间线模式',
            description: '按时间排列',
            items: [
                { id: 'timeline.vertical', label: '垂直时间线', description: '上下排列', icon: 'git-commit', category: 'timeline', isSystem: true },
                { id: 'timeline.horizontal', label: '水平时间线', description: '左右排列', icon: 'arrow-right', category: 'timeline', isSystem: true },
                { id: 'timeline.gantt', label: '甘特图', description: '项目甘特', icon: 'gantt-chart', category: 'timeline', isSystem: true },
            ],
        },
        {
            id: 'gallery',
            label: '画廊模式',
            description: '视觉化展示',
            items: [
                { id: 'gallery.grid', label: '网格画廊', description: '等宽网格', icon: 'grid', category: 'gallery', isSystem: true },
                { id: 'gallery.masonry', label: '瀑布流', description: '不等高瀑布', icon: 'layout-grid', category: 'gallery', isSystem: true },
                { id: 'gallery.shelf', label: '书架', description: '书架式展示', icon: 'library', category: 'gallery', isSystem: true },
            ],
        },
        {
            id: 'article',
            label: '文章模式',
            description: '长文本阅读',
            items: [
                { id: 'article.single', label: '单栏文章', description: '居中单栏', icon: 'file-text', category: 'article', isSystem: true },
                { id: 'article.double', label: '双栏文章', description: '内容+侧边', icon: 'layout', category: 'article', isSystem: true },
                { id: 'article.zen', label: '禅模式', description: '极简专注', icon: 'moon', category: 'article', isSystem: true },
            ],
        },
        {
            id: 'detail',
            label: '详情模式',
            description: '单条数据展示',
            items: [
                { id: 'detail.card', label: '卡片详情', description: '分区卡片', icon: 'square', category: 'detail', isSystem: true },
                { id: 'detail.form', label: '表单详情', description: '表单布局', icon: 'file-input', category: 'detail', isSystem: true },
                { id: 'detail.split', label: '分栏详情', description: '左右分栏', icon: 'columns', category: 'detail', isSystem: true },
            ],
        },
        {
            id: 'structure',
            label: '结构模式',
            description: '层级和关系展示',
            items: [
                { id: 'tree.outline', label: '大纲树', description: '可折叠大纲', icon: 'list-tree', category: 'structure', isSystem: true },
                { id: 'tree.mindmap', label: '思维导图', description: '放射状结构', icon: 'share-2', category: 'structure', isSystem: true },
                { id: 'graph.network', label: '关系图谱', description: '网络图', icon: 'share-2', category: 'structure', isSystem: true },
            ],
        },
    ],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'display-modes.json');

let modeCache: Map<string, DisplayModeItem> | null = null;

// ============================================================
// 服务实现
// ============================================================

function ensureConfigDir(): void {
    const dir = dirname(CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

export function getDisplayModeConfig(): DisplayModeConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_PATH)) {
        saveDisplayModeConfig(SYSTEM_DISPLAY_MODES);
        return SYSTEM_DISPLAY_MODES;
    }

    try {
        const content = readFileSync(CONFIG_PATH, 'utf-8');
        const userConfig = JSON.parse(content) as DisplayModeConfig;
        return mergeWithSystemModes(userConfig);
    } catch (error) {
        console.error('[DisplayModeConfig] Failed to read config:', error);
        return SYSTEM_DISPLAY_MODES;
    }
}

export function saveDisplayModeConfig(configData: DisplayModeConfig): void {
    ensureConfigDir();
    configData.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    clearModeCache();
}

function mergeWithSystemModes(userConfig: DisplayModeConfig): DisplayModeConfig {
    const merged: DisplayModeConfig = {
        version: userConfig.version || SYSTEM_DISPLAY_MODES.version,
        updatedAt: userConfig.updatedAt || new Date().toISOString(),
        groups: [],
    };

    for (const sysGroup of SYSTEM_DISPLAY_MODES.groups) {
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

export function clearModeCache(): void {
    modeCache = null;
}

function buildCache(): Map<string, DisplayModeItem> {
    if (modeCache) return modeCache;
    const configData = getDisplayModeConfig();
    const cache = new Map<string, DisplayModeItem>();
    for (const group of configData.groups) {
        for (const item of group.items) {
            cache.set(item.id, item);
        }
    }
    modeCache = cache;
    return cache;
}

export function getDisplayMode(id: string): DisplayModeItem | null {
    return buildCache().get(id) || null;
}

export function getAllDisplayModes(): DisplayModeItem[] {
    const configData = getDisplayModeConfig();
    return configData.groups.flatMap(g => g.items);
}

export function addDisplayMode(item: Omit<DisplayModeItem, 'isSystem'>): DisplayModeItem {
    const configData = getDisplayModeConfig();

    if (buildCache().has(item.id)) {
        throw new Error(`Display mode ${item.id} already exists`);
    }

    const group = configData.groups.find(g => g.id === item.category);
    if (!group) {
        throw new Error(`Invalid category: ${item.category}`);
    }

    const newItem: DisplayModeItem = { ...item, isSystem: false };
    group.items.push(newItem);
    saveDisplayModeConfig(configData);
    return newItem;
}

export function updateDisplayMode(
    id: string,
    updates: Partial<Omit<DisplayModeItem, 'id' | 'category' | 'isSystem'>>
): DisplayModeItem {
    const configData = getDisplayModeConfig();

    for (const group of configData.groups) {
        const item = group.items.find(i => i.id === id);
        if (item) {
            Object.assign(item, updates);
            saveDisplayModeConfig(configData);
            return item;
        }
    }

    throw new Error(`Display mode ${id} not found`);
}

export function deleteDisplayMode(id: string): void {
    const configData = getDisplayModeConfig();

    for (const group of configData.groups) {
        const index = group.items.findIndex(i => i.id === id);
        if (index !== -1) {
            if (group.items[index].isSystem) {
                throw new Error(`Cannot delete system mode ${id}`);
            }
            group.items.splice(index, 1);
            saveDisplayModeConfig(configData);
            return;
        }
    }

    throw new Error(`Display mode ${id} not found`);
}

export default {
    getDisplayModeConfig,
    saveDisplayModeConfig,
    getDisplayMode,
    getAllDisplayModes,
    clearModeCache,
    addDisplayMode,
    updateDisplayMode,
    deleteDisplayMode,
};

