/**
 * Password 组件 - 配置
 * 
 * 安全密码组件，支持密码强度检测和 bcrypt 加密
 */

import { ComponentMeta, PasswordComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'password',
    name: '安全密码',
    description: '密码输入，支持强度检测和加密存储',
    icon: 'lock',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): PasswordComponentDefinition {
    return {
        type: 'password',
        id,
        label: '密码',
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecial: false,
        showStrengthMeter: true,
        allowGenerate: true,
        generatedLength: 16,
    };
}

