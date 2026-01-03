/**
 * Radio 组件 - 配置
 */

import { ComponentMeta, SelectComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'radio',
    name: '单选按钮',
    description: '单选按钮组',
    icon: 'circle-dot',
    hasOptions: true,
};

export function createDefault(id: string): SelectComponentDefinition {
    return {
        type: 'radio',
        id,
        label: '新单选按钮',
        options: [{ value: '选项 1' }],
    };
}

