/**
 * SystemProperties - 系统属性区组件
 * 
 * 显示不可删除的系统必填字段
 */

import React from 'react';
import { Lock, Info } from 'lucide-react';
import { VersionSelector } from '@/components/editor/smart-editor/VersionSelector';
import { DocumentTypeSelector } from '@/components/editor/smart-editor/DocumentTypeSelector';
import { FunctionSelector } from '@/components/editor/smart-editor/FunctionSelector';
import { CapabilitiesField } from '@/components/editor/smart-editor/CapabilitiesField';

export interface SystemPropertyValues {
    version?: string;
    document_type?: string;
    created?: string;
    updated?: string;
    author?: string;
    'atlas.function'?: string;
    'atlas.capabilities'?: string[];
    'atlas.entity_type'?: string;
}

export interface SystemPropertiesProps {
    /** 系统属性值 */
    values: SystemPropertyValues;
    /** 值变更回调 */
    onChange: (key: string, value: unknown) => void;
    /** 是否禁用 */
    disabled?: boolean;
    /** 是否折叠 */
    collapsed?: boolean;
    /** 折叠切换回调 */
    onToggleCollapse?: () => void;
}

export function SystemProperties({
    values,
    onChange,
    disabled = false,
    collapsed = false,
    onToggleCollapse,
}: SystemPropertiesProps) {
    // 格式化日期显示
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('zh-CN');
        } catch {
            return dateStr;
        }
    };

    if (collapsed) {
        return (
            <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-500 
                   hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Lock size={14} />
                    <span>系统属性</span>
                    <span className="text-slate-400">· 8 项</span>
                </div>
                <span className="text-xs text-slate-400">点击展开</span>
            </button>
        );
    }

    return (
        <div className="system-properties bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Lock size={14} className="text-slate-400" />
                    系统属性
                    <span className="text-xs text-slate-400 font-normal">（不可删除）</span>
                </div>
                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        收起
                    </button>
                )}
            </div>

            {/* 属性网格 */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* 版本 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        版本
                    </label>
                    <VersionSelector
                        value={values.version || '1.0'}
                        onChange={(v) => onChange('version', v)}
                        disabled={disabled}
                    />
                </div>

                {/* 文档类型 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500">文档类型</label>
                    <DocumentTypeSelector
                        value={values.document_type || 'facts'}
                        onChange={(v) => onChange('document_type', v)}
                        disabled={disabled}
                    />
                </div>

                {/* 创建时间 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        创建时间
                        <Lock size={10} className="text-slate-300" />
                    </label>
                    <div className="px-2 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-md">
                        {formatDate(values.created)}
                    </div>
                </div>

                {/* 更新时间 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500 flex items-center gap-1">
                        更新时间
                        <Lock size={10} className="text-slate-300" />
                    </label>
                    <div className="px-2 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-md">
                        {formatDate(values.updated)}
                    </div>
                </div>

                {/* 作者 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500">作者</label>
                    <input
                        type="text"
                        value={values.author || ''}
                        onChange={(e) => onChange('author', e.target.value)}
                        disabled={disabled}
                        placeholder="文档作者"
                        className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 
                       bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                       focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                </div>

                {/* 功能声明 */}
                <div className="space-y-1">
                    <label className="text-xs text-slate-500">功能声明</label>
                    <FunctionSelector
                        value={values['atlas.function'] || ''}
                        documentType={values.document_type || 'facts'}
                        onChange={(v) => onChange('atlas.function', v)}
                        disabled={disabled}
                    />
                </div>

                {/* 实体类型（当功能为 entity_list 时） */}
                {values['atlas.function'] === 'entity_list' && (
                    <div className="space-y-1">
                        <label className="text-xs text-slate-500">实体类型</label>
                        <input
                            type="text"
                            value={values['atlas.entity_type'] || ''}
                            onChange={(e) => onChange('atlas.entity_type', e.target.value)}
                            disabled={disabled}
                            placeholder="如: client, project"
                            className="w-full px-2 py-1.5 text-sm rounded-md border border-slate-200 
                         bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                         focus:border-purple-500 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                        />
                    </div>
                )}

                {/* 能力声明 */}
                <div className="space-y-1 col-span-2">
                    <label className="text-xs text-slate-500">能力声明</label>
                    <CapabilitiesField
                        value={values['atlas.capabilities'] || []}
                        functionKey={values['atlas.function'] || ''}
                        onChange={(v) => onChange('atlas.capabilities', v)}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* 提示信息 */}
            <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 flex items-start gap-2">
                <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-600">
                    系统属性决定文档如何被系统识别和渲染。带锁图标的字段由系统自动管理。
                </p>
            </div>
        </div>
    );
}

export default SystemProperties;

