/**
 * Toggle 组件 - 配置
 */

import { ComponentMeta, ToggleComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'toggle',
    name: '开关',
    description: '布尔值开关，用于是/否选择',
    icon: 'toggle-left',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): ToggleComponentDefinition {
    return {
        type: 'toggle',
        id,
        label: '开关',
        onLabel: '开启',
        offLabel: '关闭',
    };
}

