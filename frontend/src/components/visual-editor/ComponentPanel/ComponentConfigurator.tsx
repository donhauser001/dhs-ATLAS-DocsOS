/**
 * ComponentConfigurator - 组件配置器
 * 
 * 用于创建和编辑文档组件的弹窗
 * - 选择组件类型
 * - 配置组件属性
 * - 配置选项（选择类组件）
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Plus,
    Trash2,
    GripVertical,
    AlertCircle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DocumentComponentDefinition,
    DocumentComponentType,
    SelectComponentDefinition,
    RatingComponentDefinition,
    NumberComponentDefinition,
    DateComponentDefinition,
    TextComponentDefinition,
    TextareaComponentDefinition,
    ComponentOption,
    COMPONENT_TYPE_META,
    createDefaultComponentDefinition,
    getComponentTypeMeta,
} from './types';

// ============================================================
// 工具函数
// ============================================================

function getLucideIcon(
    iconName: string
): React.ComponentType<{ className?: string; size?: number }> | null {
    const pascalCase = iconName
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    return (LucideIcons as Record<string, unknown>)[pascalCase] as React.ComponentType<{
        className?: string;
        size?: number;
    }> | null;
}

function generateComponentId(): string {
    return `comp_${Date.now().toString(36)}`;
}

// ============================================================
// Props
// ============================================================

export interface ComponentConfiguratorProps {
    /** 编辑的组件（新建时为 null） */
    component: DocumentComponentDefinition | null;
    /** 已存在的组件 ID 列表（用于验证唯一性） */
    existingIds: string[];
    /** 保存回调 */
    onSave: (component: DocumentComponentDefinition) => void;
    /** 关闭回调 */
    onClose: () => void;
}

// ============================================================
// 选项编辑器
// ============================================================

interface OptionEditorProps {
    options: ComponentOption[];
    onChange: (options: ComponentOption[]) => void;
}

function OptionEditor({ options, onChange }: OptionEditorProps) {
    const addOption = useCallback(() => {
        onChange([...options, { value: `选项 ${options.length + 1}` }]);
    }, [options, onChange]);

    const updateOption = useCallback(
        (index: number, value: string) => {
            const newOptions = [...options];
            newOptions[index] = { ...newOptions[index], value };
            onChange(newOptions);
        },
        [options, onChange]
    );

    const removeOption = useCallback(
        (index: number) => {
            if (options.length <= 1) return;
            const newOptions = options.filter((_, i) => i !== index);
            onChange(newOptions);
        },
        [options, onChange]
    );

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
                选项列表
            </label>

            {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-300 cursor-grab flex-shrink-0" />
                    <input
                        type="text"
                        value={option.value}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder="输入选项名称"
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                    />
                    <button
                        type="button"
                        onClick={() => removeOption(index)}
                        disabled={options.length <= 1}
                        className={cn(
                            'p-1 rounded hover:bg-red-50 transition-colors',
                            options.length <= 1
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-red-500'
                        )}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
            >
                <Plus size={14} />
                添加选项
            </button>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function ComponentConfigurator({
    component,
    existingIds,
    onSave,
    onClose,
}: ComponentConfiguratorProps) {
    const isEditing = !!component;

    // 表单状态
    const [formData, setFormData] = useState<DocumentComponentDefinition>(() => {
        if (component) {
            return { ...component };
        }
        return createDefaultComponentDefinition('select', generateComponentId());
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 类型切换时重置配置
    const handleTypeChange = useCallback(
        (newType: DocumentComponentType) => {
            if (newType === formData.type) return;

            const newComponent = createDefaultComponentDefinition(newType, formData.id);
            newComponent.label = formData.label;
            setFormData(newComponent);
        },
        [formData.id, formData.label, formData.type]
    );

    // 更新通用字段
    const updateField = useCallback(
        <K extends keyof DocumentComponentDefinition>(
            field: K,
            value: DocumentComponentDefinition[K]
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
            // 清除该字段的错误
            if (errors[field as string]) {
                setErrors((prev) => {
                    const next = { ...prev };
                    delete next[field as string];
                    return next;
                });
            }
        },
        [errors]
    );

    // 验证表单
    const validate = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.id.trim()) {
            newErrors.id = '组件 ID 不能为空';
        } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(formData.id)) {
            newErrors.id = 'ID 只能包含字母、数字和下划线，且以字母开头';
        } else if (!isEditing && existingIds.includes(formData.id)) {
            newErrors.id = '该 ID 已存在';
        }

        if (!formData.label.trim()) {
            newErrors.label = '显示名称不能为空';
        }

        // 选择类组件验证选项
        if (['select', 'multi-select', 'radio', 'checkbox'].includes(formData.type)) {
            const selectData = formData as SelectComponentDefinition;
            if (!selectData.options || selectData.options.length === 0) {
                newErrors.options = '至少需要一个选项';
            } else {
                const values = selectData.options.map((o) => o.value);
                if (new Set(values).size !== values.length) {
                    newErrors.options = '选项名称不能重复';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, isEditing, existingIds]);

    // 保存
    const handleSave = useCallback(() => {
        if (!validate()) return;
        onSave(formData);
    }, [formData, onSave, validate]);

    // 渲染类型特定配置
    const renderTypeConfig = () => {
        switch (formData.type) {
            case 'select':
            case 'multi-select':
            case 'radio':
            case 'checkbox': {
                const selectData = formData as SelectComponentDefinition;
                return (
                    <>
                        <OptionEditor
                            options={selectData.options || []}
                            onChange={(options) =>
                                setFormData((prev) => ({ ...prev, options } as SelectComponentDefinition))
                            }
                        />
                        {errors.options && (
                            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle size={12} />
                                {errors.options}
                            </p>
                        )}
                        {(formData.type === 'multi-select' || formData.type === 'checkbox') && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    最大选择数（可选）
                                </label>
                                <input
                                    type="number"
                                    value={selectData.maxSelect || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            maxSelect: e.target.value ? parseInt(e.target.value) : undefined,
                                        }))
                                    }
                                    min={1}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                    placeholder="不限制"
                                />
                            </div>
                        )}
                    </>
                );
            }

            case 'rating': {
                const ratingData = formData as RatingComponentDefinition;
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                最大评分
                            </label>
                            <input
                                type="number"
                                value={ratingData.max || 5}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        max: parseInt(e.target.value) || 5,
                                    }))
                                }
                                min={1}
                                max={10}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={ratingData.allowHalf || false}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            allowHalf: e.target.checked,
                                        }))
                                    }
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                允许半星
                            </label>
                        </div>
                    </div>
                );
            }

            case 'number': {
                const numberData = formData as NumberComponentDefinition;
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    最小值
                                </label>
                                <input
                                    type="number"
                                    value={numberData.min ?? ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            min: e.target.value ? parseFloat(e.target.value) : undefined,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                    placeholder="无"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    最大值
                                </label>
                                <input
                                    type="number"
                                    value={numberData.max ?? ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            max: e.target.value ? parseFloat(e.target.value) : undefined,
                                        }))
                                    }
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                    placeholder="无"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    步进
                                </label>
                                <input
                                    type="number"
                                    value={numberData.step ?? 1}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            step: parseFloat(e.target.value) || 1,
                                        }))
                                    }
                                    min={0.01}
                                    step={0.01}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                单位（可选）
                            </label>
                            <input
                                type="text"
                                value={numberData.unit || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        unit: e.target.value || undefined,
                                    }))
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                placeholder="如：元、个、%"
                            />
                        </div>
                    </div>
                );
            }

            case 'date': {
                const dateData = formData as DateComponentDefinition;
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                日期格式
                            </label>
                            <select
                                value={dateData.format || 'YYYY-MM-DD'}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        format: e.target.value,
                                    }))
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                            >
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={dateData.includeTime || false}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            includeTime: e.target.checked,
                                        }))
                                    }
                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                />
                                包含时间
                            </label>
                        </div>
                    </div>
                );
            }

            case 'text': {
                const textData = formData as TextComponentDefinition;
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                占位文本
                            </label>
                            <input
                                type="text"
                                value={textData.placeholder || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        placeholder: e.target.value || undefined,
                                    }))
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                placeholder="请输入..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                最大长度（可选）
                            </label>
                            <input
                                type="number"
                                value={textData.maxLength || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                                    }))
                                }
                                min={1}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                placeholder="不限制"
                            />
                        </div>
                    </div>
                );
            }

            case 'textarea': {
                const textareaData = formData as TextareaComponentDefinition;
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                占位文本
                            </label>
                            <input
                                type="text"
                                value={textareaData.placeholder || ''}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        placeholder: e.target.value || undefined,
                                    }))
                                }
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                placeholder="请输入..."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    行数
                                </label>
                                <input
                                    type="number"
                                    value={textareaData.rows || 3}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            rows: parseInt(e.target.value) || 3,
                                        }))
                                    }
                                    min={1}
                                    max={20}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    最大长度
                                </label>
                                <input
                                    type="number"
                                    value={textareaData.maxLength || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                                        }))
                                    }
                                    min={1}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                    placeholder="不限"
                                />
                            </div>
                        </div>
                    </div>
                );
            }

            default:
                return null;
        }
    };

    const meta = getComponentTypeMeta(formData.type);

    return createPortal(
        <>
            {/* 遮罩 */}
            <div
                className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 弹窗 */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[480px] max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-800">
                        {isEditing ? '编辑组件' : '添加组件'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 内容 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    {/* 组件类型选择 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            组件类型
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {COMPONENT_TYPE_META.map((typeMeta) => {
                                const TypeIcon = getLucideIcon(typeMeta.icon);
                                const isSelected = formData.type === typeMeta.type;
                                return (
                                    <button
                                        key={typeMeta.type}
                                        type="button"
                                        onClick={() => handleTypeChange(typeMeta.type)}
                                        disabled={isEditing}
                                        className={cn(
                                            'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                                            isSelected
                                                ? 'border-purple-400 bg-purple-50 text-purple-700'
                                                : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50',
                                            isEditing && !isSelected && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        {TypeIcon && <TypeIcon size={20} />}
                                        <span className="text-xs font-medium">{typeMeta.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                组件 ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={(e) => updateField('id', e.target.value)}
                                disabled={isEditing}
                                className={cn(
                                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                                    errors.id
                                        ? 'border-red-300 focus:ring-red-400/50 focus:border-red-400'
                                        : 'border-slate-200 focus:ring-purple-400/50 focus:border-purple-400',
                                    isEditing && 'bg-slate-50 cursor-not-allowed'
                                )}
                                placeholder="如：invoice_type"
                            />
                            {errors.id && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <AlertCircle size={12} />
                                    {errors.id}
                                </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">
                                用于引用组件的唯一标识，只能包含字母、数字和下划线
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                显示名称 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.label}
                                onChange={(e) => updateField('label', e.target.value)}
                                className={cn(
                                    'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2',
                                    errors.label
                                        ? 'border-red-300 focus:ring-red-400/50 focus:border-red-400'
                                        : 'border-slate-200 focus:ring-purple-400/50 focus:border-purple-400'
                                )}
                                placeholder="如：发票类型"
                            />
                            {errors.label && (
                                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                    <AlertCircle size={12} />
                                    {errors.label}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                描述（可选）
                            </label>
                            <input
                                type="text"
                                value={formData.description || ''}
                                onChange={(e) => updateField('description', e.target.value || undefined)}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                                placeholder="组件用途说明"
                            />
                        </div>
                    </div>

                    {/* 类型特定配置 */}
                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                            {meta && getLucideIcon(meta.icon) && (
                                (() => {
                                    const Icon = getLucideIcon(meta.icon);
                                    return Icon ? <Icon size={16} className="text-purple-500" /> : null;
                                })()
                            )}
                            {meta?.name}配置
                        </h3>
                        {renderTypeConfig()}
                    </div>
                </div>

                {/* 底部 */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                    >
                        {isEditing ? '保存修改' : '添加组件'}
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}

export default ComponentConfigurator;

