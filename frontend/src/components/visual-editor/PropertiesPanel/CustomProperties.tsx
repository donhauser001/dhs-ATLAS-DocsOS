/**
 * CustomProperties - 自定义属性区组件
 * 
 * 用户可自由添加/编辑/删除的属性
 */

import React, { useState, useCallback } from 'react';
import { Plus, Puzzle, ChevronDown, ChevronUp } from 'lucide-react';
import type { PropertyDefinition, PropertyValues } from '@/types/property';
import { PropertyItem } from './PropertyItem';
import { AddPropertyDialog } from './AddPropertyDialog';

export interface CustomPropertiesProps {
    /** 属性定义列表 */
    definitions: PropertyDefinition[];
    /** 属性值 */
    values: PropertyValues;
    /** 定义变更回调 */
    onDefinitionsChange: (definitions: PropertyDefinition[]) => void;
    /** 值变更回调 */
    onValuesChange: (values: PropertyValues) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

export function CustomProperties({
    definitions,
    values,
    onDefinitionsChange,
    onValuesChange,
    disabled = false,
}: CustomPropertiesProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // 添加属性
    const handleAddProperty = useCallback((definition: PropertyDefinition) => {
        onDefinitionsChange([...definitions, definition]);
    }, [definitions, onDefinitionsChange]);

    // 更新属性定义
    const handleDefinitionChange = useCallback((index: number, definition: PropertyDefinition) => {
        const newDefinitions = [...definitions];
        newDefinitions[index] = definition;
        onDefinitionsChange(newDefinitions);
    }, [definitions, onDefinitionsChange]);

    // 删除属性
    const handleDeleteProperty = useCallback((index: number) => {
        const definition = definitions[index];
        const newDefinitions = definitions.filter((_, i) => i !== index);
        onDefinitionsChange(newDefinitions);

        // 同时删除对应的值
        const newValues = { ...values };
        delete newValues[definition.key];
        onValuesChange(newValues);
    }, [definitions, values, onDefinitionsChange, onValuesChange]);

    // 更新属性值
    const handleValueChange = useCallback((key: string, value: unknown) => {
        onValuesChange({
            ...values,
            [key]: value,
        });
    }, [values, onValuesChange]);

    // 获取已存在的 key 列表
    const existingKeys = definitions.map(d => d.key);

    if (collapsed) {
        return (
            <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-500 
                   hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Puzzle size={14} />
                    <span>自定义属性</span>
                    <span className="text-slate-400">· {definitions.length} 项</span>
                </div>
                <ChevronDown size={16} />
            </button>
        );
    }

    return (
        <div className="custom-properties">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Puzzle size={14} className="text-purple-500" />
                    <span className="text-sm font-medium text-slate-700">自定义属性</span>
                    {definitions.length > 0 && (
                        <span className="text-xs text-slate-400">· {definitions.length} 项</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowAddDialog(true)}
                        disabled={disabled}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 
                       hover:bg-purple-50 rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={14} />
                        添加属性
                    </button>
                    {definitions.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setCollapsed(true)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                            title="收起"
                        >
                            <ChevronUp size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* 属性列表 */}
            {definitions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <Puzzle size={32} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-500 mb-3">
                        还没有自定义属性
                    </p>
                    <button
                        type="button"
                        onClick={() => setShowAddDialog(true)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-purple-600 
                       bg-purple-50 hover:bg-purple-100 rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={14} />
                        添加第一个属性
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {definitions.map((definition, index) => (
                        <PropertyItem
                            key={definition.key}
                            definition={definition}
                            value={values[definition.key]}
                            onValueChange={(value) => handleValueChange(definition.key, value)}
                            onDefinitionChange={(newDef) => handleDefinitionChange(index, newDef)}
                            onDelete={() => handleDeleteProperty(index)}
                            deletable={!disabled}
                            configurable={!disabled}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}

            {/* 添加属性对话框 */}
            <AddPropertyDialog
                open={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onAdd={handleAddProperty}
                existingKeys={existingKeys}
            />
        </div>
    );
}

export default CustomProperties;

