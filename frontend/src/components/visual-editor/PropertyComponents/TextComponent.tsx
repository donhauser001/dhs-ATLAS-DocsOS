/**
 * TextComponent - 单行文本属性组件
 */

import React from 'react';
import { Type, AlertTriangle } from 'lucide-react';
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
        <input
            type="text"
            value={stringValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={config.placeholder}
            maxLength={config.maxLength}
            className={COMPONENT_STYLES.input}
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

    return <span className="text-sm text-slate-700">{stringValue}</span>;
}

function renderInline(
    value: unknown,
    _config: PropertyComponentConfig
): React.ReactNode {
    const stringValue = value !== undefined && value !== null ? String(value) : '';

    if (!stringValue) {
        return <span className={COMPONENT_STYLES.inline}>未设置</span>;
    }

    return <span className={COMPONENT_STYLES.inline}>{stringValue}</span>;
}

function renderFallback(
    lastValue: unknown,
    _config: unknown
): React.ReactNode {
    return (
        <div className={COMPONENT_STYLES.fallback}>
            <AlertTriangle size={16} />
            <span>文本组件不可用</span>
            {lastValue !== undefined && (
                <span className="text-amber-600">最后值: {String(lastValue)}</span>
            )}
        </div>
    );
}

function validate(
    value: unknown,
    config: PropertyComponentConfig
): ValidationResult {
    if (config.maxLength && typeof value === 'string' && value.length > config.maxLength) {
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

export const TextComponent: PropertyComponent = {
    id: 'text',
    version: '1.0.0',
    name: '文本',
    icon: 'type',
    description: '单行文本输入',

    defaultConfig: {
        placeholder: '请输入...',
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

export default TextComponent;

