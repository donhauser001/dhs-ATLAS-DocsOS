/**
 * IdCard 组件 - 配置
 */

import { ComponentMeta, IdCardComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'id-card',
    name: '身份证号',
    description: '身份证号码输入，支持格式验证和隐私保护',
    icon: 'credit-card',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): IdCardComponentDefinition {
    return {
        type: 'id-card',
        id,
        label: '身份证号',
        placeholder: '请输入身份证号',
        masked: true,
    };
}

