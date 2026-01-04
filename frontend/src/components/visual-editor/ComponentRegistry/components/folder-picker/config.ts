/**
 * FolderPicker 组件 - 配置
 */

import { ComponentMeta, FolderPickerComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'folder-picker',
    name: '目录选择器',
    description: '选择一个或多个目录路径，支持多选',
    icon: 'folder-tree',
    hasOptions: false,
};

export function createDefault(id: string): FolderPickerComponentDefinition {
    return {
        type: 'folder-picker',
        id,
        label: '目录',
        multiple: true,
        placeholder: '点击选择目录...',
    };
}

