/**
 * 功能视图注册表
 * 
 * 管理 atlas.function → 视图组件的映射关系
 */

import type { FunctionViewConfig, ViewMode, ViewProps, ActionConfig } from './types';
import type { ComponentType } from 'react';

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_MODES: ViewMode[] = ['read', 'form', 'md'];
const DEFAULT_MODE: ViewMode = 'read';

// ============================================================
// 注册表实例
// ============================================================

const registry = new Map<string, FunctionViewConfig>();

// ============================================================
// 注册表操作
// ============================================================

/**
 * 注册功能视图配置
 */
export function registerFunctionView(config: FunctionViewConfig): void {
    registry.set(config.function, config);
}

/**
 * 获取功能视图配置
 */
export function getFunctionViewConfig(fn: string): FunctionViewConfig | undefined {
    return registry.get(fn);
}

/**
 * 获取功能的可用视图模式
 */
export function getAvailableModes(fn: string): ViewMode[] {
    const config = registry.get(fn);
    return config?.availableModes || DEFAULT_MODES;
}

/**
 * 获取功能的默认视图模式
 */
export function getDefaultMode(fn: string): ViewMode {
    const config = registry.get(fn);
    return config?.defaultMode || DEFAULT_MODE;
}

/**
 * 获取功能的视图组件
 */
export function getViewComponent(
    fn: string,
    mode: ViewMode
): ComponentType<ViewProps> | undefined {
    const config = registry.get(fn);
    return config?.views[mode];
}

/**
 * 获取功能的操作配置
 */
export function getActions(fn: string): ActionConfig[] {
    const config = registry.get(fn);
    return config?.actions || [];
}

/**
 * 根据能力过滤操作
 */
export function getAvailableActions(
    fn: string,
    capabilities: string[]
): ActionConfig[] {
    const actions = getActions(fn);
    return actions.filter(action => {
        // 无能力要求的操作始终可用
        if (!action.capability) return true;
        // 检查是否具备所需能力
        return capabilities.includes(action.capability);
    });
}

/**
 * 检查视图模式是否可用
 */
export function isModeAvailable(fn: string, mode: ViewMode): boolean {
    const modes = getAvailableModes(fn);
    return modes.includes(mode);
}

/**
 * 获取所有已注册的功能
 */
export function getRegisteredFunctions(): string[] {
    return Array.from(registry.keys());
}

/**
 * 清空注册表（仅用于测试）
 */
export function clearRegistry(): void {
    registry.clear();
}

// ============================================================
// 导出
// ============================================================

export const FunctionViewRegistry = {
    register: registerFunctionView,
    get: getFunctionViewConfig,
    getAvailableModes,
    getDefaultMode,
    getViewComponent,
    getActions,
    getAvailableActions,
    isModeAvailable,
    getRegisteredFunctions,
    clear: clearRegistry,
};

export default FunctionViewRegistry;

