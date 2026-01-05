/**
 * Signature 组件 - 配置
 */

import { ComponentMeta, SignatureComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'signature',
    name: '手写签名',
    description: '手写签名板，保存为图片',
    icon: 'pen-tool',
    hasOptions: false,
    category: 'display',
};

export function createDefault(id: string): SignatureComponentDefinition {
    return {
        type: 'signature',
        id,
        label: '签名',
        canvasWidth: 400,
        canvasHeight: 200,
        strokeColor: '#000000',
        strokeWidth: 2,
        backgroundColor: '#ffffff',
    };
}

