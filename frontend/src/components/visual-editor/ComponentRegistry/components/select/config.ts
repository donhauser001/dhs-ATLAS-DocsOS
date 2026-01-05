/**
 * Select 组件 - 配置
 */

import { ComponentMeta, SelectComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'select',
    name: '下拉选择',
    description: '单选下拉菜单',
    icon: 'chevron-down',
    hasOptions: true,
    category: 'input',
};

export function createDefault(id: string): SelectComponentDefinition {
    return {
        type: 'select',
        id,
        label: '新下拉选择',
        options: [{ value: '选项 1' }],
    };
}

