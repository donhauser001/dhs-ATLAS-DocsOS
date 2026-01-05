/**
 * UserPicker 组件 - 配置
 */

import { ComponentMeta, UserPickerComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'user-picker',
    name: '用户选择',
    description: '从用户索引中选择用户',
    icon: 'users',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): UserPickerComponentDefinition {
    return {
        type: 'user-picker',
        id,
        label: '负责人',
        multiple: false,
        showAvatar: true,
        statusFilter: 'verified',
    };
}

