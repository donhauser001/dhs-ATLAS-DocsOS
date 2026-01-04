/**
 * DetailTabRenderer - 选项卡式详情视图
 * 
 * 每个数据块作为一个标签页，用户可以在不同数据块之间切换
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ExternalLink, Tag, Check, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseDetailBlocks, getFieldDisplayValue, getStatusColor, DetailSection } from './types';
import { useLabels } from '@/providers/LabelProvider';
import { cn } from '@/lib/utils';

// 动态获取 Lucide 图标组件
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!name) return null;
    const pascalCase = name
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{ className?: string; size?: number }> | null;
}

// 图标组件映射
const IconComponents: Record<string, React.ElementType> = {
    building: LucideIcons.Building2,
    phone: LucideIcons.Phone,
    briefcase: LucideIcons.Briefcase,
    'clipboard-list': LucideIcons.ClipboardList,
    'file-text': LucideIcons.FileText,
    user: LucideIcons.User,
    calendar: LucideIcons.Calendar,
    mail: LucideIcons.Mail,
    globe: LucideIcons.Globe,
    dollar: LucideIcons.DollarSign,
};

// 字段值渲染
const FieldValueDisplay: React.FC<{
    type: string;
    value: unknown;
    displayValue: string;
    option?: { color?: string; label?: string };
}> = ({ type, value, displayValue, option }) => {
    if (displayValue === '—') {
        return <span className="text-slate-400">—</span>;
    }

    switch (type) {
        case 'select':
            if (option?.color) {
                const colors = getStatusColor(option.color);
                return (
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                        {displayValue}
                    </span>
                );
            }
            return <span>{displayValue}</span>;

        case 'image':
        case 'avatar':
            const imgSrc = value as string;
            if (!imgSrc) {
                return <span className="text-slate-400">—</span>;
            }
            const finalSrc = imgSrc.startsWith('data:') || imgSrc.startsWith('http')
                ? imgSrc
                : `/api/files/preview?path=${encodeURIComponent(imgSrc)}`;
            return (
                <div className="inline-block">
                    <img
                        src={finalSrc}
                        alt="图片"
                        className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
                    />
                </div>
            );

        case 'url':
        case 'link':
            return (
                <a
                    href={value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                    {displayValue}
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            );

        case 'email':
            return (
                <a
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {displayValue}
                </a>
            );

        case 'phone':
            return (
                <a
                    href={`tel:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                    {displayValue}
                </a>
            );

        case 'currency':
            return <span className="font-semibold text-green-600">{displayValue}</span>;

        case 'textarea':
            return <p className="text-slate-600 whitespace-pre-wrap">{displayValue}</p>;

        case 'toggle':
        case 'boolean':
            const boolValue = value === true || value === 'true' || value === 1;
            return (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm ${boolValue ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {boolValue ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    {boolValue ? '是' : '否'}
                </span>
            );

        case 'tags':
            let tags: string[] = [];
            if (Array.isArray(value)) {
                tags = value.map(String);
            } else if (typeof value === 'string' && value !== 'null' && value !== '') {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        tags = parsed.map(String);
                    } else {
                        tags = value.split(',').map(t => t.trim()).filter(Boolean);
                    }
                } catch {
                    tags = value.split(',').map(t => t.trim()).filter(Boolean);
                }
            }
            if (tags.length === 0) {
                return <span className="text-slate-400">—</span>;
            }
            return (
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs">
                            <Tag className="w-3 h-3" />
                            {tag}
                        </span>
                    ))}
                </div>
            );

        case 'password':
            return <span className="text-slate-400 font-mono">••••••••</span>;

        default:
            return <span className="text-slate-800">{displayValue}</span>;
    }
};

// 头像字段组件 - 单独一行显示
const AvatarField: React.FC<{
    value: unknown;
}> = ({ value }) => {
    const imgSrc = value as string;
    if (!imgSrc) {
        return (
            <div className="py-2">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                    <LucideIcons.User className="w-10 h-10 text-slate-300" />
                </div>
            </div>
        );
    }
    const finalSrc = imgSrc.startsWith('data:') || imgSrc.startsWith('http')
        ? imgSrc
        : `/api/files/preview?path=${encodeURIComponent(imgSrc)}`;
    return (
        <div className="py-2">
            <img
                src={finalSrc}
                alt="头像"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
            />
        </div>
    );
};

// 单个字段项组件 - 左侧大图标 + 右侧标签值
const FieldItem: React.FC<{
    fieldKey: string;
    type: string;
    value: unknown;
    displayValue: string;
    displayLabel: string;
    option?: { color?: string; label?: string };
    resolveIcon: (key: string) => React.ReactNode;
}> = ({ fieldKey, type, value, displayValue, displayLabel, option, resolveIcon }) => {
    // 常规字段布局
    return (
        <div className="flex items-stretch gap-3">
            {/* 左侧图标区域 - 浅灰背景，占两行高度 */}
            <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0">
                <span className="text-slate-500 [&>svg]:w-5 [&>svg]:h-5">
                    {resolveIcon(fieldKey)}
                </span>
            </div>
            {/* 右侧标签 + 值 */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
                <dt className="text-xs text-slate-400 mb-0.5">{displayLabel}</dt>
                <dd className="text-sm text-slate-800">
                    <FieldValueDisplay
                        type={type}
                        value={value}
                        displayValue={displayValue}
                        option={option}
                    />
                </dd>
            </div>
        </div>
    );
};

// 选项卡内容面板
const TabPanel: React.FC<{
    section: DetailSection;
    resolveLabel: (key: string, componentLabel?: string) => string;
    resolveIcon: (key: string) => React.ReactNode;
}> = ({ section, resolveLabel, resolveIcon }) => {
    // 渲染字段
    const renderFields = (data: Record<string, unknown>) => {
        const schemaKeys = new Set(section.schema.map(f => f.key));
        const extraFields = Object.keys(data).filter(key => 
            !schemaKeys.has(key) && 
            !key.startsWith('_') &&
            data[key] !== null && 
            data[key] !== undefined &&
            data[key] !== ''
        );

        // 分离头像字段和普通字段
        const avatarFields = section.schema.filter(f => f.type === 'avatar' || f.type === 'image');
        const normalFields = section.schema.filter(f => f.type !== 'avatar' && f.type !== 'image');

        return (
            <div className="space-y-5">
                {/* 头像字段 - 单独一行 */}
                {avatarFields.map(field => {
                    const fieldValue = getFieldDisplayValue(field, data[field.key]);
                    return (
                        <AvatarField
                            key={field.key}
                            value={fieldValue.value}
                        />
                    );
                })}

                {/* 普通字段 - 两列布局 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                    {normalFields.map(field => {
                        const fieldValue = getFieldDisplayValue(field, data[field.key]);
                        const displayLabel = resolveLabel(field.key, field.label);
                        return (
                            <FieldItem
                                key={field.key}
                                fieldKey={field.key}
                                type={field.type}
                                value={fieldValue.value}
                                displayValue={fieldValue.displayValue}
                                displayLabel={displayLabel}
                                option={fieldValue.option}
                                resolveIcon={resolveIcon}
                            />
                        );
                    })}
                    {/* 额外字段 */}
                    {extraFields.map(key => {
                        const value = data[key];
                        let type = 'text';
                        if (typeof value === 'boolean') type = 'toggle';
                        else if (typeof value === 'string') {
                            if (value.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) type = 'image';
                            else if (value.startsWith('[')) type = 'tags';
                            else if (value.includes('@')) type = 'email';
                            else if (/^1\d{10}$/.test(value)) type = 'phone';
                        }
                        const displayValue = value === null || value === undefined || value === '' ? '—' : String(value);
                        const displayLabel = resolveLabel(key);
                        
                        return (
                            <FieldItem
                                key={key}
                                fieldKey={key}
                                type={type}
                                value={value}
                                displayValue={displayValue}
                                displayLabel={displayLabel}
                                resolveIcon={resolveIcon}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6">
            {!Array.isArray(section.data) ? (
                renderFields(section.data as Record<string, unknown>)
            ) : (
                <div className="space-y-6">
                    {section.data.map((item, index) => (
                        <div key={index} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                            {renderFields(item)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const DetailTabRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    const { getLabel: getLabelFromProvider, getIcon } = useLabels();
    const [activeTab, setActiveTab] = useState(0);
    
    const sections = useMemo(
        () => parseDetailBlocks(bodyContent || '', frontmatter),
        [bodyContent, frontmatter]
    );

    const resolveLabel = useCallback((key: string, componentLabel?: string): string => {
        if (componentLabel && componentLabel !== key) {
            return componentLabel;
        }
        const providerLabel = getLabelFromProvider(key);
        if (providerLabel && providerLabel !== key) {
            return providerLabel;
        }
        return key;
    }, [getLabelFromProvider]);

    const resolveIcon = useCallback((key: string): React.ReactNode => {
        const iconName = getIcon(key);
        const IconComponent = getLucideIcon(iconName);
        if (IconComponent) {
            return <IconComponent size={20} className="flex-shrink-0" />;
        }
        return <Tag size={20} className="flex-shrink-0" />;
    }, [getIcon]);

    if (sections.length === 0) {
        return (
            <div className="w-full max-w-[1200px] min-w-[800px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    没有找到详情数据
                </div>
            </div>
        );
    }

    const activeSection = sections[activeTab];

    return (
        <div className="w-full max-w-[1200px] min-w-[800px] mx-auto px-8 py-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* 选项卡导航 */}
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                    {sections.map((section, index) => {
                        const IconComponent = section.icon ? IconComponents[section.icon] : LucideIcons.FileText;
                        const isActive = index === activeTab;
                        
                        return (
                            <button
                                key={section.id || index}
                                onClick={() => setActiveTab(index)}
                                className={cn(
                                    'flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all relative',
                                    'hover:bg-white/50',
                                    isActive
                                        ? 'text-purple-700 bg-white border-b-2 border-purple-500 -mb-px'
                                        : 'text-slate-600 hover:text-slate-800'
                                )}
                            >
                                <IconComponent className={cn(
                                    'w-4 h-4',
                                    isActive ? 'text-purple-500' : 'text-slate-400'
                                )} />
                                {section.title}
                                {section.type === 'detail_list' && Array.isArray(section.data) && (
                                    <span className={cn(
                                        'text-xs px-1.5 py-0.5 rounded-full',
                                        isActive ? 'bg-purple-100 text-purple-600' : 'bg-slate-200 text-slate-500'
                                    )}>
                                        {section.data.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 选项卡内容 */}
                {activeSection && (
                    <TabPanel
                        section={activeSection}
                        resolveLabel={resolveLabel}
                        resolveIcon={resolveIcon}
                    />
                )}
            </div>
        </div>
    );
};

