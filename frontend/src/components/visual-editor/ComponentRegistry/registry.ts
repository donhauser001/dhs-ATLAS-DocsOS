/**
 * ComponentRegistry - 组件注册中心
 * 
 * 自动扫描 components 目录，注册所有组件
 * 插件开发者只需按格式创建组件目录，即可自动注册
 */

import {
    ComponentType,
    ComponentMeta,
    ComponentCategory,
    CategoryMeta,
    RegisteredComponent,
    ComponentRegistry,
    DocumentComponentDefinition,
    ControlProps,
    ConfiguratorProps,
} from './types';

// ============================================================
// 分类定义
// ============================================================

/** 分类元数据配置 */
export const CATEGORY_METAS: CategoryMeta[] = [
    {
        id: 'input',
        name: '输入型',
        description: '基础数据输入组件',
        icon: 'text-cursor-input',
    },
    {
        id: 'smart',
        name: '智能型',
        description: '自动计算和生成',
        icon: 'sparkles',
    },
    {
        id: 'display',
        name: '展示型',
        description: '数据展示和可视化',
        icon: 'eye',
    },
    {
        id: 'relation',
        name: '关联型',
        description: '文件和数据关联',
        icon: 'link',
    },
    {
        id: 'security',
        name: '安全型',
        description: '用户认证和权限管理',
        icon: 'shield-check',
    },
];

// ============================================================
// 组件注册表（单例）
// ============================================================

const registry: ComponentRegistry = new Map();

// ============================================================
// 自动扫描并注册组件
// ============================================================

/**
 * 使用 Vite 的 import.meta.glob 自动扫描 components 目录
 * 每个组件目录必须有 index.ts 导出 RegisteredComponent
 */
const componentModules = import.meta.glob<{ default: RegisteredComponent }>(
    './components/*/index.ts',
    { eager: true }
);

// 遍历所有模块并注册
for (const [path, module] of Object.entries(componentModules)) {
    const component = module.default;
    if (component && component.meta && component.meta.type) {
        registry.set(component.meta.type, component);
        console.log(`[ComponentRegistry] Registered: ${component.meta.type}`);
    }
}

// ============================================================
// 导出 API
// ============================================================

/**
 * 获取组件注册表
 */
export function getRegistry(): ComponentRegistry {
    return registry;
}

/**
 * 获取所有已注册的组件类型
 */
export function getComponentTypes(): ComponentType[] {
    return Array.from(registry.keys());
}

/**
 * 获取所有组件元数据
 */
export function getComponentMetas(): ComponentMeta[] {
    return Array.from(registry.values()).map(c => c.meta);
}

/**
 * 根据类型获取组件
 */
export function getComponent(type: ComponentType): RegisteredComponent | undefined {
    return registry.get(type);
}

/**
 * 根据类型获取组件元数据
 */
export function getComponentMeta(type: ComponentType): ComponentMeta | undefined {
    return registry.get(type)?.meta;
}

/**
 * 根据类型获取控件组件
 */
export function getControl(type: ComponentType): React.ComponentType<ControlProps> | undefined {
    return registry.get(type)?.Control;
}

/**
 * 根据类型获取配置器组件
 */
export function getConfigurator(type: ComponentType): React.ComponentType<ConfiguratorProps> | undefined {
    return registry.get(type)?.Configurator;
}

/**
 * 创建默认组件定义
 */
export function createDefaultComponent(type: ComponentType, id: string): DocumentComponentDefinition | undefined {
    const component = registry.get(type);
    return component?.createDefault(id);
}

/**
 * 检查组件是否已注册
 */
export function isRegistered(type: string): type is ComponentType {
    return registry.has(type as ComponentType);
}

/**
 * 手动注册组件（用于动态加载插件）
 */
export function registerComponent(component: RegisteredComponent): void {
    registry.set(component.meta.type, component);
    console.log(`[ComponentRegistry] Dynamically registered: ${component.meta.type}`);
}

/**
 * 注销组件
 */
export function unregisterComponent(type: ComponentType): boolean {
    const result = registry.delete(type);
    if (result) {
        console.log(`[ComponentRegistry] Unregistered: ${type}`);
    }
    return result;
}

// 导出注册表大小（用于调试）
export const registrySize = () => registry.size;

/**
 * 获取所有分类元数据
 */
export function getCategoryMetas(): CategoryMeta[] {
    return CATEGORY_METAS;
}

/**
 * 获取指定分类的组件元数据
 */
export function getComponentsByCategory(category: ComponentCategory): ComponentMeta[] {
    return Array.from(registry.values())
        .filter(c => c.meta.category === category)
        .map(c => c.meta);
}

/**
 * 获取按分类分组的组件元数据
 */
export function getComponentsGroupedByCategory(): Map<ComponentCategory, ComponentMeta[]> {
    const grouped = new Map<ComponentCategory, ComponentMeta[]>();
    
    for (const category of CATEGORY_METAS.map(c => c.id)) {
        grouped.set(category, []);
    }
    
    for (const component of registry.values()) {
        const category = component.meta.category;
        const list = grouped.get(category);
        if (list) {
            list.push(component.meta);
        }
    }
    
    return grouped;
}

