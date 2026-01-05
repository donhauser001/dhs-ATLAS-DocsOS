/**
 * RelationPicker 组件 - 配置
 */

import { ComponentMeta, RelationPickerComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'relation-picker',
    name: '关联选择',
    description: '从指定索引中选择关联记录',
    icon: 'link-2',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): RelationPickerComponentDefinition {
    return {
        type: 'relation-picker',
        id,
        label: '关联记录',
        displayField: 'name',
        multiple: false,
        showDetails: false,
    };
}

