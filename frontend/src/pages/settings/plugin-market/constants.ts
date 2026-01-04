/**
 * 插件市场常量配置
 */

import {
    Package,
    Palette,
    Puzzle,
    Grid3X3,
    Building,
    FileText,
    Settings,
    Users,
    Folder,
    CheckSquare,
    Calendar,
    StickyNote,
    Image,
    FolderOpen,
    FileType,
    Sun,
    Moon,
    Sparkles,
    Zap,
    Layout,
} from 'lucide-react';
import type { PluginType, PluginTypeConfig, TypeCategoryConfig } from './types';

/** 插件类型配置 */
export const PLUGIN_TYPES: PluginTypeConfig[] = [
    {
        id: 'type-package' as PluginType,
        label: '类型包',
        icon: Package,
        description: '文档类型模板',
        color: '#3B82F6',
    },
    {
        id: 'theme-package' as PluginType,
        label: '主题包',
        icon: Palette,
        description: '界面主题样式',
        color: '#8B5CF6',
    },
    {
        id: 'other' as PluginType,
        label: '其他',
        icon: Puzzle,
        description: '扩展功能',
        color: '#10B981',
    },
];

/** 类型包子分类 */
export const TYPE_CATEGORIES: TypeCategoryConfig[] = [
    { id: 'all', label: '全部', icon: Grid3X3 },
    { id: 'business', label: '业务', icon: Building },
    { id: 'content', label: '内容', icon: FileText },
    { id: 'system', label: '系统', icon: Settings },
];

/** 图标映射 */
export const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
    'building': Building,
    'user': Users,
    'folder': Folder,
    'check-square': CheckSquare,
    'file-text': FileText,
    'calendar': Calendar,
    'sticky-note': StickyNote,
    'images': Image,
    'folder-open': FolderOpen,
    'settings': Settings,
    'file-plus': FileType,
    'palette': Palette,
    'sun': Sun,
    'moon': Moon,
    'sparkles': Sparkles,
    'zap': Zap,
    'layout': Layout,
    'puzzle': Puzzle,
};

