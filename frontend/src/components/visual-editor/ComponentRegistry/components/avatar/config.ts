/**
 * Avatar 组件 - 配置
 */

import { ComponentMeta, AvatarComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'avatar',
    name: '头像',
    description: '头像上传，支持图片裁切',
    icon: 'user-circle',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): AvatarComponentDefinition {
    return {
        type: 'avatar',
        id,
        label: '头像',
        aspectRatio: 1,
        maxSize: 2048, // 2MB
        directory: '/avatars', // 默认头像存储目录
    };
}

