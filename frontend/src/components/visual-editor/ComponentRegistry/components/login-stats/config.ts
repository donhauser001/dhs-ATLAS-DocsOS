/**
 * LoginStats 组件 - 配置
 */

import { ComponentMeta, LoginStatsComponentDefinition } from '../../types';

export const meta: ComponentMeta = {
    type: 'login-stats',
    name: '登录统计',
    description: '显示用户登录统计信息',
    icon: 'log-in',
    hasOptions: false,
    category: 'relation',
};

export function createDefault(id: string): LoginStatsComponentDefinition {
    return {
        type: 'login-stats',
        id,
        label: '登录统计',
        showLastLogin: true,
        showLoginCount: true,
        showDevice: false,
        showIp: false,
        showHistory: false,
        historyLimit: 5,
    };
}

