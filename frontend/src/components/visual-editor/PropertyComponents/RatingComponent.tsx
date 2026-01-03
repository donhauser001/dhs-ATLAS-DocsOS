/**
 * RatingComponent - 星级评分属性组件
 */

import React, { useState } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
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
                    最大星级
                </label>
                <input
                    type="number"
                    value={config.maxRating || 5}
                    onChange={(e) => onChange({ ...config, maxRating: Number(e.target.value) || 5 })}
                    min={1}
                    max={10}
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
    const maxRating = config.maxRating || 5;
    const currentRating = typeof value === 'number' ? value : 0;
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const disabled = context?.disabled || context?.readonly;

    const displayRating = hoverRating !== null ? hoverRating : currentRating;

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => !disabled && onChange(star === currentRating ? 0 : star)}
                    onMouseEnter={() => !disabled && setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    disabled={disabled}
                    className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
                >
                    <Star
                        size={20}
                        className={`transition-colors ${star <= displayRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-slate-300'
                            }`}
                    />
                </button>
            ))}
            <span className="ml-2 text-sm text-slate-500">
                {currentRating}/{maxRating}
            </span>
        </div>
    );
}

function renderView(
    value: unknown,
    config: PropertyComponentConfig,
    _context?: PropertyRenderContext
): React.ReactNode {
    const maxRating = config.maxRating || 5;
    const currentRating = typeof value === 'number' ? value : 0;

    return (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
                <Star
                    key={star}
                    size={16}
                    className={`${star <= currentRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-slate-300'
                        }`}
                />
            ))}
            <span className="ml-1.5 text-sm text-slate-500">
                {currentRating}
            </span>
        </div>
    );
}

function renderInline(
    value: unknown,
    config: PropertyComponentConfig
): React.ReactNode {
    const maxRating = config.maxRating || 5;
    const currentRating = typeof value === 'number' ? value : 0;

    // 简化版本：只显示填充的星星
    const stars = '★'.repeat(currentRating) + '☆'.repeat(maxRating - currentRating);

    return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-sm">
            {stars}
        </span>
    );
}

function renderFallback(
    lastValue: unknown,
    config: unknown
): React.ReactNode {
    const rating = typeof lastValue === 'number' ? lastValue : 0;
    const max = (config as PropertyComponentConfig)?.maxRating || 5;

    return (
        <div className={COMPONENT_STYLES.fallback}>
            <AlertTriangle size={16} />
            <span>评分组件不可用</span>
            {lastValue !== undefined && (
                <span className="text-amber-600">最后评分: {rating}/{max}</span>
            )}
        </div>
    );
}

function validate(
    value: unknown,
    config: PropertyComponentConfig
): ValidationResult {
    if (value === undefined || value === null || value === 0) {
        return { valid: true };
    }

    const numValue = Number(value);
    const maxRating = config.maxRating || 5;

    if (isNaN(numValue) || numValue < 0 || numValue > maxRating) {
        return { valid: false, message: `评分必须在 0-${maxRating} 之间` };
    }

    return { valid: true };
}

function serialize(value: unknown): string {
    if (value === undefined || value === null) return '0';
    return String(Number(value));
}

function deserialize(str: string): unknown {
    const num = Number(str);
    return isNaN(num) ? 0 : num;
}

// === 组件定义 ===

export const RatingComponent: PropertyComponent = {
    id: 'rating',
    version: '1.0.0',
    name: '星级评分',
    icon: 'star',
    description: '星级评分（1-5星）',

    defaultConfig: {
        maxRating: 5,
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

export default RatingComponent;

