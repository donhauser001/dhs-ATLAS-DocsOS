/**
 * IdGenerator 组件 - 配置
 */

import { ComponentMeta, IdGeneratorComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'id-generator',
    name: 'ID生成器',
    description: '自动生成唯一ID，支持多种格式',
    icon: 'hash',
    hasOptions: false,
};

export function createDefault(id: string): IdGeneratorComponentDefinition {
    return {
        type: 'id-generator',
        id,
        label: '编号',
        prefix: '',
        length: 8,
        format: 'alphanumeric',
        autoGenerate: true,
        editable: false,
        uppercase: true,
    };
}

