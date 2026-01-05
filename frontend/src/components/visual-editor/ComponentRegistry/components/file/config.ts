/**
 * File 组件 - 配置
 */

import { ComponentMeta, FileComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'file',
    name: '文件选择',
    description: '选择单个文件',
    icon: 'file',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): FileComponentDefinition {
    return {
        type: 'file',
        id,
        label: '新文件',
    };
}

