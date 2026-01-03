/**
 * SortableCustomProperty - 可拖拽排序的自定义属性组件
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tag, X, Settings, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { safeRenderComponent } from '@/registry/property-components';
import type { SortableCustomPropertyProps } from './types';
import { getComponentIcon } from './utils';

export function SortableCustomProperty({
    definition,
    component,
    value,
    isEditing,
    disabled,
    onValueChange,
    onToggleConfig,
    onDelete,
    onConfigChange,
}: SortableCustomPropertyProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: definition.key, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative",
                isEditing && "col-span-full",
                isDragging && "opacity-50 z-10"
            )}
        >
            <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-100",
                "hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
            )}>
                {/* 拖拽手柄 */}
                {!disabled && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors"
                    >
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                )}

                {/* 图标 */}
                <div className="flex-shrink-0">
                    {component ? getComponentIcon(component.icon) : <Tag className="w-3.5 h-3.5 text-slate-400" />}
                </div>

                {/* 标签 */}
                <div className="flex-shrink-0 flex items-center gap-1">
                    <span className="text-xs text-slate-500">{definition.label}</span>
                    {definition.description && (
                        <span className="text-xs text-slate-400 cursor-help" title={definition.description}>
                            ⓘ
                        </span>
                    )}
                </div>

                {/* 分隔符 */}
                <span className="text-slate-300">:</span>

                {/* 值 - 使用组件库渲染 */}
                <div className="flex-1 min-w-0">
                    {safeRenderComponent(
                        definition.type,
                        'editor',
                        value,
                        { ...definition.config, options: definition.options },
                        onValueChange,
                        { disabled, readonly: disabled }
                    )}
                </div>

                {/* 操作按钮 */}
                {!disabled && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={onToggleConfig}
                            className={cn(
                                "p-1 rounded transition-colors",
                                isEditing
                                    ? "text-purple-600 bg-purple-50"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            )}
                            title="配置属性"
                        >
                            <Settings className="w-3 h-3" />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="删除属性"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}
            </div>

            {/* 配置面板 */}
            {isEditing && component && (
                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-medium text-slate-700">
                            配置 - {definition.label}
                        </h4>
                        <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded">
                            {component.name}
                        </span>
                    </div>
                    {component.renderConfig(
                        { ...definition.config, options: definition.options },
                        onConfigChange
                    )}
                </div>
            )}
        </div>
    );
}

export default SortableCustomProperty;

