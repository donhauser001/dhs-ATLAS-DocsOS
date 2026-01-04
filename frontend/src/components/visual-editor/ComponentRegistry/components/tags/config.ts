/**
 * Tags 组件 - 配置
 */

import { ComponentMeta, TagsComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'tags',
    name: '标签',
    description: '多标签输入，支持预设选项和自定义',
    icon: 'tags',
    hasOptions: false,
};

export function createDefault(id: string): TagsComponentDefinition {
    return {
        type: 'tags',
        id,
        label: '标签',
        allowCreate: true,
        placeholder: '输入标签后按回车添加...',
    };
}

