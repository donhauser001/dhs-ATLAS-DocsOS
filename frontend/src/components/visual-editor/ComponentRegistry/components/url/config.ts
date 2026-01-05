/**
 * URL 组件 - 配置
 */

import { ComponentMeta, UrlComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'url',
    name: 'URL链接',
    description: 'URL链接输入，支持验证和跳转',
    icon: 'link',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): UrlComponentDefinition {
    return {
        type: 'url',
        id,
        label: '链接',
        placeholder: '请输入URL...',
        showPreview: false,
        openInNewTab: true,
        allowedProtocols: ['http', 'https'],
    };
}

