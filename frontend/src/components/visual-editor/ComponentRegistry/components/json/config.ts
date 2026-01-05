/**
 * JSON 组件 - 配置
 */

import { ComponentMeta, JsonComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'json',
    name: 'JSON编辑',
    description: 'JSON数据编辑器，支持语法高亮',
    icon: 'braces',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): JsonComponentDefinition {
    return {
        type: 'json',
        id,
        label: 'JSON数据',
        minHeight: 150,
        maxHeight: 400,
        readOnly: false,
    };
}

