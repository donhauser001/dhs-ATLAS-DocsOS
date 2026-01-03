/**
 * Textarea 组件 - 配置
 */

import { ComponentMeta, TextareaComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'textarea',
    name: '多行文本',
    description: '多行文本输入',
    icon: 'align-left',
    hasOptions: false,
};

export function createDefault(id: string): TextareaComponentDefinition {
    return {
        type: 'textarea',
        id,
        label: '新多行文本',
        rows: 3,
    };
}

