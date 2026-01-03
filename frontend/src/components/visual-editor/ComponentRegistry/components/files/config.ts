/**
 * Files 组件 - 配置
 */

import { ComponentMeta, FilesComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'files',
    name: '多文件选择',
    description: '选择多个文件',
    icon: 'files',
    hasOptions: false,
};

export function createDefault(id: string): FilesComponentDefinition {
    return {
        type: 'files',
        id,
        label: '新多文件',
    };
}

