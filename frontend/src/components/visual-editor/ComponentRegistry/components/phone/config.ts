/**
 * Phone 组件 - 配置
 */

import { ComponentMeta, PhoneComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'phone',
    name: '手机号',
    description: '手机号码输入，支持格式验证',
    icon: 'phone',
    hasOptions: false,
};

export function createDefault(id: string): PhoneComponentDefinition {
    return {
        type: 'phone',
        id,
        label: '手机号',
        placeholder: '请输入手机号',
    };
}

