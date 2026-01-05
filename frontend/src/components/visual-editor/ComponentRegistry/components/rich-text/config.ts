/**
 * RichText 组件 - 配置
 */

import { ComponentMeta, RichTextComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'rich-text',
    name: '富文本',
    description: '富文本编辑器，支持格式化',
    icon: 'file-text',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): RichTextComponentDefinition {
    return {
        type: 'rich-text',
        id,
        label: '内容',
        placeholder: '输入内容...',
        minHeight: 150,
        maxHeight: 400,
    };
}

