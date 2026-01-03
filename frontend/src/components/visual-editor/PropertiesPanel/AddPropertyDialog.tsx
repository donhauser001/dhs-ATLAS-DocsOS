/**
 * AddPropertyDialog - 添加文档属性对话框
 * 
 * 用于为文档添加自定义元数据属性（如 status, priority）
 * 这些属性描述文档本身，而不是文档内容中的数据
 */

import { useState, useCallback } from 'react';
import { X, Plus, Check } from 'lucide-react';
import type { PropertyDefinition, PropertyComponentType } from '@/types/property';
import { getCategorizedComponents, getComponent } from '@/registry/property-components';
import { getLucideIcon } from './utils';

interface AddPropertyDialogProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 添加属性回调 */
    onAdd: (definition: PropertyDefinition) => void;
    /** 已存在的属性 key 列表（用于检查重复） */
    existingKeys: string[];
}

export function AddPropertyDialog({
    open,
    onClose,
    onAdd,
    existingKeys,
}: AddPropertyDialogProps) {
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedType, setSelectedType] = useState<PropertyComponentType | null>(null);
    const [key, setKey] = useState('');
    const [label, setLabel] = useState('');
    const [description, setDescription] = useState('');
    const [keyError, setKeyError] = useState<string | null>(null);

    const categories = getCategorizedComponents();
    const selectedComponent = selectedType ? getComponent(selectedType) : null;

    const resetForm = useCallback(() => {
        setStep('select');
        setSelectedType(null);
        setKey('');
        setLabel('');
        setDescription('');
        setKeyError(null);
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose();
    }, [onClose, resetForm]);

    const handleSelectType = useCallback((type: PropertyComponentType) => {
        setSelectedType(type);
        setStep('configure');

        // 自动生成 key
        const baseKey = type.replace('plugin-', '');
        let newKey = baseKey;
        let counter = 1;
        while (existingKeys.includes(newKey)) {
            newKey = `${baseKey}_${counter}`;
            counter++;
        }
        setKey(newKey);

        // 自动设置 label
        const component = getComponent(type);
        setLabel(component?.name || type);
    }, [existingKeys]);

    const validateKey = useCallback((value: string) => {
        if (!value) {
            setKeyError('Key 不能为空');
            return false;
        }
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
            setKeyError('Key 只能包含字母、数字和下划线，且不能以数字开头');
            return false;
        }
        if (existingKeys.includes(value)) {
            setKeyError('Key 已存在');
            return false;
        }
        setKeyError(null);
        return true;
    }, [existingKeys]);

    const handleKeyChange = useCallback((value: string) => {
        setKey(value);
        validateKey(value);
    }, [validateKey]);

    const handleAdd = useCallback(() => {
        if (!selectedType || !validateKey(key) || !label) return;

        const definition: PropertyDefinition = {
            key,
            label,
            description: description || undefined,
            type: selectedType,
            config: selectedComponent?.defaultConfig || {},
        };

        onAdd(definition);
        handleClose();
    }, [selectedType, key, label, description, selectedComponent, validateKey, onAdd, handleClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 背景遮罩 */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={handleClose}
            />

            {/* 对话框 */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
                {/* 头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            {step === 'select' ? '添加文档属性' : '配置文档属性'}
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            文档属性用于描述文档本身的元数据
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 内容 */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
                    {step === 'select' ? (
                        // 步骤 1: 选择组件类型
                        <div className="space-y-6">
                            {categories.map(category => (
                                <div key={category.id}>
                                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                                        {(() => {
                                            const IconComponent = getLucideIcon(category.icon);
                                            return IconComponent ? <IconComponent size={14} /> : null;
                                        })()}
                                        {category.name}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {category.components.map(component => {
                                            const IconComponent = getLucideIcon(component.icon);
                                            return (
                                                <button
                                                    key={component.id}
                                                    type="button"
                                                    onClick={() => handleSelectType(component.id)}
                                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 
                                     hover:border-purple-300 hover:bg-purple-50 transition-colors text-left"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                        {IconComponent ? <IconComponent size={18} /> : <Plus size={18} />}
                                                    </div>
                                                    <span className="text-sm text-slate-700 font-medium">
                                                        {component.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // 步骤 2: 配置属性
                        <div className="space-y-4">
                            {/* 选中的组件类型 */}
                            {selectedComponent && (
                                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                                    {(() => {
                                        const IconComponent = getLucideIcon(selectedComponent.icon);
                                        return IconComponent ? (
                                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                                <IconComponent size={20} />
                                            </div>
                                        ) : null;
                                    })()}
                                    <div>
                                        <div className="font-medium text-slate-700">{selectedComponent.name}</div>
                                        <div className="text-sm text-slate-500">{selectedComponent.description}</div>
                                    </div>
                                </div>
                            )}

                            {/* Key */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    属性 Key <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => handleKeyChange(e.target.value)}
                                    placeholder="例如: client_category"
                                    className={`w-full px-3 py-2 text-sm rounded-md border font-mono
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                             ${keyError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-purple-500'}`}
                                />
                                {keyError && (
                                    <p className="mt-1 text-xs text-red-500">{keyError}</p>
                                )}
                                <p className="mt-1 text-xs text-slate-500">
                                    唯一标识符，创建后不可修改
                                </p>
                            </div>

                            {/* Label */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    显示名称 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="例如: 客户分类"
                                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    描述（可选）
                                </label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="例如: 选择客户所属行业"
                                    className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                             focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部 */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    {step === 'configure' && (
                        <button
                            type="button"
                            onClick={() => setStep('select')}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            返回
                        </button>
                    )}
                    {step === 'select' && <div />}

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            取消
                        </button>
                        {step === 'configure' && (
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!key || !!keyError || !label}
                                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md 
                           hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors flex items-center gap-2"
                            >
                                <Check size={16} />
                                添加
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddPropertyDialog;

