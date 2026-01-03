/**
 * Image 组件 - 配置
 */

import { ComponentMeta, ImageComponentDefinition } from '../../types';
import { IMAGE_EXTENSIONS } from '../../shared';

export const meta: ComponentMeta = {
    type: 'image',
    name: '图片选择',
    description: '选择单张图片',
    icon: 'image',
    hasOptions: false,
};

export function createDefault(id: string): ImageComponentDefinition {
    return {
        type: 'image',
        id,
        label: '新图片',
        accept: IMAGE_EXTENSIONS,
    };
}

