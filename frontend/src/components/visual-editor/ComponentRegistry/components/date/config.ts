/**
 * Date 组件 - 配置
 */

import { ComponentMeta, DateComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'date',
    name: '日期选择',
    description: '日期选择器',
    icon: 'calendar',
    hasOptions: false,
    category: 'input',
};

export function createDefault(id: string): DateComponentDefinition {
    return {
        type: 'date',
        id,
        label: '新日期',
        format: 'YYYY-MM-DD',
        includeTime: false,
    };
}

