/**
 * DocumentLink 组件 - 配置
 */

import { ComponentMeta, DocumentLinkComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'document-link',
    name: '文档链接',
    description: '链接到仓库中的其他文档',
    icon: 'file-text',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): DocumentLinkComponentDefinition {
    return {
        type: 'document-link',
        id,
        label: '关联文档',
        placeholder: '选择文档...',
        allowMultiple: false,
        showPath: false,
    };
}

