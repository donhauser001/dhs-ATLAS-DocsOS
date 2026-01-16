/**
 * DetailTabRenderer - 选项卡式详情视图
 * 
 * 每个数据块作为一个标签页，用户可以在不同数据块之间切换
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Tag } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseDetailBlocks, getFieldDisplayValue, DetailSection } from './types';
import { useLabels } from '@/providers/LabelProvider';
import { cn } from '@/lib/utils';
import {
    IconComponents,
    getLucideIcon,
    LucideIcons,
    AvatarField,
    FieldItem
} from './shared';

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
                        let displayValue = '—';

                        if (value === null || value === undefined || value === '') {
                            displayValue = '—';
                        } else if (typeof value === 'boolean') {
                            type = 'toggle';
                            displayValue = value ? '是' : '否';
                        } else if (typeof value === 'object' && !Array.isArray(value)) {
                            // 对象类型 - 可能是 user-auth 等复合组件
                            type = 'object';
                            displayValue = '__object__';
                        } else if (Array.isArray(value)) {
                            type = 'tags';
                            displayValue = value.join(', ');
                        } else if (typeof value === 'string') {
                            if (value.startsWith('data:image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) type = 'image';
                            else if (value.startsWith('[')) type = 'tags';
                            else if (value.includes('@')) type = 'email';
                            else if (/^1\d{10}$/.test(value)) type = 'phone';
                            displayValue = value;
                        } else {
                            displayValue = String(value);
                        }

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
                                {IconComponent && (
                                    <IconComponent className={cn(
                                        'w-4 h-4',
                                        isActive ? 'text-purple-500' : 'text-slate-400'
                                    )} />
                                )}
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
