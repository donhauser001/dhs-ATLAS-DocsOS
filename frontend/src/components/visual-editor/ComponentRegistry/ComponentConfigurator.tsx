/**
 * ComponentConfigurator - 基于注册系统的组件配置器
 * 
 * 左侧：组件类型列表（从注册中心获取）
 * 右侧：配置表单（自动渲染对应类型的配置器）
 */

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DocumentComponentDefinition,
    ComponentType,
    SelectComponentDefinition,
    getComponentMetas,
    getConfigurator,
    createDefaultComponent,
    isRegistered,
    getLucideIcon,
    generateComponentId,
} from './index';

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

export function ComponentConfigurator({
    component,
    existingIds,
    onSave,
    onClose,
}: ComponentConfiguratorProps) {
    const isEditing = !!component;

    // 获取所有已注册组件的元数据
    const componentMetas = getComponentMetas();

    // 表单状态
    const [formData, setFormData] = useState<DocumentComponentDefinition>(() => {
        if (component) {
            return { ...component };
        }
        return createDefaultComponent('select', generateComponentId()) as DocumentComponentDefinition;
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // 类型切换
    const handleTypeChange = useCallback(
        (newType: string) => {
            if (newType === formData.type || !isRegistered(newType)) return;

            const newComponent = createDefaultComponent(newType as ComponentType, formData.id);
            if (newComponent) {
                // 检查当前 label 是否是当前类型的默认值
                const currentDefaultComponent = createDefaultComponent(formData.type, 'temp');
                const isDefaultLabel = currentDefaultComponent && formData.label === currentDefaultComponent.label;

                // 只有当用户手动修改过 label 时才保留
                if (!isDefaultLabel && formData.label.trim()) {
                    newComponent.label = formData.label;
                }
                setFormData(newComponent);
            }
        },
        [formData.id, formData.label, formData.type]
    );

    // 更新字段
    const updateField = useCallback(
        <K extends keyof DocumentComponentDefinition>(
            field: K,
            value: DocumentComponentDefinition[K]
        ) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
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

    // 验证
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

    // 获取当前类型的配置器
    const Configurator = getConfigurator(formData.type);
    const currentMeta = componentMetas.find(m => m.type === formData.type);

    return createPortal(
        <>
            {/* 遮罩 */}
            <div
                className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* 弹窗 */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[800px] max-h-[85vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-white">
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

                {/* 内容区 - 左右分栏 */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 左侧 - 组件类型列表 */}
                    <div className="w-[240px] border-r border-slate-200 bg-slate-50 overflow-y-auto">
                        <div className="p-3">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 px-2">
                                选择组件类型
                            </div>
                            <div className="space-y-1">
                                {componentMetas.map((meta) => {
                                    const TypeIcon = getLucideIcon(meta.icon);
                                    const isSelected = formData.type === meta.type;
                                    return (
                                        <button
                                            key={meta.type}
                                            type="button"
                                            onClick={() => handleTypeChange(meta.type)}
                                            disabled={isEditing}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                                                isSelected
                                                    ? 'bg-purple-100 text-purple-700 shadow-sm'
                                                    : 'hover:bg-white text-slate-600 hover:text-slate-800',
                                                isEditing && !isSelected && 'opacity-50 cursor-not-allowed'
                                            )}
                                        >
                                            <div className={cn(
                                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                                isSelected ? 'bg-purple-200' : 'bg-slate-200'
                                            )}>
                                                {TypeIcon && <TypeIcon size={18} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate">{meta.name}</div>
                                                <div className="text-xs text-slate-400 truncate">{meta.description}</div>
                                            </div>
                                            {isSelected && (
                                                <Check size={16} className="text-purple-600 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 右侧 - 配置表单 */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* 当前类型标题 */}
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                                {currentMeta && getLucideIcon(currentMeta.icon) && (
                                    (() => {
                                        const Icon = getLucideIcon(currentMeta.icon);
                                        return Icon ? (
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                <Icon size={20} className="text-purple-600" />
                                            </div>
                                        ) : null;
                                    })()
                                )}
                                <div>
                                    <h3 className="text-base font-semibold text-slate-800">{currentMeta?.name}</h3>
                                    <p className="text-sm text-slate-500">{currentMeta?.description}</p>
                                </div>
                            </div>

                            {/* 基本信息 */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-700">基本信息</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
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
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">
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
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
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

                            {/* 类型特定配置（从注册中心动态获取） */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-slate-700">{currentMeta?.name}配置</h4>
                                {Configurator && (
                                    <Configurator
                                        formData={formData}
                                        errors={errors}
                                        onUpdateFormData={setFormData}
                                    />
                                )}
                            </div>
                        </div>
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
                        className="px-5 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm"
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

