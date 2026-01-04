/**
 * 能力组件注册表
 * 
 * 提供能力组件的注册和获取功能
 * 采用注册制，每个能力组件自行注册到注册表
 */

import type { CapabilityDefinition, CapabilityRegistry } from './types';

// 能力定义存储
const capabilities = new Map<string, CapabilityDefinition>();

/**
 * 能力注册表实例
 */
export const capabilityRegistry: CapabilityRegistry = {
    /**
     * 注册能力
     */
    register(definition: CapabilityDefinition) {
        if (capabilities.has(definition.id)) {
            console.warn(`[CapabilityRegistry] 能力 "${definition.id}" 已存在，将被覆盖`);
        }
        capabilities.set(definition.id, definition);
    },

    /**
     * 获取能力定义
     */
    get(id: string) {
        return capabilities.get(id);
    },

    /**
     * 获取所有能力定义
     */
    getAll() {
        return Array.from(capabilities.values()).sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
    },

    /**
     * 根据 ID 列表获取能力定义（保持传入顺序）
     */
    getByIds(ids: string[]) {
        return ids
            .map(id => capabilities.get(id))
            .filter((def): def is CapabilityDefinition => def !== undefined);
    },
};

/**
 * 注册能力的快捷方法
 */
export function registerCapability(definition: CapabilityDefinition) {
    capabilityRegistry.register(definition);
}

/**
 * 批量注册能力
 */
export function registerCapabilities(definitions: CapabilityDefinition[]) {
    definitions.forEach(def => capabilityRegistry.register(def));
}

