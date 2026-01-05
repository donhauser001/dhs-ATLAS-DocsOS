/**
 * Computed 组件 - 配置
 */

import { ComponentMeta, ComputedComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'computed',
    name: '计算字段',
    description: '基于其他字段自动计算值',
    icon: 'calculator',
    hasOptions: false,
    category: 'smart',
};

export function createDefault(id: string): ComputedComponentDefinition {
    return {
        type: 'computed',
        id,
        label: '计算字段',
        expression: '',
        dependencies: [],
        decimals: 2,
    };
}

