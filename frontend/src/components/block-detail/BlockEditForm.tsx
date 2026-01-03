/**
 * BlockEditForm - Block 编辑表单
 * 
 * 使用注册制标签系统（LabelProvider）来渲染字段表单
 * 支持多种字段类型的编辑
 */

import { useCallback } from 'react';
import { Star, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Block } from '@/types/adl';
import { useLabels } from '@/providers/LabelProvider';

// ============================================================
// 类型定义
// ============================================================

/**
 * 字段配置项 - 定义字段的 UI 类型和选项
 * 在文档 frontmatter 的 atlas.field_config 中配置
 */
export interface FieldConfigItem {
    /** 组件类型 */
    type: 'text' | 'number' | 'select' | 'rating' | 'textarea' | 'date';
    /** 选项列表（用于 select 类型） */
    options?: string[];
    /** 占位符文本 */
    placeholder?: string;
    /** 是否必填 */
    required?: boolean;
}

/**
 * 字段配置映射
 */
export type FieldConfig = Record<string, FieldConfigItem>;

interface BlockEditFormProps {
    block: Block;
    entityType?: string;
    /** 字段配置（来自文档 frontmatter.atlas.field_config） */
    fieldConfig?: FieldConfig;
    onChange: (changes: Record<string, unknown>) => void;
    pendingChanges: Record<string, unknown>;
}

// 系统字段：不允许用户编辑
const SYSTEM_FIELDS = new Set([
    'type',
    'id',
    '$display',
    '$icon',
    '$color',
    'auth',
    'profiles',
    'identity',
]);

// 预定义状态值列表（标签从 LabelProvider 动态获取）
const STATUS_VALUES = ['active', 'inactive', 'pending', 'archived'];

// 只读字段：显示但不可编辑
const READONLY_FIELDS = new Set([
    'created_at',
    'updated_at',
]);

// ============================================================
// 工具函数
// ============================================================

function toPascalCase(str: string): string {
    return str
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}

function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
    if (!name) return null;
    const pascalName = toPascalCase(name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icons = LucideIcons as any;
    const Icon = icons[pascalName];
    if (Icon && (typeof Icon === 'function' || typeof Icon === 'object')) {
        return Icon as React.ComponentType<{ className?: string; size?: number }>;
    }
    return null;
}

// ============================================================
// 子组件：字段输入控件
// ============================================================

interface FieldInputProps {
    fieldKey: string;
    value: unknown;
    label: string;
    icon?: string;
    type?: 'text' | 'number' | 'select' | 'rating' | 'textarea';
    options?: { value: string; label: string }[];
    readonly?: boolean;
    onChange: (key: string, value: unknown) => void;
}

function FieldInput({
    fieldKey,
    value,
    label,
    icon,
    type = 'text',
    options,
    readonly = false,
    onChange,
}: FieldInputProps) {
    const Icon = getLucideIcon(icon);
    const { resolveLabel } = useLabels();

    const handleChange = (newValue: unknown) => {
        if (!readonly) {
            onChange(fieldKey, newValue);
        }
    };

    const renderInput = () => {
        // 状态字段 - 使用标签系统获取映射名
        if (fieldKey === 'status') {
            return (
                <div className="relative">
                    <select
                        value={String(value || '')}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 rounded-lg border appearance-none pr-10"
                        style={{
                            borderColor: 'var(--ui-block-body-border)',
                            backgroundColor: readonly ? 'var(--ui-block-header-bg)' : 'var(--ui-page-bg)',
                            color: 'var(--ui-field-value-color)',
                        }}
                    >
                        {STATUS_VALUES.map(statusValue => (
                            <option key={statusValue} value={statusValue}>
                                {resolveLabel(statusValue).label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    />
                </div>
            );
        }

        // 评级字段
        if (type === 'rating' || fieldKey === 'rating') {
            const numValue = typeof value === 'number' ? value : parseInt(String(value)) || 0;
            return (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            disabled={readonly}
                            onClick={() => handleChange(star)}
                            className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
                        >
                            <Star
                                className={`w-5 h-5 ${star <= numValue ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                        </button>
                    ))}
                    <span className="ml-2 text-sm" style={{ color: 'var(--ui-field-label-color)' }}>
                        {numValue}/5
                    </span>
                </div>
            );
        }

        // 选择框字段
        if (type === 'select' && options) {
            return (
                <div className="relative">
                    <select
                        value={String(value || '')}
                        onChange={(e) => handleChange(e.target.value)}
                        disabled={readonly}
                        className="w-full px-3 py-2 rounded-lg border appearance-none pr-10"
                        style={{
                            borderColor: 'var(--ui-block-body-border)',
                            backgroundColor: readonly ? 'var(--ui-block-header-bg)' : 'var(--ui-page-bg)',
                            color: 'var(--ui-field-value-color)',
                        }}
                    >
                        <option value="">请选择</option>
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    />
                </div>
            );
        }

        // 多行文本字段
        if (type === 'textarea' || (typeof value === 'string' && value.length > 100)) {
            return (
                <textarea
                    value={String(value || '')}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={readonly}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border resize-none"
                    style={{
                        borderColor: 'var(--ui-block-body-border)',
                        backgroundColor: readonly ? 'var(--ui-block-header-bg)' : 'var(--ui-page-bg)',
                        color: 'var(--ui-field-value-color)',
                    }}
                />
            );
        }

        // 数字字段
        if (type === 'number' || typeof value === 'number') {
            return (
                <input
                    type="number"
                    value={value === null || value === undefined ? '' : String(value)}
                    onChange={(e) => handleChange(e.target.value === '' ? null : Number(e.target.value))}
                    disabled={readonly}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{
                        borderColor: 'var(--ui-block-body-border)',
                        backgroundColor: readonly ? 'var(--ui-block-header-bg)' : 'var(--ui-page-bg)',
                        color: 'var(--ui-field-value-color)',
                    }}
                />
            );
        }

        // 默认：文本输入
        return (
            <input
                type="text"
                value={String(value || '')}
                onChange={(e) => handleChange(e.target.value)}
                disabled={readonly}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                    borderColor: 'var(--ui-block-body-border)',
                    backgroundColor: readonly ? 'var(--ui-block-header-bg)' : 'var(--ui-page-bg)',
                    color: 'var(--ui-field-value-color)',
                }}
            />
        );
    };

    return (
        <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--ui-field-label-color)' }}>
                {Icon && <Icon className="w-4 h-4" />}
                {label}
                {readonly && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--ui-block-header-bg)' }}>
                        只读
                    </span>
                )}
            </label>
            {renderInput()}
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function BlockEditForm({
    block,
    entityType,
    fieldConfig = {},
    onChange,
    pendingChanges,
}: BlockEditFormProps) {
    const { resolveLabel, isHidden } = useLabels();

    const machine = block.machine as Record<string, unknown> || {};

    // 处理字段变更
    const handleFieldChange = useCallback((key: string, value: unknown) => {
        onChange({
            ...pendingChanges,
            [key]: value,
        });
    }, [onChange, pendingChanges]);

    // 获取字段当前值（优先使用 pendingChanges 中的值）
    const getFieldValue = (key: string): unknown => {
        if (key in pendingChanges) {
            return pendingChanges[key];
        }
        return machine[key];
    };

    // 收集可编辑的字段
    const editableFields = Object.entries(machine).filter(([key]) => {
        if (SYSTEM_FIELDS.has(key)) return false;
        if (key.startsWith('$')) return false;
        if (isHidden(key)) return false;
        return true;
    });

    return (
        <div className="block-edit-form space-y-6">
            {/* 基本信息编辑表单 */}
            <div
                className="rounded-xl p-5"
                style={{
                    backgroundColor: 'var(--ui-block-header-bg, #f8fafc)',
                    border: '1px solid var(--ui-block-body-border)',
                }}
            >
                <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--ui-field-value-color)' }}>
                    基本信息
                </h3>
                <div className="space-y-4">
                    {editableFields.map(([key, originalValue]) => {
                        const resolved = resolveLabel(key);
                        const isReadonly = READONLY_FIELDS.has(key);
                        const currentValue = getFieldValue(key);
                        const config = fieldConfig[key];

                        // 确定字段类型：优先使用文档配置，其次自动推断
                        let fieldType: 'text' | 'number' | 'select' | 'rating' | 'textarea' = 'text';
                        let fieldOptions: string[] | undefined;

                        if (config?.type) {
                            // 使用文档中定义的字段配置
                            fieldType = config.type as typeof fieldType;
                            fieldOptions = config.options;
                        } else if (key === 'rating') {
                            fieldType = 'rating';
                        } else if (typeof originalValue === 'number') {
                            fieldType = 'number';
                        } else if (typeof originalValue === 'string' && originalValue.length > 100) {
                            fieldType = 'textarea';
                        }

                        return (
                            <FieldInput
                                key={key}
                                fieldKey={key}
                                value={currentValue}
                                label={resolved.label}
                                icon={resolved.icon}
                                type={fieldType}
                                options={fieldOptions?.map(opt => ({ value: opt, label: opt }))}
                                readonly={isReadonly}
                                onChange={handleFieldChange}
                            />
                        );
                    })}
                </div>
            </div>

            {/* 变更提示 */}
            {Object.keys(pendingChanges).length > 0 && (
                <div
                    className="text-sm px-4 py-3 rounded-lg"
                    style={{
                        backgroundColor: 'var(--color-brand-primary)10',
                        color: 'var(--color-brand-primary)',
                    }}
                >
                    已修改 {Object.keys(pendingChanges).length} 个字段，点击"保存"提交变更
                </div>
            )}
        </div>
    );
}

