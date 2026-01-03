/**
 * 视图模式配置
 * 
 * 定义每种功能类型的视图模式可用性
 */

import type { ViewMode } from './types';

// ============================================================
// 视图模式配置
// ============================================================

interface ViewModeSettings {
    /** 可用的视图模式 */
    availableModes: ViewMode[];
    /** 默认视图模式 */
    defaultMode: ViewMode;
    /** 模式显示名称 */
    modeLabels?: Partial<Record<ViewMode, string>>;
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_SETTINGS: ViewModeSettings = {
    availableModes: ['read', 'form', 'md'],
    defaultMode: 'read',
    modeLabels: {
        read: '阅读',
        form: '表单',
        md: 'MD编辑',
    },
};

// ============================================================
// 功能 → 视图模式映射
// ============================================================

const VIEW_MODE_MAP: Record<string, ViewModeSettings> = {
    // 登录主体：完整三模式
    principal: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
    },

    // 客户：完整三模式
    client: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
    },

    // 实体列表：阅读 + MD编辑（表单用于批量操作）
    entity_list: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
        modeLabels: {
            read: '列表',
            form: '批量编辑',
            md: 'MD编辑',
        },
    },

    // 实体详情：完整三模式
    entity_detail: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
    },

    // 项目：完整三模式
    project: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
        modeLabels: {
            read: '看板',
            form: '表单',
            md: 'MD编辑',
        },
    },

    // 配置：阅读 + 表单（JSON编辑在MD模式）
    config: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
        modeLabels: {
            read: '预览',
            form: '配置',
            md: 'JSON',
        },
    },

    // 注册表：阅读 + MD编辑
    registry: {
        availableModes: ['read', 'md'],
        defaultMode: 'read',
    },

    // 笔记：阅读 + MD编辑（无表单）
    note: {
        availableModes: ['read', 'md'],
        defaultMode: 'read',
        modeLabels: {
            read: '阅读',
            md: '编辑',
        },
    },

    // 分类导航：阅读 + MD编辑
    category: {
        availableModes: ['read', 'md'],
        defaultMode: 'read',
    },

    // 服务：完整三模式
    service: {
        availableModes: ['read', 'form', 'md'],
        defaultMode: 'read',
    },
};

// ============================================================
// 配置访问函数
// ============================================================

/**
 * 获取功能的视图模式配置
 */
export function getViewModeSettings(fn: string): ViewModeSettings {
    return VIEW_MODE_MAP[fn] || DEFAULT_SETTINGS;
}

/**
 * 获取功能的可用视图模式
 */
export function getAvailableViewModes(fn: string): ViewMode[] {
    const settings = getViewModeSettings(fn);
    return settings.availableModes;
}

/**
 * 获取功能的默认视图模式
 */
export function getDefaultViewMode(fn: string): ViewMode {
    const settings = getViewModeSettings(fn);
    return settings.defaultMode;
}

/**
 * 获取视图模式的显示标签
 */
export function getViewModeLabel(fn: string, mode: ViewMode): string {
    const settings = getViewModeSettings(fn);
    const defaultLabels = DEFAULT_SETTINGS.modeLabels || {};
    return settings.modeLabels?.[mode] || defaultLabels[mode] || mode;
}

/**
 * 检查视图模式是否可用
 */
export function isViewModeAvailable(fn: string, mode: ViewMode): boolean {
    const modes = getAvailableViewModes(fn);
    return modes.includes(mode);
}

/**
 * 获取下一个可用的视图模式（循环切换）
 */
export function getNextViewMode(fn: string, currentMode: ViewMode): ViewMode {
    const modes = getAvailableViewModes(fn);
    const currentIndex = modes.indexOf(currentMode);
    if (currentIndex === -1) return modes[0];
    return modes[(currentIndex + 1) % modes.length];
}

// ============================================================
// 导出
// ============================================================

export const ViewModeConfig = {
    getSettings: getViewModeSettings,
    getAvailableModes: getAvailableViewModes,
    getDefaultMode: getDefaultViewMode,
    getModeLabel: getViewModeLabel,
    isModeAvailable: isViewModeAvailable,
    getNextMode: getNextViewMode,
};

export default ViewModeConfig;

