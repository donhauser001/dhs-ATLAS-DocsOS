/**
 * MultiSelect 组件 - 配置
 */

import { ComponentMeta, SelectComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'multi-select',
    name: '多选下拉',
    description: '多选下拉菜单',
    icon: 'list-checks',
    hasOptions: true,
};

export function createDefault(id: string): SelectComponentDefinition {
    return {
        type: 'multi-select',
        id,
        label: '新多选下拉',
        options: [{ value: '选项 1' }],
    };
}

