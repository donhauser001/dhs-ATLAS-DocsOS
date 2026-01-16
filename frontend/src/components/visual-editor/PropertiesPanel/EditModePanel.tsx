/**
 * EditModePanel - 编辑模式属性面板
 * 显示可编辑的属性表单
 */

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { PropertyDefinition, PropertyComponentConfig } from '@/types/property';
import { AddPropertyDialog } from './AddPropertyDialog';
import { SystemPropertiesSection, type SystemPropertyValues } from './SystemPropertiesSection';
import { CustomPropertiesSection } from './CustomPropertiesSection';

interface EditModePanelProps {
    systemValues: SystemPropertyValues;
    systemOrder: string[];
    customDefinitions: PropertyDefinition[];
    customValues: Record<string, unknown>;
    editingConfig: string | null;
    disabled: boolean;
    onSystemChange: (key: string, value: unknown) => void;
    onSystemDragEnd: (event: DragEndEvent) => void;
    onValueChange: (key: string, value: unknown) => void;
    onToggleConfig: (key: string) => void;
    onDeleteProperty: (key: string) => void;
    onConfigChange: (key: string, config: PropertyComponentConfig) => void;
    onCustomDragEnd: (event: DragEndEvent) => void;
    onAddProperty: (definition: PropertyDefinition) => void;
    defaultExpanded?: boolean;
}

export function EditModePanel({
    systemValues,
    systemOrder,
    customDefinitions,
    customValues,
    editingConfig,
    disabled,
    onSystemChange,
    onSystemDragEnd,
    onValueChange,
    onToggleConfig,
    onDeleteProperty,
    onConfigChange,
    onCustomDragEnd,
    onAddProperty,
    defaultExpanded = true,
}: EditModePanelProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showAddDialog, setShowAddDialog] = useState(false);

    const handleAddProperty = useCallback((definition: PropertyDefinition) => {
        onAddProperty(definition);
        setShowAddDialog(false);
    }, [onAddProperty]);

    return (
        <div className="bg-white border-b border-slate-100">
            {/* 标题栏 */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
                {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <span>文档属性</span>
                <span className="text-xs text-slate-400 ml-2">{systemOrder.length + customDefinitions.length} 个属性</span>
                <span className="text-xs text-slate-300 ml-auto">描述文档本身的元数据</span>
            </button>

            {/* 属性网格 */}
            {expanded && (
                <div className="px-6 pb-4">
                    {/* 系统属性区 */}
                    <SystemPropertiesSection
                        systemValues={systemValues}
                        systemOrder={systemOrder}
                        disabled={disabled}
                        onSystemChange={onSystemChange}
                        onDragEnd={onSystemDragEnd}
                    />

                    {/* 分隔线 */}
                    {customDefinitions.length > 0 && <div className="h-px bg-slate-100 my-3" />}

                    {/* 自定义属性区 */}
                    <CustomPropertiesSection
                        customDefinitions={customDefinitions}
                        customValues={customValues}
                        editingConfig={editingConfig}
                        disabled={disabled}
                        onValueChange={onValueChange}
                        onToggleConfig={onToggleConfig}
                        onDeleteProperty={onDeleteProperty}
                        onConfigChange={onConfigChange}
                        onDragEnd={onCustomDragEnd}
                    />

                    {/* 添加属性按钮 */}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={() => setShowAddDialog(true)}
                            className="flex items-center justify-center gap-2 mt-3 px-3 py-2 text-xs text-slate-500 
                         hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors w-full 
                         border border-dashed border-slate-200 hover:border-purple-300"
                            title="为文档添加自定义元数据属性"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>添加文档属性</span>
                        </button>
                    )}
                </div>
            )}

            {/* 添加属性对话框 */}
            {showAddDialog && (
                <AddPropertyDialog
                    open={showAddDialog}
                    onAdd={handleAddProperty}
                    onClose={() => setShowAddDialog(false)}
                    existingKeys={customDefinitions.map(d => d.key)}
                />
            )}
        </div>
    );
}

export default EditModePanel;
