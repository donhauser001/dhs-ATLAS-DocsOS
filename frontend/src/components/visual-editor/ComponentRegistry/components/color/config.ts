/**
 * Color 组件 - 配置
 */

import { ComponentMeta, ColorComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'color',
    name: '颜色选择',
    description: '颜色选择器，支持多种格式',
    icon: 'palette',
    hasOptions: false,
    category: 'input',
};

export const DEFAULT_PRESETS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#1e293b', '#ffffff',
];

export function createDefault(id: string): ColorComponentDefinition {
    return {
        type: 'color',
        id,
        label: '颜色',
        format: 'hex',
        presets: DEFAULT_PRESETS,
        allowAlpha: false,
        showInput: true,
    };
}

