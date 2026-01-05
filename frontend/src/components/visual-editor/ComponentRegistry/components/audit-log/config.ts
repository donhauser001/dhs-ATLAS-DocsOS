/**
 * AuditLog 组件 - 配置
 */

import { ComponentMeta, AuditLogComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'audit-log',
    name: '审计日志',
    description: '显示文档变更历史',
    icon: 'history',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): AuditLogComponentDefinition {
    return {
        type: 'audit-log',
        id,
        label: '变更历史',
        limit: 10,
        showUser: true,
        showDiff: false,
    };
}

