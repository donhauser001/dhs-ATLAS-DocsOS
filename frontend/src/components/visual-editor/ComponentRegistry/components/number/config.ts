/**
 * Number 组件 - 配置
 */

import { ComponentMeta, NumberComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'number',
    name: '数字输入',
    description: '数字输入框',
    icon: 'hash',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): NumberComponentDefinition {
    return {
        type: 'number',
        id,
        label: '新数字',
        step: 1,
    };
}

