/**
 * DetailCardRenderer - 卡片式详情视图
 * 
 * 每个数据块作为一个可折叠的卡片
 */

import React, { useMemo, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Tag } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseDetailBlocks, getFieldDisplayValue, DetailSection } from './types';
import { useLabels } from '@/providers/LabelProvider';
import {
    IconComponents,
    getLucideIcon,
    LucideIcons,
    FieldValueDisplay
} from './shared';

// 详情区块卡片
const SectionCard: React.FC<{
    section: DetailSection;
    defaultExpanded?: boolean;
    resolveLabel: (key: string, componentLabel?: string) => string;
    resolveIcon: (key: string) => React.ReactNode;
}> = ({ section, defaultExpanded = true, resolveLabel, resolveIcon }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const IconComponent = section.icon ? IconComponents[section.icon] : LucideIcons.Building2;

    // 渲染单条记录的字段
    const renderFields = (data: Record<string, unknown>) => {
        // 收集 schema 中定义的字段 key
        const schemaKeys = new Set(section.schema.map(f => f.key));

        // 收集 data 中存在但不在 schema 中的额外字段
        const extraFields = Object.keys(data).filter(key =>
            !schemaKeys.has(key) &&
            !key.startsWith('_') && // 忽略内部字段
            data[key] !== null &&
            data[key] !== undefined &&
            data[key] !== ''
        );

        return (
            <>
                {/* 渲染 schema 中定义的字段 */}
                {section.schema.map(field => {
                    const fieldValue = getFieldDisplayValue(field, data[field.key]);
                    // 三级标签优先级：组件定义 > 标签管理 > 字段键名
                    const displayLabel = resolveLabel(field.key, field.label);
                    return (
                        <div key={field.key} className="py-3 border-b border-slate-100 last:border-0">
                            <div className="grid grid-cols-3 gap-4">
                                <dt className="text-sm text-slate-500 flex items-center gap-1.5">
                                    {resolveIcon(field.key)}
                                    {displayLabel}
                                </dt>
                                <dd className="col-span-2 text-sm">
                                    <FieldValueDisplay
                                        type={field.type}
                                        value={fieldValue.value}
                                        displayValue={fieldValue.displayValue}
                                        option={fieldValue.option}
                                    />
                                </dd>
                            </div>
                        </div>
                    );
                })}
                {/* 渲染额外字段（存在于 data 中但不在 schema 中） */}
                {extraFields.map(key => {
                    const value = data[key];
                    // 推断类型
                    let type = 'text';
                    if (typeof value === 'boolean') type = 'toggle';
                    else if (typeof value === 'string') {
                        if (value.startsWith('data:image')) type = 'image';
                        // 识别图片文件路径（包含 avatar 或以图片扩展名结尾）
                        else if (value.includes('avatar') || /\.(jpg|jpeg|png|gif|webp)$/i.test(value)) type = 'image';
                        else if (value.startsWith('[') || Array.isArray(value)) type = 'tags';
                        else if (value.includes('@')) type = 'email';
                        else if (/^1\d{10}$/.test(value)) type = 'phone';
                    }

                    const displayValue = value === null || value === undefined || value === ''
                        ? '—'
                        : String(value);

                    // 额外字段也使用标签解析
                    const displayLabel = resolveLabel(key);

                    return (
                        <div key={key} className="py-3 border-b border-slate-100 last:border-0">
                            <div className="grid grid-cols-3 gap-4">
                                <dt className="text-sm text-slate-500 flex items-center gap-1.5">
                                    {resolveIcon(key)}
                                    {displayLabel}
                                </dt>
                                <dd className="col-span-2 text-sm">
                                    <FieldValueDisplay
                                        type={type}
                                        value={value}
                                        displayValue={displayValue}
                                    />
                                </dd>
                            </div>
                        </div>
                    );
                })}
            </>
        );
    };

    // 渲染列表数据
    const renderList = (data: Record<string, unknown>[]) => {
        return (
            <div className="divide-y divide-slate-100">
                {data.map((item, index) => (
                    <div key={index} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-4">
                            {/* 时间/日期列 */}
                            {item.date != null && (
                                <div className="flex-shrink-0 w-24 text-sm text-slate-500">
                                    {new Date(String(item.date)).toLocaleDateString('zh-CN', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </div>
                            )}
                            {/* 主要内容 */}
                            <div className="flex-1 min-w-0">
                                {section.schema.filter(f => f.key !== 'date').map(field => {
                                    const fieldValue = getFieldDisplayValue(field, item[field.key]);
                                    if (field.key === 'content' || field.key === 'name') {
                                        return (
                                            <div key={field.key} className="font-medium text-slate-800">
                                                <FieldValueDisplay
                                                    type={field.type}
                                                    value={fieldValue.value}
                                                    displayValue={fieldValue.displayValue}
                                                    option={fieldValue.option}
                                                />
                                            </div>
                                        );
                                    }
                                    if (field.type === 'select' && fieldValue.option) {
                                        return (
                                            <span key={field.key} className="mr-2">
                                                <FieldValueDisplay
                                                    type={field.type}
                                                    value={fieldValue.value}
                                                    displayValue={fieldValue.displayValue}
                                                    option={fieldValue.option}
                                                />
                                            </span>
                                        );
                                    }
                                    return null;
                                })}
                                {/* 次要信息 */}
                                <div className="mt-1 text-sm text-slate-500">
                                    {section.schema.filter(f =>
                                        f.key !== 'date' &&
                                        f.key !== 'content' &&
                                        f.key !== 'name' &&
                                        f.type !== 'select'
                                    ).map(field => {
                                        const val = item[field.key];
                                        if (!val) return null;
                                        return (
                                            <span key={field.key} className="mr-3">
                                                {field.label}: {String(val)}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 卡片头部 */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                        {IconComponent && <IconComponent className="w-5 h-5 text-slate-600" />}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                    {section.type === 'detail_list' && Array.isArray(section.data) && (
                        <span className="text-sm text-slate-500">({section.data.length})</span>
                    )}
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                )}
            </button>

            {/* 卡片内容 */}
            {isExpanded && (
                <div className="px-5 pb-5">
                    {section.type === 'detail_section' && !Array.isArray(section.data) ? (
                        <dl>{renderFields(section.data as Record<string, unknown>)}</dl>
                    ) : Array.isArray(section.data) ? (
                        renderList(section.data)
                    ) : null}
                </div>
            )}
        </div>
    );
};

export const DetailCardRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    // 获取标签管理的 getLabel 和 getIcon
    const { getLabel: getLabelFromProvider, getIcon } = useLabels();

    // 传递 frontmatter 以便从 _components 构建 schema
    const sections = useMemo(
        () => parseDetailBlocks(bodyContent || '', frontmatter),
        [bodyContent, frontmatter]
    );

    /**
     * 三级标签优先级解析（与编辑器逻辑一致）
     * 1. 组件定义的标签（componentLabel）
     * 2. 标签管理系统的标签（LabelProvider）
     * 3. 字段键名（兜底）
     */
    const resolveLabel = useCallback((key: string, componentLabel?: string): string => {
        // 1. 优先使用组件定义的标签
        if (componentLabel && componentLabel !== key) {
            return componentLabel;
        }
        // 2. 其次使用标签管理的标签
        const providerLabel = getLabelFromProvider(key);
        if (providerLabel && providerLabel !== key) {
            return providerLabel;
        }
        // 3. 兜底：返回字段键名
        return key;
    }, [getLabelFromProvider]);

    /**
     * 获取字段图标（与编辑器逻辑一致）
     */
    const resolveIcon = useCallback((key: string): React.ReactNode => {
        const iconName = getIcon(key);
        const IconComponent = getLucideIcon(iconName);
        if (IconComponent) {
            return <IconComponent size={14} className="text-slate-400 flex-shrink-0" />;
        }
        // 默认图标
        return <Tag size={14} className="text-slate-300 flex-shrink-0" />;
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

    return (
        <div className="w-full max-w-[1200px] min-w-[800px] mx-auto px-8 py-6">
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <SectionCard
                        key={section.id || index}
                        section={section}
                        defaultExpanded={index < 3}
                        resolveLabel={resolveLabel}
                        resolveIcon={resolveIcon}
                    />
                ))}
            </div>
        </div>
    );
};
