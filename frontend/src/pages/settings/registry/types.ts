/**
 * 设置模块注册制 - 类型定义
 * 
 * 所有设置模块都遵循这个接口，便于统一管理和扩展
 */

import { ComponentType } from 'react';
import { LucideIcon } from 'lucide-react';

// ============================================================
// 设置模块分类
// ============================================================

export type SettingCategory =
    | 'system'      // 系统配置：标签、模板等基础配置
    | 'document'    // 文档配置：类型、功能、显现、能力
    | 'workflow'    // 流程配置：审批、工作流
    | 'integration' // 集成配置：第三方服务
    | 'advanced';   // 高级配置：开发者选项

// 分类元数据
export const SETTING_CATEGORIES: Record<SettingCategory, {
    label: string;
    description: string;
    order: number;
}> = {
    system: {
        label: '系统配置',
        description: '标签、模板等基础配置',
        order: 1,
    },
    document: {
        label: '文档配置',
        description: '文档类型、功能、显现方式和能力',
        order: 2,
    },
    workflow: {
        label: '流程配置',
        description: '审批流程、工作流配置',
        order: 3,
    },
    integration: {
        label: '集成配置',
        description: '第三方服务和API集成',
        order: 4,
    },
    advanced: {
        label: '高级配置',
        description: '开发者选项和高级功能',
        order: 5,
    },
};

// ============================================================
// 设置模块元数据
// ============================================================

export interface SettingModuleMeta {
    /** 模块唯一标识，用于 URL 路由 */
    id: string;

    /** 模块显示名称 */
    label: string;

    /** 模块描述 */
    description: string;

    /** 模块图标（Lucide 图标组件） */
    icon: LucideIcon;

    /** 模块分类 */
    category: SettingCategory;

    /** 排序权重（同分类内） */
    order?: number;

    /** 是否需要特定权限 */
    requiredPermission?: string;

    /** 是否在菜单中隐藏 */
    hidden?: boolean;

    /** 徽标（如 "新"、"Beta"） */
    badge?: string;
}

// ============================================================
// 设置模块配置
// ============================================================

export interface SettingModuleConfig {
    /** 模块元数据 */
    meta: SettingModuleMeta;

    /** 模块组件 */
    Component: ComponentType;
}

// ============================================================
// 注册表类型
// ============================================================

export interface SettingRegistry {
    /** 所有已注册的模块 */
    modules: Map<string, SettingModuleConfig>;

    /** 注册一个模块 */
    register: (config: SettingModuleConfig) => void;

    /** 获取模块 */
    get: (id: string) => SettingModuleConfig | undefined;

    /** 获取所有模块（按分类和顺序排列） */
    getAll: () => SettingModuleConfig[];

    /** 按分类获取模块 */
    getByCategory: (category: SettingCategory) => SettingModuleConfig[];

    /** 检查模块是否存在 */
    has: (id: string) => boolean;
}

