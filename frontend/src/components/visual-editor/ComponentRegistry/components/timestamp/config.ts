/**
 * Timestamp 组件 - 配置
 * 
 * 时间戳组件，自动记录创建/更新时间
 */

import { ComponentMeta, TimestampComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'timestamp',
    name: '时间戳',
    description: '自动记录创建或更新时间',
    icon: 'clock',
    hasOptions: false,
    category: 'smart',
};

export function createDefault(id: string): TimestampComponentDefinition {
    return {
        type: 'timestamp',
        id,
        label: '创建时间',
        timestampType: 'created',
        format: 'YYYY-MM-DD HH:mm:ss',
        showRelative: false,
        autoUpdate: true,
    };
}

