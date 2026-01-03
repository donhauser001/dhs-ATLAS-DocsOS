/**
 * 属性组件内部类型定义
 */

import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext } from '@/types/property';

/**
 * 基础组件 Props
 */
export interface BaseComponentProps {
    value: unknown;
    config: PropertyComponentConfig;
    onChange: (value: unknown) => void;
    context?: PropertyRenderContext;
}

/**
 * 配置面板 Props
 */
export interface ConfigPanelProps {
    config: PropertyComponentConfig;
    onChange: (config: PropertyComponentConfig) => void;
}

/**
 * 创建组件的工厂函数类型
 */
export type ComponentFactory = () => PropertyComponent;

/**
 * 样式常量
 */
export const COMPONENT_STYLES = {
    // 输入框基础样式
    input: `w-full px-3 py-2 text-sm rounded-md border border-slate-200 
          bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
          focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
          transition-colors`,

    // 只读标签样式
    badge: `inline-flex items-center px-2 py-0.5 rounded-md text-sm 
          bg-slate-100 text-slate-700`,

    // 行内样式
    inline: `inline-flex items-center gap-1 px-1.5 py-0.5 rounded 
           bg-purple-50 text-purple-700 text-sm font-medium`,

    // 失效态样式
    fallback: `inline-flex items-center gap-2 px-3 py-2 rounded-md 
             bg-amber-50 border border-amber-200 text-amber-700 text-sm`,
} as const;

