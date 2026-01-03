/**
 * 设置模块注册表
 * 
 * 使用 import.meta.glob 自动扫描 modules 目录下的所有模块
 * 每个模块目录下的 index.ts 导出 SettingModuleConfig
 */

import {
    SettingModuleConfig,
    SettingRegistry,
    SettingCategory,
    SETTING_CATEGORIES,
} from './types';

// ============================================================
// 注册表实现
// ============================================================

class SettingRegistryImpl implements SettingRegistry {
    modules: Map<string, SettingModuleConfig> = new Map();

    register(config: SettingModuleConfig): void {
        if (this.modules.has(config.meta.id)) {
            console.warn(`[SettingRegistry] Module "${config.meta.id}" already registered, skipping.`);
            return;
        }
        this.modules.set(config.meta.id, config);
    }

    get(id: string): SettingModuleConfig | undefined {
        return this.modules.get(id);
    }

    has(id: string): boolean {
        return this.modules.has(id);
    }

    getAll(): SettingModuleConfig[] {
        const all = Array.from(this.modules.values());

        // 按分类顺序和模块顺序排序
        return all.sort((a, b) => {
            const catOrderA = SETTING_CATEGORIES[a.meta.category]?.order ?? 99;
            const catOrderB = SETTING_CATEGORIES[b.meta.category]?.order ?? 99;

            if (catOrderA !== catOrderB) {
                return catOrderA - catOrderB;
            }

            return (a.meta.order ?? 99) - (b.meta.order ?? 99);
        });
    }

    getByCategory(category: SettingCategory): SettingModuleConfig[] {
        return this.getAll().filter(m => m.meta.category === category);
    }
}

// 单例注册表
export const settingRegistry = new SettingRegistryImpl();

// ============================================================
// 自动扫描并注册模块
// ============================================================

// 使用 Vite 的 import.meta.glob 扫描所有模块
// 每个模块目录下的 config.ts 导出模块配置
const moduleConfigs = import.meta.glob<{ default: SettingModuleConfig }>(
    '../modules/*/config.ts',
    { eager: true }
);

// 注册所有扫描到的模块
for (const [path, module] of Object.entries(moduleConfigs)) {
    if (module.default) {
        settingRegistry.register(module.default);
    } else {
        console.warn(`[SettingRegistry] Module at "${path}" does not have a default export.`);
    }
}

// ============================================================
// 导出
// ============================================================

export * from './types';

// 便捷方法
export function useSettingModules() {
    return {
        all: settingRegistry.getAll(),
        byCategory: (category: SettingCategory) => settingRegistry.getByCategory(category),
        get: (id: string) => settingRegistry.get(id),
        has: (id: string) => settingRegistry.has(id),
        categories: SETTING_CATEGORIES,
    };
}

