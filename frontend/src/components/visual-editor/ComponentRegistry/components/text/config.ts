/**
 * Text 组件 - 配置
 */

import { ComponentMeta, TextComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'text',
    name: '单行文本',
    description: '单行文本输入',
    icon: 'type',
    hasOptions: false,
};

export function createDefault(id: string): TextComponentDefinition {
    return {
        type: 'text',
        id,
        label: '新文本',
    };
}

