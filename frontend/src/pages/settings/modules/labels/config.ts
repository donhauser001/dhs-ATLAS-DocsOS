/**
 * 标签管理模块配置
 */

import { Tag } from 'lucide-react';
import { SettingModuleConfig } from '../../registry/types';
import { LabelSettings } from './LabelSettings';

const config: SettingModuleConfig = {
    meta: {
        id: 'labels',
        label: '标签管理',
        description: '配置字段的显示名称和图标',
        icon: Tag,
        category: 'system',
        order: 1,
    },
    Component: LabelSettings,
};

export default config;

