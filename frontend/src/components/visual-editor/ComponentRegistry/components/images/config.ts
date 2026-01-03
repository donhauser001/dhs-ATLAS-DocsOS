/**
 * Images 组件 - 配置
 */

import { ComponentMeta, ImagesComponentDefinition } from '../../types';
import { IMAGE_EXTENSIONS } from '../../shared';

export const meta: ComponentMeta = {
    type: 'images',
    name: '多图片选择',
    description: '选择多张图片',
    icon: 'gallery-horizontal',
    hasOptions: false,
};

export function createDefault(id: string): ImagesComponentDefinition {
    return {
        type: 'images',
        id,
        label: '新多图片',
        accept: IMAGE_EXTENSIONS,
    };
}

