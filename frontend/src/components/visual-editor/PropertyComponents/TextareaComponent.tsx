/**
 * TextareaComponent - 多行文本属性组件
 */

import React from 'react';
import { AlignLeft, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// === 渲染函数 ===

function renderConfig(
    config: PropertyComponentConfig,
    onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    占位文本
                </label>
                <input
                    type="text"
                    value={config.placeholder || ''}
                    onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
                    placeholder="请输入..."
                    className={COMPONENT_STYLES.input}
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        行数
                    </label>
                    <input
                        type="number"
                        value={config.rows || 4}
                        onChange={(e) => onChange({ ...config, rows: Number(e.target.value) || 4 })}
                        min={2}
                        max={20}
                        className={COMPONENT_STYLES.input}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        最大长度
                    </label>
                    <input
                        type="number"
                        value={config.maxLength || ''}
                        onChange={(e) => onChange({ ...config, maxLength: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="不限制"
                        min={1}
                        className={COMPONENT_STYLES.input}
                    />
                </div>
            </div>
        </div>
    );
}

function renderEditor(
    value: unknown,
    config: PropertyComponentConfig,
    onChange: (value: unknown) => void,
    context?: PropertyRenderContext
): React.ReactNode {
    const stringValue = value !== undefined && value !== null ? String(value) : '';
    const disabled = context?.disabled || context?.readonly;

    return (
        <textarea
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={config.placeholder}
            rows={config.rows || 4}
            maxLength={config.maxLength}
            className={`${COMPONENT_STYLES.input} resize-none`}
        />
    );
}

function renderView(
    value: unknown,
    _config: PropertyComponentConfig,
    _context?: PropertyRenderContext
): React.ReactNode {
    const stringValue = value !== undefined && value !== null ? String(value) : '';

    if (!stringValue) {
        return <span className="text-slate-400 text-sm">-</span>;
    }

    // 多行文本可能较长，使用 pre 保留格式
    return (
        <div className="text-sm text-slate-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {stringValue}
        </div>
    );
}

function renderInline(
    value: unknown,
    _config: PropertyComponentConfig
): React.ReactNode {
    const stringValue = value !== undefined && value !== null ? String(value) : '';

    if (!stringValue) {
        return <span className={COMPONENT_STYLES.inline}>未设置</span>;
    }

    // 行内显示时截断
    const truncated = stringValue.length > 50
        ? stringValue.substring(0, 50) + '...'
        : stringValue;

    return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-sm">
            <AlignLeft size={12} />
            {truncated.replace(/\n/g, ' ')}
        </span>
    );
}

function renderFallback(
    lastValue: unknown,
    _config: unknown
): React.ReactNode {
    const stringValue = lastValue !== undefined && lastValue !== null ? String(lastValue) : '';
    const truncated = stringValue.length > 100
        ? stringValue.substring(0, 100) + '...'
        : stringValue;

    return (
        <div className={COMPONENT_STYLES.fallback}>
            <AlertTriangle size={16} />
            <span>多行文本组件不可用</span>
            {stringValue && (
                <span className="text-amber-600 truncate max-w-xs">最后值: {truncated}</span>
            )}
        </div>
    );
}

function validate(
    value: unknown,
    config: PropertyComponentConfig
): ValidationResult {
    if (!value) return { valid: true };

    const stringValue = String(value);

    if (config.maxLength && stringValue.length > config.maxLength) {
        return { valid: false, message: `文本长度不能超过 ${config.maxLength} 个字符` };
    }

    return { valid: true };
}

function serialize(value: unknown): string {
    if (value === undefined || value === null) return '';
    return String(value);
}

function deserialize(str: string): unknown {
    return str;
}

// === 组件定义 ===

export const TextareaComponent: PropertyComponent = {
    id: 'textarea',
    version: '1.0.0',
    name: '多行文本',
    icon: 'align-left',
    description: '多行文本输入',

    defaultConfig: {
        placeholder: '请输入...',
        rows: 4,
    },

    renderConfig,
    renderEditor,
    renderView,
    renderInline,
    renderFallback,
    validate,
    serialize,
    deserialize,
};

export default TextareaComponent;

