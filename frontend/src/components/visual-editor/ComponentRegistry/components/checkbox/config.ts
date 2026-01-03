/**
 * Checkbox 组件 - 配置
 */

import { ComponentMeta, SelectComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'checkbox',
    name: '复选框',
    description: '多选复选框组',
    icon: 'check-square',
    hasOptions: true,
};

export function createDefault(id: string): SelectComponentDefinition {
    return {
        type: 'checkbox',
        id,
        label: '新复选框',
        options: [{ value: '选项 1' }],
    };
}

