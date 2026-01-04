/**
 * 能力组件类型定义
 * 
 * 定义能力组件的注册接口和渲染属性
 */

import type { ReactNode } from 'react';

/**
 * 能力组件的 Props
 */
export interface CapabilityComponentProps {
    /** 文档路径 */
    documentPath: string;
    /** 文档 frontmatter */
    frontmatter: Record<string, unknown>;
    /** 是否只读模式 */
    readonly?: boolean;
    /** 能力 ID */
    capabilityId: string;
}

/**
 * 能力组件渲染模式
 */
export type CapabilityRenderMode = 'button' | 'panel' | 'inline' | 'modal';

/**
 * 能力组件定义
 */
export interface CapabilityDefinition {
    /** 能力 ID，与 frontmatter 中的 atlas.capabilities 对应 */
    id: string;
    /** 显示名称 */
    label: string;
    /** 图标名称（Lucide 图标） */
    icon: string;
    /** 描述 */
    description?: string;
    /** 渲染模式 */
    renderMode: CapabilityRenderMode;
    /** 按钮组件（renderMode 为 button 时使用） */
    ButtonComponent?: React.ComponentType<CapabilityComponentProps>;
    /** 面板组件（renderMode 为 panel 时使用） */
    PanelComponent?: React.ComponentType<CapabilityComponentProps>;
    /** 模态框组件（renderMode 为 modal 时使用） */
    ModalComponent?: React.ComponentType<CapabilityComponentProps & { open: boolean; onClose: () => void }>;
    /** 排序权重（越小越靠前） */
    order?: number;
}

/**
 * 能力注册表
 */
export interface CapabilityRegistry {
    /** 注册能力 */
    register: (definition: CapabilityDefinition) => void;
    /** 获取能力定义 */
    get: (id: string) => CapabilityDefinition | undefined;
    /** 获取所有能力定义 */
    getAll: () => CapabilityDefinition[];
    /** 根据 ID 列表获取能力定义（保持顺序） */
    getByIds: (ids: string[]) => CapabilityDefinition[];
}

