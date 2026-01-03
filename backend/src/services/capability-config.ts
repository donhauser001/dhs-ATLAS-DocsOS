/**
 * CapabilityConfig - 能力类型配置服务
 * 
 * 管理文档可以具备的行为能力。
 * 
 * 能力分类：
 * - 数据能力：crud, import, export, template
 * - 流程能力：workflow, approval, recurring
 * - 时间能力：reminder, countdown, schedule
 * - 追踪能力：progress, statistics, streak, history
 * - 版本能力：versioning, snapshot
 * - 协作能力：share, comment, assign
 * - 关联能力：relation, backlink, embed
 * - 输入能力：quick_add, voice, ocr, scan
 * - 输出能力：print, pdf, publish
 * - 计算能力：formula, aggregate, budget
 * - 学习能力：spaced_repetition, flashcard, quiz
 * - 生活能力：timer, checkin, reward
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from '../config.js';

// ============================================================
// 类型定义
// ============================================================

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
    /** 配置项说明 */
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

// ============================================================
// 系统预定义能力
// ============================================================

const SYSTEM_CAPABILITIES: CapabilityConfig = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    groups: [
        {
            id: 'data',
            label: '数据能力',
            description: '数据的增删改查和导入导出',
            items: [
                { id: 'crud', label: '增删改查', description: '基础数据操作', icon: 'database', category: 'data', isSystem: true },
                { id: 'import', label: '导入', description: '批量导入数据', icon: 'upload', category: 'data', isSystem: true },
                { id: 'export', label: '导出', description: '导出数据', icon: 'download', category: 'data', isSystem: true },
                { id: 'template', label: '模板', description: '使用模板创建', icon: 'file-plus', category: 'data', isSystem: true },
            ],
        },
        {
            id: 'workflow',
            label: '流程能力',
            description: '工作流和审批流程',
            items: [
                { id: 'workflow', label: '工作流', description: '状态流转', icon: 'git-branch', category: 'workflow', isSystem: true },
                { id: 'approval', label: '审批', description: '审批流程', icon: 'check-circle', category: 'workflow', isSystem: true },
                { id: 'recurring', label: '循环', description: '周期性创建', icon: 'repeat', category: 'workflow', isSystem: true },
            ],
        },
        {
            id: 'time',
            label: '时间能力',
            description: '时间相关的提醒和调度',
            items: [
                { id: 'reminder', label: '提醒', description: '时间提醒', icon: 'bell', category: 'time', isSystem: true },
                { id: 'countdown', label: '倒计时', description: '截止倒计时', icon: 'timer', category: 'time', isSystem: true },
                { id: 'schedule', label: '排程', description: '定时执行', icon: 'clock', category: 'time', isSystem: true },
            ],
        },
        {
            id: 'tracking',
            label: '追踪能力',
            description: '进度和统计追踪',
            items: [
                { id: 'progress', label: '进度', description: '进度追踪', icon: 'trending-up', category: 'tracking', isSystem: true },
                { id: 'statistics', label: '统计', description: '数据统计', icon: 'bar-chart', category: 'tracking', isSystem: true },
                { id: 'streak', label: '连续', description: '连续天数追踪', icon: 'flame', category: 'tracking', isSystem: true },
                { id: 'history', label: '历史', description: '变更历史', icon: 'history', category: 'tracking', isSystem: true },
            ],
        },
        {
            id: 'version',
            label: '版本能力',
            description: '版本控制和快照',
            items: [
                { id: 'versioning', label: '版本控制', description: '版本管理', icon: 'git-commit', category: 'version', isSystem: true },
                { id: 'snapshot', label: '快照', description: '状态快照', icon: 'camera', category: 'version', isSystem: true },
            ],
        },
        {
            id: 'collaboration',
            label: '协作能力',
            description: '团队协作功能',
            items: [
                { id: 'share', label: '分享', description: '分享给他人', icon: 'share', category: 'collaboration', isSystem: true },
                { id: 'comment', label: '评论', description: '添加评论', icon: 'message-circle', category: 'collaboration', isSystem: true },
                { id: 'assign', label: '分配', description: '分配负责人', icon: 'user-plus', category: 'collaboration', isSystem: true },
            ],
        },
        {
            id: 'relation',
            label: '关联能力',
            description: '文档间的关联',
            items: [
                { id: 'relation', label: '关联', description: '关联其他文档', icon: 'link', category: 'relation', isSystem: true },
                { id: 'backlink', label: '反向链接', description: '双向链接', icon: 'link-2', category: 'relation', isSystem: true },
                { id: 'embed', label: '嵌入', description: '嵌入内容', icon: 'box', category: 'relation', isSystem: true },
            ],
        },
        {
            id: 'input',
            label: '输入能力',
            description: '快捷输入方式',
            items: [
                { id: 'quick_add', label: '快速添加', description: '快捷添加', icon: 'zap', category: 'input', isSystem: true },
                { id: 'voice', label: '语音', description: '语音输入', icon: 'mic', category: 'input', isSystem: true },
                { id: 'ocr', label: '识别', description: '图片识别', icon: 'scan', category: 'input', isSystem: true },
                { id: 'scan', label: '扫描', description: '扫码/扫描', icon: 'qr-code', category: 'input', isSystem: true },
            ],
        },
        {
            id: 'output',
            label: '输出能力',
            description: '导出和发布',
            items: [
                { id: 'print', label: '打印', description: '打印输出', icon: 'printer', category: 'output', isSystem: true },
                { id: 'pdf', label: 'PDF', description: '生成PDF', icon: 'file', category: 'output', isSystem: true },
                { id: 'publish', label: '发布', description: '公开发布', icon: 'globe', category: 'output', isSystem: true },
            ],
        },
        {
            id: 'compute',
            label: '计算能力',
            description: '公式和汇总计算',
            items: [
                { id: 'formula', label: '公式', description: '公式计算', icon: 'calculator', category: 'compute', isSystem: true },
                { id: 'aggregate', label: '聚合', description: '汇总计算', icon: 'sigma', category: 'compute', isSystem: true },
                { id: 'budget', label: '预算', description: '预算管理', icon: 'wallet', category: 'compute', isSystem: true },
            ],
        },
        {
            id: 'learning',
            label: '学习能力',
            description: '学习和记忆辅助',
            items: [
                { id: 'spaced_repetition', label: '间隔重复', description: '记忆曲线复习', icon: 'brain', category: 'learning', isSystem: true },
                { id: 'flashcard', label: '闪卡', description: '闪卡学习', icon: 'layers', category: 'learning', isSystem: true },
                { id: 'quiz', label: '测验', description: '自测功能', icon: 'help-circle', category: 'learning', isSystem: true },
            ],
        },
        {
            id: 'lifestyle',
            label: '生活能力',
            description: '日常生活辅助',
            items: [
                { id: 'timer', label: '计时', description: '计时器', icon: 'timer', category: 'lifestyle', isSystem: true },
                { id: 'checkin', label: '打卡', description: '打卡签到', icon: 'check-circle', category: 'lifestyle', isSystem: true },
                { id: 'reward', label: '奖励', description: '积分奖励', icon: 'gift', category: 'lifestyle', isSystem: true },
            ],
        },
    ],
};

// ============================================================
// 配置文件路径
// ============================================================

const CONFIG_PATH = join(config.atlasDataDir, 'config', 'capabilities.json');

let capCache: Map<string, CapabilityItem> | null = null;

// ============================================================
// 服务实现
// ============================================================

function ensureConfigDir(): void {
    const dir = dirname(CONFIG_PATH);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

export function getCapabilityConfig(): CapabilityConfig {
    ensureConfigDir();

    if (!existsSync(CONFIG_PATH)) {
        saveCapabilityConfig(SYSTEM_CAPABILITIES);
        return SYSTEM_CAPABILITIES;
    }

    try {
        const content = readFileSync(CONFIG_PATH, 'utf-8');
        const userConfig = JSON.parse(content) as CapabilityConfig;
        return mergeWithSystemCaps(userConfig);
    } catch (error) {
        console.error('[CapabilityConfig] Failed to read config:', error);
        return SYSTEM_CAPABILITIES;
    }
}

export function saveCapabilityConfig(configData: CapabilityConfig): void {
    ensureConfigDir();
    configData.updatedAt = new Date().toISOString();
    writeFileSync(CONFIG_PATH, JSON.stringify(configData, null, 2), 'utf-8');
    clearCapCache();
}

function mergeWithSystemCaps(userConfig: CapabilityConfig): CapabilityConfig {
    const merged: CapabilityConfig = {
        version: userConfig.version || SYSTEM_CAPABILITIES.version,
        updatedAt: userConfig.updatedAt || new Date().toISOString(),
        groups: [],
    };

    for (const sysGroup of SYSTEM_CAPABILITIES.groups) {
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

export function clearCapCache(): void {
    capCache = null;
}

function buildCache(): Map<string, CapabilityItem> {
    if (capCache) return capCache;
    const configData = getCapabilityConfig();
    const cache = new Map<string, CapabilityItem>();
    for (const group of configData.groups) {
        for (const item of group.items) {
            cache.set(item.id, item);
        }
    }
    capCache = cache;
    return cache;
}

export function getCapability(id: string): CapabilityItem | null {
    return buildCache().get(id) || null;
}

export function getAllCapabilities(): CapabilityItem[] {
    const configData = getCapabilityConfig();
    return configData.groups.flatMap(g => g.items);
}

export function addCapability(item: Omit<CapabilityItem, 'isSystem'>): CapabilityItem {
    const configData = getCapabilityConfig();

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(item.id)) {
        throw new Error(`Invalid capability ID format: ${item.id}`);
    }

    if (buildCache().has(item.id)) {
        throw new Error(`Capability ${item.id} already exists`);
    }

    const group = configData.groups.find(g => g.id === item.category);
    if (!group) {
        throw new Error(`Invalid category: ${item.category}`);
    }

    const newItem: CapabilityItem = { ...item, isSystem: false };
    group.items.push(newItem);
    saveCapabilityConfig(configData);
    return newItem;
}

export function updateCapability(
    id: string,
    updates: Partial<Omit<CapabilityItem, 'id' | 'category' | 'isSystem'>>
): CapabilityItem {
    const configData = getCapabilityConfig();

    for (const group of configData.groups) {
        const item = group.items.find(i => i.id === id);
        if (item) {
            Object.assign(item, updates);
            saveCapabilityConfig(configData);
            return item;
        }
    }

    throw new Error(`Capability ${id} not found`);
}

export function deleteCapability(id: string): void {
    const configData = getCapabilityConfig();

    for (const group of configData.groups) {
        const index = group.items.findIndex(i => i.id === id);
        if (index !== -1) {
            if (group.items[index].isSystem) {
                throw new Error(`Cannot delete system capability ${id}`);
            }
            group.items.splice(index, 1);
            saveCapabilityConfig(configData);
            return;
        }
    }

    throw new Error(`Capability ${id} not found`);
}

export default {
    getCapabilityConfig,
    saveCapabilityConfig,
    getCapability,
    getAllCapabilities,
    clearCapCache,
    addCapability,
    updateCapability,
    deleteCapability,
};

