/**
 * Formula 组件 - 配置
 */

import { ComponentMeta, FormulaComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'formula',
    name: '公式字段',
    description: '复杂数学公式计算（使用 mathjs）',
    icon: 'sigma',
    hasOptions: false,
    category: 'smart',
};

export function createDefault(id: string): FormulaComponentDefinition {
    return {
        type: 'formula',
        id,
        label: '公式',
        formula: '',
        variables: {},
        errorValue: 'N/A',
    };
}

