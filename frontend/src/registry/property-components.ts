/**
 * 属性组件注册中心
 * 
 * 管理所有属性组件的注册和获取
 * 支持内置组件和插件组件
 */

import type { PropertyComponent, PropertyComponentType, PropertyComponentConfig } from '@/types/property';
import { builtinComponents } from '@/components/visual-editor/PropertyComponents';
import { AlertTriangle } from 'lucide-react';
import React from 'react';

// === 组件注册表 ===

const componentRegistry = new Map<string, PropertyComponent>();

// === 初始化内置组件 ===

function initBuiltinComponents() {
    builtinComponents.forEach(component => {
        componentRegistry.set(component.id, component);
    });
}

// 立即初始化
initBuiltinComponents();

// === 公共 API ===

/**
 * 注册组件
 * @param component 组件定义
 * @throws 如果组件 ID 已存在且非内置组件
 */
export function registerComponent(component: PropertyComponent): void {
    const existingComponent = componentRegistry.get(component.id);

    // 如果是内置组件，不允许覆盖
    if (existingComponent && builtinComponents.some(c => c.id === component.id)) {
        console.warn(`[PropertyRegistry] Cannot override builtin component: ${component.id}`);
        return;
    }

    componentRegistry.set(component.id, component);
    console.log(`[PropertyRegistry] Registered component: ${component.id} v${component.version}`);
}

/**
 * 注销组件
 * @param id 组件 ID
 * @returns 是否成功注销
 */
export function unregisterComponent(id: string): boolean {
    // 不允许注销内置组件
    if (builtinComponents.some(c => c.id === id)) {
        console.warn(`[PropertyRegistry] Cannot unregister builtin component: ${id}`);
        return false;
    }

    const result = componentRegistry.delete(id);
    if (result) {
        console.log(`[PropertyRegistry] Unregistered component: ${id}`);
    }
    return result;
}

/**
 * 获取组件
 * @param id 组件 ID
 * @returns 组件定义，如果不存在则返回 null
 */
export function getComponent(id: PropertyComponentType): PropertyComponent | null {
    return componentRegistry.get(id) || null;
}

/**
 * 检查组件是否存在
 * @param id 组件 ID
 */
export function hasComponent(id: string): boolean {
    return componentRegistry.has(id);
}

/**
 * 获取所有已注册的组件
 */
export function getAllComponents(): PropertyComponent[] {
    return Array.from(componentRegistry.values());
}

/**
 * 获取所有内置组件
 */
export function getBuiltinComponents(): PropertyComponent[] {
    return builtinComponents;
}

/**
 * 获取所有插件组件
 */
export function getPluginComponents(): PropertyComponent[] {
    return Array.from(componentRegistry.values()).filter(
        c => !builtinComponents.some(b => b.id === c.id)
    );
}

// === 失效态渲染 ===

/**
 * 创建失效态渲染的 fallback 组件
 * 当组件不存在时使用
 */
export function createFallbackComponent(
    componentId: string,
    lastValue: unknown,
    lastConfig: unknown
): React.ReactNode {
    return React.createElement(
        'div',
        {
            className: 'inline-flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm'
        },
        React.createElement(AlertTriangle, { size: 16 }),
        React.createElement('div', { className: 'flex flex-col' },
            React.createElement('span', { className: 'font-medium' }, `组件不可用: ${componentId}`),
            lastValue !== undefined && React.createElement(
                'span',
                { className: 'text-xs text-amber-600' },
                `最后值: ${typeof lastValue === 'object' ? JSON.stringify(lastValue) : String(lastValue)}`
            )
        )
    );
}

/**
 * 安全渲染组件
 * 如果组件不存在，渲染 fallback
 */
export function safeRenderComponent(
    componentId: PropertyComponentType,
    mode: 'editor' | 'view' | 'inline',
    value: unknown,
    config: PropertyComponentConfig,
    onChange?: (value: unknown) => void,
    context?: { disabled?: boolean; readonly?: boolean }
): React.ReactNode {
    const component = getComponent(componentId);

    if (!component) {
        return createFallbackComponent(componentId, value, config);
    }

    try {
        switch (mode) {
            case 'editor':
                return component.renderEditor(value, config, onChange || (() => { }), context);
            case 'view':
                return component.renderView(value, config, context);
            case 'inline':
                return component.renderInline(value, config);
            default:
                return component.renderView(value, config, context);
        }
    } catch (error) {
        console.error(`[PropertyRegistry] Error rendering component ${componentId}:`, error);
        return component.renderFallback(value, config);
    }
}

// === 组件元数据 ===

/**
 * 组件分类信息
 */
export interface ComponentCategory {
    id: string;
    name: string;
    icon: string;
    components: PropertyComponent[];
}

/**
 * 获取分类后的组件列表
 */
export function getCategorizedComponents(): ComponentCategory[] {
    const allComponents = getAllComponents();

    return [
        {
            id: 'basic',
            name: '基础',
            icon: 'type',
            components: allComponents.filter(c => ['text', 'textarea', 'number', 'tags'].includes(c.id)),
        },
        {
            id: 'selection',
            name: '选择',
            icon: 'list',
            components: allComponents.filter(c => ['select', 'multi-select', 'checkbox'].includes(c.id)),
        },
        {
            id: 'rating',
            name: '评分',
            icon: 'star',
            components: allComponents.filter(c => ['rating'].includes(c.id)),
        },
        {
            id: 'datetime',
            name: '日期时间',
            icon: 'calendar',
            components: allComponents.filter(c => ['date', 'datetime'].includes(c.id)),
        },
        {
            id: 'advanced',
            name: '高级',
            icon: 'puzzle',
            components: allComponents.filter(c => ['link', 'user', 'file', 'color', 'icon', 'formula'].includes(c.id)),
        },
        {
            id: 'plugins',
            name: '插件',
            icon: 'plug',
            components: getPluginComponents(),
        },
    ].filter(category => category.components.length > 0);
}

// === 导出类型 ===

export type { PropertyComponent, PropertyComponentType, PropertyComponentConfig };

