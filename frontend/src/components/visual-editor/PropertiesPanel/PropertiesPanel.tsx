/**
 * PropertiesPanel - Obsidian 风格的文档属性面板
 * 
 * 位于文档顶部，类似 Obsidian 的 Properties 面板设计
 * 在大屏幕上以三列排列，节省空间，支持拖拽排序
 * 
 * 概念说明：
 * - 文档属性（Properties）：描述文档本身的元数据
 * - 组件（Components）：用于文档内容中的结构化字段
 */

import { useState, useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import type { PropertyDefinition, PropertyValues, DocumentPropertyFields, PropertyComponentConfig } from '@/types/property';
import { AddPropertyDialog } from './AddPropertyDialog';
import { SystemPropertiesSection, type SystemPropertyValues } from './SystemPropertiesSection';
import { CustomPropertiesSection } from './CustomPropertiesSection';
import type { PropertiesPanelProps } from './types';
import { DEFAULT_SYSTEM_ORDER } from './utils';

export function PropertiesPanel({
    frontmatter,
    onFrontmatterChange,
    disabled = false,
    defaultExpanded = true,
}: PropertiesPanelProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingConfig, setEditingConfig] = useState<string | null>(null);

    // 解析系统属性值
    const systemValues = useMemo<SystemPropertyValues>(() => ({
        version: frontmatter.version as string || '1.0',
        document_type: frontmatter.document_type as string || 'facts',
        created: frontmatter.created as string,
        updated: frontmatter.updated as string,
        author: frontmatter.author as string,
        'atlas.function': (frontmatter.atlas as Record<string, unknown>)?.function as string,
        'atlas.capabilities': (frontmatter.atlas as Record<string, unknown>)?.capabilities as string[],
    }), [frontmatter]);

    // 系统属性顺序
    const systemOrder = useMemo(() => {
        return (frontmatter._systemOrder as string[]) || DEFAULT_SYSTEM_ORDER;
    }, [frontmatter]);

    // 自定义属性定义
    const customDefinitions = useMemo<PropertyDefinition[]>(() => {
        const props = (frontmatter as DocumentPropertyFields)._properties || {};
        const order = (frontmatter._customOrder as string[]) || Object.keys(props);
        return order
            .filter(key => props[key])
            .map(key => ({ key, ...props[key] } as PropertyDefinition));
    }, [frontmatter]);

    // 自定义属性值
    const customValues = useMemo<PropertyValues>(() => {
        return (frontmatter as DocumentPropertyFields)._values || {};
    }, [frontmatter]);

    // 更新系统属性
    const handleSystemChange = useCallback((key: string, value: unknown) => {
        const newFrontmatter = { ...frontmatter };
        if (key.startsWith('atlas.')) {
            const atlasKey = key.replace('atlas.', '');
            newFrontmatter.atlas = {
                ...(frontmatter.atlas as Record<string, unknown> || {}),
                [atlasKey]: value,
            };
        } else {
            newFrontmatter[key] = value;
        }
        onFrontmatterChange(newFrontmatter);
    }, [frontmatter, onFrontmatterChange]);

    // 更新自定义属性值
    const handleValueChange = useCallback((key: string, value: unknown) => {
        onFrontmatterChange({
            ...frontmatter,
            _values: { ...customValues, [key]: value },
        });
    }, [frontmatter, customValues, onFrontmatterChange]);

    // 更新自定义属性配置
    const handleConfigChange = useCallback((key: string, config: PropertyComponentConfig) => {
        const props = (frontmatter as DocumentPropertyFields)._properties || {};
        onFrontmatterChange({
            ...frontmatter,
            _properties: { ...props, [key]: { ...props[key], config } },
        });
    }, [frontmatter, onFrontmatterChange]);

    // 添加新属性
    const handleAddProperty = useCallback((definition: PropertyDefinition) => {
        const props = (frontmatter as DocumentPropertyFields)._properties || {};
        const { key, ...rest } = definition;
        const currentOrder = (frontmatter._customOrder as string[]) || Object.keys(props);
        onFrontmatterChange({
            ...frontmatter,
            _properties: { ...props, [key]: rest },
            _customOrder: [...currentOrder, key],
        });
        setShowAddDialog(false);
    }, [frontmatter, onFrontmatterChange]);

    // 删除自定义属性
    const handleDeleteProperty = useCallback((key: string) => {
        const props = { ...(frontmatter as DocumentPropertyFields)._properties || {} };
        const values = { ...(frontmatter as DocumentPropertyFields)._values || {} };
        const currentOrder = (frontmatter._customOrder as string[]) || Object.keys(props);
        delete props[key];
        delete values[key];
        onFrontmatterChange({
            ...frontmatter,
            _properties: props,
            _values: values,
            _customOrder: currentOrder.filter(k => k !== key),
        });
    }, [frontmatter, onFrontmatterChange]);

    // 系统属性拖拽结束
    const handleSystemDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = systemOrder.indexOf(active.id as string);
            const newIndex = systemOrder.indexOf(over.id as string);
            onFrontmatterChange({
                ...frontmatter,
                _systemOrder: arrayMove(systemOrder, oldIndex, newIndex),
            });
        }
    }, [systemOrder, frontmatter, onFrontmatterChange]);

    // 自定义属性拖拽结束
    const handleCustomDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const keys = customDefinitions.map(d => d.key);
            const oldIndex = keys.indexOf(active.id as string);
            const newIndex = keys.indexOf(over.id as string);
            onFrontmatterChange({
                ...frontmatter,
                _customOrder: arrayMove(keys, oldIndex, newIndex),
            });
        }
    }, [customDefinitions, frontmatter, onFrontmatterChange]);

    // 切换属性配置编辑
    const handleToggleConfig = useCallback((key: string) => {
        setEditingConfig(prev => prev === key ? null : key);
    }, []);

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
                        onSystemChange={handleSystemChange}
                        onDragEnd={handleSystemDragEnd}
                    />

                    {/* 分隔线 */}
                    {customDefinitions.length > 0 && <div className="h-px bg-slate-100 my-3" />}

                    {/* 自定义属性区 */}
                    <CustomPropertiesSection
                        customDefinitions={customDefinitions}
                        customValues={customValues}
                        editingConfig={editingConfig}
                        disabled={disabled}
                        onValueChange={handleValueChange}
                        onToggleConfig={handleToggleConfig}
                        onDeleteProperty={handleDeleteProperty}
                        onConfigChange={handleConfigChange}
                        onDragEnd={handleCustomDragEnd}
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

export default PropertiesPanel;
