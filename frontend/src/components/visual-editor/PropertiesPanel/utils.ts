/**
 * PropertiesPanel 工具函数和常量
 */

import React from 'react';
import {
    Type,
    Hash,
    Star,
    Calendar,
    CheckSquare,
    ChevronDown,
    AlignLeft,
    Tag,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

/**
 * 颜色样式映射 - 与标签系统保持一致
 * 颜色名称来自系统标签配置（如 'blue', 'green', 'red'）
 */
export const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
    red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

// 默认颜色轮换（用于没有注册颜色的标签）
export const DEFAULT_TAG_COLORS = ['violet', 'pink', 'blue', 'emerald', 'amber', 'cyan'];

// 默认系统属性顺序
// 必填字段在前，配置字段在后
export const DEFAULT_SYSTEM_ORDER = [
    // 必填基础字段
    'title',
    'author',
    'created',
    'updated',
    'version',
    // 文档分类配置
    'document_type',
    'atlas.function',
    'atlas.display',
    // 能力配置
    'atlas.capabilities',
];

/**
 * 根据颜色名称获取颜色类
 * @param colorName 颜色名称（来自标签系统，如 'blue', 'green'）
 * @returns 颜色类配置
 */
export function getColorClasses(colorName?: string) {
    if (colorName && COLOR_CLASSES[colorName]) {
        return COLOR_CLASSES[colorName];
    }
    return COLOR_CLASSES.slate; // 默认颜色
}

/**
 * 根据索引获取默认标签颜色（用于没有注册颜色的标签）
 * @param index 索引
 * @returns 颜色类配置
 */
export function getDefaultTagColor(index: number) {
    const colorName = DEFAULT_TAG_COLORS[index % DEFAULT_TAG_COLORS.length];
    return COLOR_CLASSES[colorName];
}

/**
 * 格式化日期显示
 */
export function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    } catch {
        return dateStr;
    }
}

/**
 * 格式化相对时间显示（如 "3天前"、"刚刚"）
 */
export function formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        if (diffSec < 60) return '刚刚';
        if (diffMin < 60) return `${diffMin}分钟前`;
        if (diffHour < 24) return `${diffHour}小时前`;
        if (diffDay < 7) return `${diffDay}天前`;
        if (diffWeek < 4) return `${diffWeek}周前`;
        if (diffMonth < 12) return `${diffMonth}个月前`;
        if (diffYear >= 1) return `${diffYear}年前`;

        return formatDateDisplay(dateStr);
    } catch {
        return dateStr;
    }
}

/**
 * 获取组件图标
 */
export function getComponentIcon(iconName: string): React.ReactNode {
    const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
        'type': Type,
        'hash': Hash,
        'star': Star,
        'calendar': Calendar,
        'check-square': CheckSquare,
        'chevron-down': ChevronDown,
        'align-left': AlignLeft,
    };

    const IconComponent = IconMap[iconName];
    if (IconComponent) {
        return React.createElement(IconComponent, { className: "w-3.5 h-3.5 text-slate-400" });
    }

    // 尝试从 Lucide 动态获取
    const pascalCase = iconName
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    const DynamicIcon = (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ className?: string }>;
    if (DynamicIcon) {
        return React.createElement(DynamicIcon, { className: "w-3.5 h-3.5 text-slate-400" });
    }

    return React.createElement(Tag, { className: "w-3.5 h-3.5 text-slate-400" });
}

/**
 * 获取 Lucide 图标组件
 */
export function getLucideIcon(iconName: string): React.ComponentType<{ size?: number; className?: string }> | null {
    const pascalCase = iconName
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ size?: number; className?: string }> | null;
}

