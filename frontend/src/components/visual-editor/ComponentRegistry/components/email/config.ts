/**
 * Email 组件 - 配置
 */

import { ComponentMeta, EmailComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'email',
    name: '邮箱',
    description: '邮箱地址输入，支持格式验证',
    icon: 'mail',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): EmailComponentDefinition {
    return {
        type: 'email',
        id,
        label: '邮箱',
        placeholder: '请输入邮箱地址',
    };
}

