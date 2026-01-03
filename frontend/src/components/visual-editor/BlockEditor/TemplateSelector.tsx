/**
 * TemplateSelector - 数据模板选择器
 * 
 * 用于在创建数据块时选择模板
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Search,
    ChevronRight,
    Database,
    Layers,
    RefreshCw,
    FileText,
    Sparkles,
} from 'lucide-react';
import { useLabels } from '@/providers/LabelProvider';
import {
    fetchTemplateConfig,
    generateFromTemplate,
    type DataTemplateConfig,
    type DataTemplate,
    type TemplateComponent,
} from '@/api/data-templates';

interface TemplateSelectorProps {
    /** 选择模板回调，返回生成的 YAML 内容和可选的组件 */
    onSelect: (yamlContent: string, components?: Record<string, TemplateComponent>) => void;
    /** 关闭回调 */
    onClose: () => void;
    /** 选择空白模板回调（使用默认固定字段） */
    onSelectBlank?: () => void;
}

export function TemplateSelector({ onSelect, onClose, onSelectBlank }: TemplateSelectorProps) {
    const { getLabel } = useLabels();
    const [config, setConfig] = useState<DataTemplateConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // 加载配置
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await fetchTemplateConfig();
            setConfig(data);
            // 默认展开第一个分类
            if (data.categories.length > 0) {
                setExpandedCategory(data.categories[0].id);
            }
        } catch (err) {
            console.error('Failed to load template config:', err);
        } finally {
            setLoading(false);
        }
    };

    // 过滤模板
    const filteredCategories = useMemo(() => {
        if (!config) return [];

        return config.categories
            .map((category) => ({
                ...category,
                templates: category.templates.filter((template) => {
                    if (!searchTerm) return true;
                    const term = searchTerm.toLowerCase();
                    return (
                        template.name.toLowerCase().includes(term) ||
                        template.dataType.toLowerCase().includes(term) ||
                        (template.description?.toLowerCase().includes(term) ?? false)
                    );
                }),
            }))
            .filter((category) => category.templates.length > 0);
    }, [config, searchTerm]);

    // 统计模板数量
    const totalTemplates = useMemo(() => {
        return filteredCategories.reduce((sum, cat) => sum + cat.templates.length, 0);
    }, [filteredCategories]);

    // 选择模板
    const handleSelectTemplate = async (template: DataTemplate) => {
        setGenerating(true);
        try {
            const result = await generateFromTemplate(template.id);
            onSelect(result.yaml, result.components);
            onClose();
        } catch (err) {
            console.error('Failed to generate from template:', err);
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 p-6 text-center">
                <RefreshCw size={20} className="animate-spin mx-auto text-purple-400 mb-2" />
                <div className="text-slate-400 text-sm">加载模板...</div>
            </div>
        );
    }

    return (
        <div className="w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* 头部 */}
            <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Database size={14} className="text-amber-500" />
                        选择数据模板
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* 搜索框 */}
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="搜索模板..."
                        className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400"
                        autoFocus
                    />
                </div>
            </div>

            {/* 快速选项 */}
            <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                <button
                    onClick={() => {
                        onSelectBlank?.();
                        onClose();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white 
            transition-colors group text-left"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 
            flex items-center justify-center group-hover:from-purple-100 group-hover:to-purple-200">
                        <Sparkles size={16} className="text-slate-400 group-hover:text-purple-500" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-700 group-hover:text-purple-700">
                            空白数据块
                        </div>
                        <div className="text-[10px] text-slate-400">
                            仅包含基础固定字段
                        </div>
                    </div>
                </button>
            </div>

            {/* 模板列表 */}
            <div className="max-h-[320px] overflow-y-auto">
                {generating ? (
                    <div className="px-4 py-8 text-center">
                        <RefreshCw size={20} className="animate-spin mx-auto text-amber-400 mb-2" />
                        <div className="text-slate-400 text-sm">生成中...</div>
                    </div>
                ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <div key={category.id} className="border-b border-slate-50 last:border-0">
                            {/* 分类标题 */}
                            <button
                                onClick={() =>
                                    setExpandedCategory(expandedCategory === category.id ? null : category.id)
                                }
                                className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Layers size={14} className="text-slate-400" />
                                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        {category.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                        {category.templates.length}
                                    </span>
                                    <ChevronRight
                                        size={14}
                                        className={`text-slate-400 transition-transform ${expandedCategory === category.id ? 'rotate-90' : ''
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* 模板列表 */}
                            {(expandedCategory === category.id || searchTerm) && (
                                <div className="pb-1">
                                    {category.templates.map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleSelectTemplate(template)}
                                            className="w-full flex items-start gap-3 px-4 py-2 hover:bg-amber-50 
                        transition-colors group text-left"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 
                        flex items-center justify-center flex-shrink-0 mt-0.5
                        group-hover:from-amber-200 group-hover:to-amber-300">
                                                <FileText size={14} className="text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-700 group-hover:text-amber-700">
                                                    {template.name}
                                                </div>
                                                {template.description && (
                                                    <div className="text-[10px] text-slate-400 truncate">
                                                        {template.description}
                                                    </div>
                                                )}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {template.fields.slice(0, 4).map((field) => (
                                                        <span
                                                            key={field.key}
                                                            className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded"
                                                        >
                                                            {getLabel(field.key)}
                                                        </span>
                                                    ))}
                                                    {template.fields.length > 4 && (
                                                        <span className="text-[9px] text-slate-400">
                                                            +{template.fields.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-8 text-center">
                        <Database className="h-10 w-10 mx-auto text-slate-200 mb-2" />
                        <div className="text-slate-400 text-sm">
                            {searchTerm ? '没有匹配的模板' : '暂无可用模板'}
                        </div>
                    </div>
                )}
            </div>

            {/* 底部提示 */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                        {totalTemplates} 个可用模板
                    </span>
                    <a
                        href="/settings/data-templates"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-amber-500 hover:text-amber-600"
                    >
                        管理模板 →
                    </a>
                </div>
            </div>
        </div>
    );
}

export default TemplateSelector;

