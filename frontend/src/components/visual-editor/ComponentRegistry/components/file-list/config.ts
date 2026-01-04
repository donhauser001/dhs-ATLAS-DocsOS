/**
 * FileList 组件 - 配置
 */

import { ComponentMeta, FileListComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'file-list',
    name: '文件列表',
    description: '展示文件列表，支持下载和删除',
    icon: 'files',
    hasOptions: false,
};

export function createDefault(id: string): FileListComponentDefinition {
    return {
        type: 'file-list',
        id,
        label: '附件',
        allowDownload: true,
        allowDelete: false,
        displayMode: 'list',
    };
}

