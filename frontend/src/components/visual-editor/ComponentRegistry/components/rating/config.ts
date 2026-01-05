/**
 * Rating 组件 - 配置
 */

import { ComponentMeta, RatingComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'rating',
    name: '评分',
    description: '星级评分',
    icon: 'star',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): RatingComponentDefinition {
    return {
        type: 'rating',
        id,
        label: '新评分',
        max: 5,
        allowHalf: false,
    };
}

