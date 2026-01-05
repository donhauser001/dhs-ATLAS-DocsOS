/**
 * IconPicker 组件 - 配置
 */

import { ComponentMeta, IconPickerComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'icon-picker',
    name: '图标选择',
    description: '从 Lucide 图标库中选择图标',
    icon: 'image',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): IconPickerComponentDefinition {
    return {
        type: 'icon-picker',
        id,
        label: '图标',
        searchable: true,
        showLabel: false,
    };
}

