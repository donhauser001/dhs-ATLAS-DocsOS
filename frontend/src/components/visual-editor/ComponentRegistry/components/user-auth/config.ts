/**
 * User Auth 组件 - 配置
 * 
 * Phase 4.2: 用户认证字段组复合组件
 * 严格标识符：__atlas_user_auth__
 */

import { ComponentMeta, UserAuthComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'user-auth',
    name: '用户认证',
    description: '完整的用户认证字段组，支持登录凭证管理',
    icon: 'user-check',
    hasOptions: false,
    category: 'security',
};

export function createDefault(id: string): UserAuthComponentDefinition {
    return {
        type: 'user-auth',
        id,
        label: '用户认证',
        description: '用户登录凭证信息',
        isFieldGroup: true,
        dataBlockType: '__atlas_user_auth__',
        requireUsername: true,
        requireEmail: false,
        requirePhone: false,
        enableExpiration: false,
        defaultStatus: 'pending',
    };
}

