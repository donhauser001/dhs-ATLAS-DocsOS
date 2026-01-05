/**
 * Progress 组件 - 配置
 */

import { ComponentMeta, ProgressComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'progress',
    name: '进度条',
    description: '进度展示，支持可编辑模式',
    icon: 'bar-chart-2',
    hasOptions: false,
    category: 'smart',
};

export function createDefault(id: string): ProgressComponentDefinition {
    return {
        type: 'progress',
        id,
        label: '进度',
        editable: false,
        showLabel: true,
        color: '#8b5cf6',
        trackColor: '#e2e8f0',
        height: 8,
    };
}

