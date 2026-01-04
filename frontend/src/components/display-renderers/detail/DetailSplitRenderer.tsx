import React, { useMemo } from 'react';
import { ExternalLink, Mail, Phone, Building2, Briefcase, ClipboardList, FileText, User, Calendar, DollarSign, Star, MapPin, Globe } from 'lucide-react';
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
    globe: Globe,
};

// 主要信息卡片（左侧大卡片）
const PrimaryCard: React.FC<{
    section: DetailSection;
}> = ({ section }) => {
    const data = section.data as Record<string, unknown>;
    
    // 找出主要字段（公司名/标题）
    const titleField = section.schema.find(f => f.key === 'company_name' || f.key === 'name' || f.key === 'title');
    const descField = section.schema.find(f => f.type === 'textarea' || f.key === 'description');
    const otherFields = section.schema.filter(f => f !== titleField && f !== descField);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            {/* 标题区 */}
            {titleField && (
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {data[titleField.key] as string}
                    </h2>
                    {descField && data[descField.key] && (
                        <p className="mt-2 text-slate-600 leading-relaxed">
                            {data[descField.key] as string}
                        </p>
                    )}
                </div>
            )}

            {/* 其他字段 */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-100">
                {otherFields.map(field => {
                    const fieldValue = getFieldDisplayValue(field, data[field.key]);
                    if (fieldValue.displayValue === '—') return null;

                    return (
                        <div key={field.key} className="flex items-start gap-3">
                            <div className="p-1.5 bg-slate-100 rounded">
                                {field.type === 'url' ? <Globe className="w-4 h-4 text-slate-500" /> :
                                 field.key === 'address' ? <MapPin className="w-4 h-4 text-slate-500" /> :
                                 <Building2 className="w-4 h-4 text-slate-500" />}
                            </div>
                            <div>
                                <div className="text-xs text-slate-500">{field.label}</div>
                                <div className="text-sm text-slate-800">
                                    {field.type === 'select' && fieldValue.option?.color ? (
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fieldValue.option.color).bg} ${getStatusColor(fieldValue.option.color).text}`}>
                                            {fieldValue.displayValue}
                                        </span>
                                    ) : field.type === 'url' ? (
                                        <a href={data[field.key] as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {fieldValue.displayValue}
                                        </a>
                                    ) : (
                                        fieldValue.displayValue
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 侧边信息卡片
const SideCard: React.FC<{
    section: DetailSection;
}> = ({ section }) => {
    const IconComponent = section.icon ? IconComponents[section.icon] : Building2;
    const data = section.data as Record<string, unknown>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <IconComponent className="w-4 h-4 text-slate-500" />
                <h3 className="font-medium text-slate-700">{section.title}</h3>
            </div>
            <div className="p-4 space-y-3">
                {section.schema.map(field => {
                    const fieldValue = getFieldDisplayValue(field, data[field.key]);
                    
                    return (
                        <div key={field.key}>
                            <div className="text-xs text-slate-500 mb-0.5">{field.label}</div>
                            <div className="text-sm">
                                {fieldValue.displayValue === '—' ? (
                                    <span className="text-slate-400">—</span>
                                ) : field.type === 'select' && fieldValue.option?.color ? (
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fieldValue.option.color).bg} ${getStatusColor(fieldValue.option.color).text}`}>
                                        {fieldValue.displayValue}
                                    </span>
                                ) : field.type === 'email' ? (
                                    <a href={`mailto:${data[field.key]}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {fieldValue.displayValue}
                                    </a>
                                ) : field.type === 'phone' ? (
                                    <a href={`tel:${data[field.key]}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {fieldValue.displayValue}
                                    </a>
                                ) : field.type === 'currency' ? (
                                    <span className="font-semibold text-green-600">{fieldValue.displayValue}</span>
                                ) : (
                                    <span className="text-slate-800">{fieldValue.displayValue}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 活动时间线
const ActivityTimeline: React.FC<{
    section: DetailSection;
}> = ({ section }) => {
    const data = section.data as Record<string, unknown>[];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <ClipboardList className="w-4 h-4 text-slate-500" />
                <h3 className="font-medium text-slate-700">{section.title}</h3>
                <span className="text-sm text-slate-500">({data.length})</span>
            </div>
            <div className="p-4">
                <div className="relative">
                    {/* 时间线 */}
                    <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />
                    
                    <div className="space-y-4">
                        {data.slice(0, 5).map((item, index) => {
                            const typeField = section.schema.find(f => f.key === 'type');
                            const typeValue = typeField ? getFieldDisplayValue(typeField, item.type) : null;
                            
                            return (
                                <div key={index} className="relative pl-6">
                                    {/* 时间点 */}
                                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow ${
                                        typeValue?.option?.color 
                                            ? getStatusColor(typeValue.option.color).bg.replace('bg-', 'bg-') 
                                            : 'bg-slate-300'
                                    }`} />
                                    
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {typeValue?.option && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(typeValue.option.color).bg} ${getStatusColor(typeValue.option.color).text}`}>
                                                    {typeValue.displayValue}
                                                </span>
                                            )}
                                            <span className="text-xs text-slate-500">
                                                {item.date && new Date(item.date as string).toLocaleDateString('zh-CN')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 mt-1">{item.content as string}</p>
                                        {item.handler && (
                                            <p className="text-xs text-slate-500 mt-0.5">处理人: {item.handler as string}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {data.length > 5 && (
                    <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800">
                        查看全部 ({data.length})
                    </button>
                )}
            </div>
        </div>
    );
};

// 文档列表
const DocsList: React.FC<{
    section: DetailSection;
}> = ({ section }) => {
    const data = section.data as Record<string, unknown>[];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="font-medium text-slate-700">{section.title}</h3>
            </div>
            <div className="divide-y divide-slate-100">
                {data.map((item, index) => {
                    const typeField = section.schema.find(f => f.key === 'type');
                    const typeValue = typeField ? getFieldDisplayValue(typeField, item.type) : null;
                    
                    return (
                        <a 
                            key={index} 
                            href={item.link as string}
                            className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <div>
                                    <div className="text-sm font-medium text-slate-700">{item.name as string}</div>
                                    <div className="text-xs text-slate-500">
                                        {typeValue?.displayValue} · {item.date && new Date(item.date as string).toLocaleDateString('zh-CN')}
                                    </div>
                                </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-400" />
                        </a>
                    );
                })}
            </div>
        </div>
    );
};

export const DetailSplitRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    const sections = useMemo(() => parseDetailBlocks(bodyContent || ''), [bodyContent]);

    // 分类区块
    const primarySection = sections.find(s => s.id?.includes('basic') || s.title?.includes('基本'));
    const contactSection = sections.find(s => s.id?.includes('contact') || s.title?.includes('联系'));
    const businessSection = sections.find(s => s.id?.includes('business') || s.title?.includes('商务'));
    const activitySection = sections.find(s => s.type === 'detail_list' && (s.id?.includes('service') || s.title?.includes('记录')));
    const docsSection = sections.find(s => s.type === 'detail_list' && (s.id?.includes('doc') || s.title?.includes('文档')));

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
            <div className="flex gap-6">
                {/* 左侧主要内容 */}
                <div className="flex-1 space-y-4">
                    {primarySection && <PrimaryCard section={primarySection} />}
                    {activitySection && <ActivityTimeline section={activitySection} />}
                </div>

                {/* 右侧辅助信息 */}
                <div className="w-80 flex-shrink-0 space-y-4">
                    {contactSection && <SideCard section={contactSection} />}
                    {businessSection && <SideCard section={businessSection} />}
                    {docsSection && <DocsList section={docsSection} />}
                </div>
            </div>
        </div>
    );
};

