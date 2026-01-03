/**
 * CheckboxComponent - 复选框属性组件
 */

import React from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { PropertyComponent, PropertyComponentConfig, PropertyRenderContext, ValidationResult } from '@/types/property';
import { COMPONENT_STYLES } from './types';

// === 渲染函数 ===

function renderConfig(
    _config: PropertyComponentConfig,
    _onChange: (config: PropertyComponentConfig) => void
): React.ReactNode {
    return (
        <div className="text-sm text-slate-500">
            复选框组件无需额外配置
        </div>
    );
}

function renderEditor(
    value: unknown,
    _config: PropertyComponentConfig,
    onChange: (value: unknown) => void,
    context?: PropertyRenderContext
): React.ReactNode {
    const isChecked = Boolean(value);
    const disabled = context?.disabled || context?.readonly;

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isChecked}
            onClick={() => !disabled && onChange(!isChecked)}
            disabled={disabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full 
                  transition-colors focus:outline-none focus:ring-2 
                  focus:ring-purple-500/20 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isChecked ? 'bg-purple-600' : 'bg-slate-200'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white 
                    transition-transform shadow-sm
                    ${isChecked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );
}

function renderView(
    value: unknown,
    _config: PropertyComponentConfig,
    _context?: PropertyRenderContext
): React.ReactNode {
    const isChecked = Boolean(value);

    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium
                      ${isChecked
                ? 'bg-green-100 text-green-700'
                : 'bg-slate-100 text-slate-500'}`}>
            {isChecked ? (
                <>
                    <Check size={14} />
                    是
                </>
            ) : (
                <>
                    <X size={14} />
                    否
                </>
            )}
        </span>
    );
}

function renderInline(
    value: unknown,
    _config: PropertyComponentConfig
): React.ReactNode {
    const isChecked = Boolean(value);

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium
                      ${isChecked
                ? 'bg-green-50 text-green-600'
                : 'bg-slate-50 text-slate-400'}`}>
            {isChecked ? '✓ 是' : '✗ 否'}
        </span>
    );
}

function renderFallback(
    lastValue: unknown,
    _config: unknown
): React.ReactNode {
    const isChecked = Boolean(lastValue);

    return (
        <div className={COMPONENT_STYLES.fallback}>
            <AlertTriangle size={16} />
            <span>复选框组件不可用</span>
            <span className="text-amber-600">最后值: {isChecked ? '是' : '否'}</span>
        </div>
    );
}

function validate(
    _value: unknown,
    _config: PropertyComponentConfig
): ValidationResult {
    return { valid: true };
}

function serialize(value: unknown): string {
    return Boolean(value) ? 'true' : 'false';
}

function deserialize(str: string): unknown {
    return str === 'true' || str === '1' || str === 'yes';
}

// === 组件定义 ===

export const CheckboxComponent: PropertyComponent = {
    id: 'checkbox',
    version: '1.0.0',
    name: '复选框',
    icon: 'check-square',
    description: '是/否开关',

    defaultConfig: {},

    renderConfig,
    renderEditor,
    renderView,
    renderInline,
    renderFallback,
    validate,
    serialize,
    deserialize,
};

export default CheckboxComponent;

