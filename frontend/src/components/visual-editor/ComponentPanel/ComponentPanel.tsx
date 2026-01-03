/**
 * ComponentPanel - 文档组件面板
 * 
 * 左侧边栏，用于管理文档内定义的组件
 * - 显示已定义的组件列表
 * - 添加新组件
 * - 编辑/删除组件
 */

import { useState, useCallback } from 'react';
import {
    Plus,
    Sparkles,
    ChevronLeft,
    Settings2,
    Trash2,
    GripVertical,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComponentConfigurator } from './ComponentConfigurator';
import {
    DocumentComponentDefinition,
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

// ============================================================
// Props
// ============================================================

export interface ComponentPanelProps {
    /** 当前文档的组件定义 */
    components: Record<string, DocumentComponentDefinition>;
    /** 组件变化回调 */
    onComponentsChange: (components: Record<string, DocumentComponentDefinition>) => void;
    /** 是否折叠 */
    collapsed?: boolean;
    /** 切换折叠状态 */
    onToggleCollapse?: () => void;
    /** 自定义类名 */
    className?: string;
}

// ============================================================
// 组件项
// ============================================================

interface ComponentItemProps {
    component: DocumentComponentDefinition;
    onEdit: () => void;
    onDelete: () => void;
}

function ComponentItem({ component, onEdit, onDelete }: ComponentItemProps) {
    const meta = getComponentTypeMeta(component.type);
    const IconComponent = meta ? getLucideIcon(meta.icon) : null;

    return (
        <div className="group flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all">
            {/* 拖拽手柄（预留） */}
            <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

            {/* 图标 */}
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                {IconComponent ? (
                    <IconComponent className="w-4 h-4 text-purple-600" size={16} />
                ) : (
                    <Sparkles className="w-4 h-4 text-purple-600" />
                )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-700 truncate">
                    {component.label}
                </div>
                <div className="text-xs text-slate-400 truncate">
                    {meta?.name} · {component.id}
                </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    type="button"
                    onClick={onEdit}
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    title="编辑组件"
                >
                    <Settings2 size={14} />
                </button>
                <button
                    type="button"
                    onClick={onDelete}
                    className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    title="删除组件"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function ComponentPanel({
    components,
    onComponentsChange,
    collapsed = false,
    onToggleCollapse,
    className,
}: ComponentPanelProps) {
    const [showConfigurator, setShowConfigurator] = useState(false);
    const [editingComponent, setEditingComponent] = useState<DocumentComponentDefinition | null>(null);

    const componentList = Object.values(components);

    // 添加组件
    const handleAddComponent = useCallback(() => {
        setEditingComponent(null);
        setShowConfigurator(true);
    }, []);

    // 编辑组件
    const handleEditComponent = useCallback((component: DocumentComponentDefinition) => {
        setEditingComponent(component);
        setShowConfigurator(true);
    }, []);

    // 删除组件
    const handleDeleteComponent = useCallback(
        (componentId: string) => {
            if (!confirm(`确定要删除组件 "${components[componentId]?.label}" 吗？`)) {
                return;
            }
            const newComponents = { ...components };
            delete newComponents[componentId];
            onComponentsChange(newComponents);
        },
        [components, onComponentsChange]
    );

    // 保存组件
    const handleSaveComponent = useCallback(
        (component: DocumentComponentDefinition) => {
            const newComponents = {
                ...components,
                [component.id]: component,
            };
            onComponentsChange(newComponents);
            setShowConfigurator(false);
            setEditingComponent(null);
        },
        [components, onComponentsChange]
    );

    // 折叠状态
    if (collapsed) {
        return (
            <div
                className={cn(
                    'w-12 bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4',
                    className
                )}
            >
                <button
                    type="button"
                    onClick={onToggleCollapse}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                    title="展开组件面板"
                >
                    <Sparkles className="w-5 h-5" />
                </button>
                {componentList.length > 0 && (
                    <div className="mt-2 w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-medium flex items-center justify-center">
                        {componentList.length}
                    </div>
                )}
            </div>
        );
    }

    return (
        <>
            <div
                className={cn(
                    'w-64 bg-slate-50 border-r border-slate-200 flex flex-col',
                    className
                )}
            >
                {/* 头部 */}
                <div className="px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            文档组件
                        </h3>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleAddComponent}
                                className="p-1.5 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                                title="添加组件"
                            >
                                <Plus size={14} />
                            </button>
                            {onToggleCollapse && (
                                <button
                                    type="button"
                                    onClick={onToggleCollapse}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="折叠面板"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* 组件列表 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3 space-y-2">
                        {componentList.length > 0 ? (
                            componentList.map((component) => (
                                <ComponentItem
                                    key={component.id}
                                    component={component}
                                    onEdit={() => handleEditComponent(component)}
                                    onDelete={() => handleDeleteComponent(component.id)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                                    <Sparkles className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-500 mb-1">暂无组件</p>
                                <p className="text-xs text-slate-400 mb-4">
                                    添加组件后可在数据块中使用
                                </p>
                                <button
                                    type="button"
                                    onClick={handleAddComponent}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 
                    bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                    <Plus size={14} />
                                    添加第一个组件
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 底部说明 */}
                <div className="px-4 py-3 border-t border-slate-200 bg-white">
                    <p className="text-xs text-slate-500">
                        组件定义后可在数据块字段中绑定使用，提供下拉、评分等结构化输入。
                    </p>
                </div>
            </div>

            {/* 组件配置器弹窗 */}
            {showConfigurator && (
                <ComponentConfigurator
                    component={editingComponent}
                    existingIds={Object.keys(components)}
                    onSave={handleSaveComponent}
                    onClose={() => {
                        setShowConfigurator(false);
                        setEditingComponent(null);
                    }}
                />
            )}
        </>
    );
}

export default ComponentPanel;

