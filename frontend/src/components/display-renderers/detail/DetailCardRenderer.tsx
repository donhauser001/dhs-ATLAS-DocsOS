import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Mail, Phone, Globe, Building2, Briefcase, ClipboardList, FileText, User, Calendar, DollarSign } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseDetailBlocks, getFieldDisplayValue, getStatusColor, DetailSection, ICON_MAP } from './types';

// 图标组件映射
const IconComponents: Record<string, React.ElementType> = {
    building: Building2,
    phone: Phone,
    briefcase: Briefcase,
    'clipboard-list': ClipboardList,
    'file-text': FileText,
    user: User,
    calendar: Calendar,
    mail: Mail,
    globe: Globe,
    dollar: DollarSign,
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
                    className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                    <Mail className="w-3.5 h-3.5" />
                    {displayValue}
                </a>
            );

        case 'phone':
            return (
                <a
                    href={`tel:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                    <Phone className="w-3.5 h-3.5" />
                    {displayValue}
                </a>
            );

        case 'currency':
            return <span className="font-semibold text-green-600">{displayValue}</span>;

        case 'textarea':
            return <p className="text-slate-600 whitespace-pre-wrap">{displayValue}</p>;

        default:
            return <span className="text-slate-800">{displayValue}</span>;
    }
};

// 详情区块卡片
const SectionCard: React.FC<{
    section: DetailSection;
    defaultExpanded?: boolean;
}> = ({ section, defaultExpanded = true }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const IconComponent = section.icon ? IconComponents[section.icon] : Building2;

    // 渲染单条记录的字段
    const renderFields = (data: Record<string, unknown>) => {
        return section.schema.map(field => {
            const fieldValue = getFieldDisplayValue(field, data[field.key]);
            return (
                <div key={field.key} className="py-3 border-b border-slate-100 last:border-0">
                    <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm text-slate-500">{field.label}</dt>
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
        });
    };

    // 渲染列表数据
    const renderList = (data: Record<string, unknown>[]) => {
        return (
            <div className="divide-y divide-slate-100">
                {data.map((item, index) => (
                    <div key={index} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-4">
                            {/* 时间/日期列 */}
                            {item.date && (
                                <div className="flex-shrink-0 w-24 text-sm text-slate-500">
                                    {new Date(item.date as string).toLocaleDateString('zh-CN', {
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
                        <IconComponent className="w-5 h-5 text-slate-600" />
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
    const sections = useMemo(() => parseDetailBlocks(bodyContent || ''), [bodyContent]);

    if (sections.length === 0) {
        return (
            <div className="max-w-[1200px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    没有找到详情数据
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto px-8 py-6">
            <div className="space-y-4">
                {sections.map((section, index) => (
                    <SectionCard
                        key={section.id || index}
                        section={section}
                        defaultExpanded={index < 3}
                    />
                ))}
            </div>
        </div>
    );
};

