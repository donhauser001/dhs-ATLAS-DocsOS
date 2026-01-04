import React, { useMemo, useState } from 'react';
import { Edit2, Save, X, ExternalLink, Mail, Phone, Building2, Briefcase, ClipboardList, FileText, User, Calendar, DollarSign } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseDetailBlocks, getFieldDisplayValue, getStatusColor, DetailSection } from './types';

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
    dollar: DollarSign,
};

// 表单字段渲染
const FormField: React.FC<{
    schema: { key: string; label: string; type: string; options?: { value: string; label: string; color?: string }[] };
    value: unknown;
    isEditing: boolean;
    onChange?: (value: unknown) => void;
}> = ({ schema, value, isEditing, onChange }) => {
    const fieldValue = getFieldDisplayValue(schema, value);

    // 只读模式
    if (!isEditing) {
        return (
            <div className="py-3">
                <label className="block text-sm font-medium text-slate-500 mb-1">{schema.label}</label>
                <div className="text-slate-800">
                    {fieldValue.displayValue === '—' ? (
                        <span className="text-slate-400">—</span>
                    ) : schema.type === 'select' && fieldValue.option?.color ? (
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(fieldValue.option.color).bg} ${getStatusColor(fieldValue.option.color).text}`}>
                            {fieldValue.displayValue}
                        </span>
                    ) : schema.type === 'url' || schema.type === 'link' ? (
                        <a href={value as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            {fieldValue.displayValue}
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    ) : schema.type === 'email' ? (
                        <a href={`mailto:${value}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            {fieldValue.displayValue}
                        </a>
                    ) : schema.type === 'phone' ? (
                        <a href={`tel:${value}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {fieldValue.displayValue}
                        </a>
                    ) : schema.type === 'currency' ? (
                        <span className="font-semibold text-green-600">{fieldValue.displayValue}</span>
                    ) : schema.type === 'textarea' ? (
                        <p className="whitespace-pre-wrap">{fieldValue.displayValue}</p>
                    ) : (
                        fieldValue.displayValue
                    )}
                </div>
            </div>
        );
    }

    // 编辑模式
    const inputClasses = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    switch (schema.type) {
        case 'select':
            return (
                <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{schema.label}</label>
                    <select
                        value={value as string || ''}
                        onChange={e => onChange?.(e.target.value)}
                        className={inputClasses}
                    >
                        <option value="">请选择</option>
                        {schema.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );

        case 'textarea':
            return (
                <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{schema.label}</label>
                    <textarea
                        value={value as string || ''}
                        onChange={e => onChange?.(e.target.value)}
                        rows={4}
                        className={inputClasses}
                    />
                </div>
            );

        case 'date':
            return (
                <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{schema.label}</label>
                    <input
                        type="date"
                        value={value as string || ''}
                        onChange={e => onChange?.(e.target.value)}
                        className={inputClasses}
                    />
                </div>
            );

        case 'number':
        case 'currency':
            return (
                <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{schema.label}</label>
                    <input
                        type="number"
                        value={value as number || ''}
                        onChange={e => onChange?.(Number(e.target.value))}
                        className={inputClasses}
                    />
                </div>
            );

        default:
            return (
                <div className="py-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">{schema.label}</label>
                    <input
                        type={schema.type === 'email' ? 'email' : schema.type === 'url' ? 'url' : 'text'}
                        value={value as string || ''}
                        onChange={e => onChange?.(e.target.value)}
                        className={inputClasses}
                    />
                </div>
            );
    }
};

// 表单区块
const FormSection: React.FC<{
    section: DetailSection;
    isEditing: boolean;
}> = ({ section, isEditing }) => {
    const IconComponent = section.icon ? IconComponents[section.icon] : Building2;
    const data = section.data as Record<string, unknown>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 区块标题 */}
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                    <IconComponent className="w-5 h-5 text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
            </div>

            {/* 表单字段 */}
            <div className="px-5 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {section.schema.map(field => (
                        <FormField
                            key={field.key}
                            schema={field}
                            value={data[field.key]}
                            isEditing={isEditing}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// 列表区块
const ListSection: React.FC<{
    section: DetailSection;
}> = ({ section }) => {
    const IconComponent = section.icon ? IconComponents[section.icon] : ClipboardList;
    const data = section.data as Record<string, unknown>[];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* 区块标题 */}
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <IconComponent className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                    <span className="text-sm text-slate-500">({data.length})</span>
                </div>
            </div>

            {/* 列表内容 */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200">
                            {section.schema.map(field => (
                                <th key={field.key} className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                                    {field.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                {section.schema.map(field => {
                                    const fieldValue = getFieldDisplayValue(field, item[field.key]);
                                    return (
                                        <td key={field.key} className="px-4 py-3 text-sm text-slate-700">
                                            {field.type === 'select' && fieldValue.option?.color ? (
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fieldValue.option.color).bg} ${getStatusColor(fieldValue.option.color).text}`}>
                                                    {fieldValue.displayValue}
                                                </span>
                                            ) : field.type === 'link' ? (
                                                <a href={item[field.key] as string} className="text-blue-600 hover:underline">
                                                    查看
                                                </a>
                                            ) : (
                                                fieldValue.displayValue
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const DetailFormRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
    readonly,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const sections = useMemo(() => parseDetailBlocks(bodyContent || ''), [bodyContent]);

    const detailSections = sections.filter(s => s.type === 'detail_section');
    const listSections = sections.filter(s => s.type === 'detail_list');

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
            {/* 工具栏 */}
            {!readonly && (
                <div className="flex justify-end mb-4">
                    {isEditing ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                取消
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                保存
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" />
                            编辑
                        </button>
                    )}
                </div>
            )}

            {/* 详情表单区块 */}
            <div className="space-y-4">
                {detailSections.map((section, index) => (
                    <FormSection
                        key={section.id || index}
                        section={section}
                        isEditing={isEditing}
                    />
                ))}
            </div>

            {/* 列表区块 */}
            {listSections.length > 0 && (
                <div className="mt-6 space-y-4">
                    {listSections.map((section, index) => (
                        <ListSection
                            key={section.id || index}
                            section={section}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

