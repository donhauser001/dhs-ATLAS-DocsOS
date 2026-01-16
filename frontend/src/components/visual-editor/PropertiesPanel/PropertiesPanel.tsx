/**
 * PropertiesPanel - Obsidian 风格的文档属性面板
 * 
 * 位于文档顶部，类似 Obsidian 的 Properties 面板设计
 * 在大屏幕上以三列排列，节省空间，支持拖拽排序
 * 
 * 支持两种模式：
 * - read（阅读模式）：显示美观的文档信息卡片
 * - edit（编辑模式）：显示可编辑的属性表单
 * 
 * 概念说明：
 * - 文档属性（Properties）：描述文档本身的元数据
 * - 组件（Components）：用于文档内容中的结构化字段
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import type { PropertyDefinition, DocumentPropertyFields, PropertyComponentConfig } from '@/types/property';
import { SystemPropertyValues } from './SystemPropertiesSection';
import { ReadModePanel } from './ReadModePanel';
import { EditModePanel } from './EditModePanel';
import type { PropertiesPanelProps, PropertiesPanelMode } from './types';
import type { DocTypeDisplay, FunctionDisplay, DataBlockStructure } from './TechInfoPanel';
import { DEFAULT_SYSTEM_ORDER } from './utils';
import { fetchDocTypeConfig, type DocTypeConfig, type DocTypeItem } from '@/api/doc-types';
import { fetchFunctionTypeConfig, type FunctionTypeConfig } from '@/api/function-types';

/** 解析 atlas-data 块结构（不含数据值） */
function parseDataBlockStructure(content: string): DataBlockStructure[] {
    const blocks: DataBlockStructure[] = [];
    const blockRegex = /```atlas-data\s*([\s\S]*?)```/g;
    let match;

    while ((match = blockRegex.exec(content)) !== null) {
        try {
            const blockContent = match[1];
            const lines = blockContent.split('\n');
            let type = '';
            const fields: string[] = [];
            let inData = false;

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('type:')) {
                    type = trimmed.replace('type:', '').trim();
                } else if (trimmed === 'data:') {
                    inData = true;
                } else if (trimmed.startsWith('_bindings:') || trimmed.startsWith('schema:')) {
                    inData = false;
                } else if (inData && trimmed.includes(':')) {
                    const fieldKey = trimmed.split(':')[0].trim();
                    if (fieldKey && !fieldKey.startsWith('-')) {
                        fields.push(fieldKey);
                    }
                }
            }

            if (type) {
                blocks.push({ type, fields });
            }
        } catch {
            // 解析失败跳过
        }
    }

    return blocks;
}

export function PropertiesPanel({
    frontmatter,
    onFrontmatterChange,
    content,
    disabled = false,
    defaultExpanded = true,
    mode: controlledMode,
    onModeChange: _onModeChange,
    documentPath,
    displayMode,
    onDisplayModeChange,
}: PropertiesPanelProps) {
    // 内部模式状态（非受控模式时使用）
    const [internalMode] = useState<PropertiesPanelMode>('edit');

    // 使用受控或非受控模式
    const mode = controlledMode !== undefined ? controlledMode : internalMode;

    // 获取显现模式数组（用于视图切换器）
    const displayModes = useMemo(() => {
        const atlas = (frontmatter.atlas as Record<string, unknown>) || {};
        const rawDisplay = atlas.display;
        if (Array.isArray(rawDisplay)) {
            return rawDisplay.map(String);
        } else if (typeof rawDisplay === 'string' && rawDisplay) {
            return [rawDisplay];
        }
        return [];
    }, [frontmatter]);

    const [editingConfig, setEditingConfig] = useState<string | null>(null);

    // 配置缓存
    const docTypeConfigRef = useRef<DocTypeConfig | null>(null);
    const [functionTypeConfig, setFunctionTypeConfig] = useState<FunctionTypeConfig | null>(null);
    const [docTypeConfig, setDocTypeConfig] = useState<DocTypeConfig | null>(null);
    const [displayModeConfig, setDisplayModeConfig] = useState<import('@/api/display-modes').DisplayModeConfig | null>(null);

    // 加载配置
    useEffect(() => {
        fetchDocTypeConfig()
            .then(config => {
                docTypeConfigRef.current = config;
                setDocTypeConfig(config);
            })
            .catch(console.error);
        fetchFunctionTypeConfig().then(setFunctionTypeConfig).catch(console.error);
        import('@/api/display-modes').then(({ fetchDisplayModeConfig }) => {
            fetchDisplayModeConfig().then(setDisplayModeConfig).catch(console.error);
        });
    }, []);

    // 解析 Atlas 配置
    const atlas = useMemo(() => (frontmatter.atlas as Record<string, unknown>) || {}, [frontmatter]);
    // 兼容新旧字段名：document_type 和 doc-type
    const documentType = (frontmatter.document_type || frontmatter['doc-type']) as string || '';
    const functionType = atlas.function as string || '';
    const capabilities = useMemo(() => {
        return Array.isArray(atlas.capabilities) ? atlas.capabilities as string[] : [];
    }, [atlas]);

    // 解析数据块结构（不含数据值）
    const dataBlockStructure = useMemo(() => {
        if (!content) return [];
        return parseDataBlockStructure(content);
    }, [content]);

    // 获取文档类型的语义化显示
    const docTypeDisplay = useMemo<DocTypeDisplay | null>(() => {
        if (!docTypeConfig || !documentType) return null;

        for (const group of docTypeConfig.groups) {
            const item = group.items.find(i => i.id === documentType);
            if (item) {
                const categoryLabels: Record<string, string> = {
                    system: '系统文档',
                    business: '业务文档',
                    content: '内容文档',
                };
                return {
                    category: categoryLabels[group.id] || group.label,
                    label: item.label,
                    icon: item.icon,
                };
            }
        }
        return null;
    }, [docTypeConfig, documentType]);

    // 获取功能类型的语义化显示
    const functionDisplay = useMemo<FunctionDisplay | null>(() => {
        if (!functionTypeConfig || !functionType) return null;

        for (const group of functionTypeConfig.groups) {
            const item = group.items.find(i => i.id === functionType);
            if (item) {
                return { label: item.label, icon: item.icon };
            }
        }
        return null;
    }, [functionTypeConfig, functionType]);

    // 获取显现模式的中文标签
    const displayModeLabels = useMemo(() => {
        if (!displayModeConfig || displayModes.length === 0) return [];

        return displayModes.map(modeId => {
            for (const group of displayModeConfig.groups) {
                const item = group.items.find(i => i.id === modeId);
                if (item) {
                    return item.label;
                }
            }
            return modeId;
        });
    }, [displayModeConfig, displayModes]);

    // 解析系统属性值
    const systemValues = useMemo<SystemPropertyValues>(() => {
        const atlas = (frontmatter.atlas as Record<string, unknown>) || {};

        const rawDisplay = atlas.display;
        let displayModesArray: string[] = [];
        if (Array.isArray(rawDisplay)) {
            displayModesArray = rawDisplay as string[];
        } else if (typeof rawDisplay === 'string' && rawDisplay) {
            displayModesArray = [rawDisplay];
        }

        return {
            title: frontmatter.title as string || '',
            author: frontmatter.author as string || '',
            created: frontmatter.created as string || new Date().toISOString(),
            updated: frontmatter.updated as string || new Date().toISOString(),
            version: frontmatter.version as string || '1.0',
            document_type: (frontmatter.document_type || frontmatter['doc-type']) as string || '',
            'atlas.function': atlas.function as string || '',
            'atlas.display': displayModesArray,
            'atlas.capabilities': (atlas.capabilities as string[]) || [],
            slug: frontmatter.slug as string || '',
        };
    }, [frontmatter]);

    // 系统属性顺序
    const systemOrder = useMemo(() => {
        const savedOrder = frontmatter._systemOrder as string[] | undefined;

        if (!savedOrder) {
            return DEFAULT_SYSTEM_ORDER;
        }

        const missingKeys = DEFAULT_SYSTEM_ORDER.filter(key => !savedOrder.includes(key));

        if (missingKeys.length === 0) {
            return savedOrder;
        }

        const result = [...savedOrder];
        for (const missingKey of missingKeys) {
            const defaultIndex = DEFAULT_SYSTEM_ORDER.indexOf(missingKey);
            let insertIndex = 0;
            for (let i = defaultIndex - 1; i >= 0; i--) {
                const prevKey = DEFAULT_SYSTEM_ORDER[i];
                const prevIndex = result.indexOf(prevKey);
                if (prevIndex !== -1) {
                    insertIndex = prevIndex + 1;
                    break;
                }
            }
            result.splice(insertIndex, 0, missingKey);
        }

        return result;
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
    const customValues = useMemo(() => {
        return (frontmatter as DocumentPropertyFields)._values || {};
    }, [frontmatter]);

    // 根据文档类型 ID 查找类型信息
    const findDocType = useCallback((typeId: string): DocTypeItem | null => {
        if (!docTypeConfigRef.current) return null;
        for (const group of docTypeConfigRef.current.groups) {
            const item = group.items.find(i => i.id === typeId);
            if (item) return item;
        }
        return null;
    }, []);

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

        // 当文档类型变化时，自动填充默认的功能类型和显现模式
        if (key === 'document_type' && value) {
            const docType = findDocType(String(value));
            if (docType) {
                const currentAtlas = (newFrontmatter.atlas as Record<string, unknown>) || {};

                if (docType.defaultFunction && !currentAtlas.function) {
                    newFrontmatter.atlas = {
                        ...currentAtlas,
                        function: docType.defaultFunction,
                    };
                }

                const currentDisplay = currentAtlas.display;
                const isDisplayEmpty = !currentDisplay ||
                    (Array.isArray(currentDisplay) && currentDisplay.length === 0);

                if (docType.defaultDisplay && isDisplayEmpty) {
                    newFrontmatter.atlas = {
                        ...(newFrontmatter.atlas as Record<string, unknown>),
                        display: [docType.defaultDisplay],
                    };
                }
            }
        }

        onFrontmatterChange(newFrontmatter);
    }, [frontmatter, onFrontmatterChange, findDocType]);

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

    // 阅读模式
    if (mode === 'read') {
        return (
            <ReadModePanel
                frontmatter={frontmatter}
                content={content}
                documentPath={documentPath}
                displayMode={displayMode}
                displayModes={displayModes}
                onDisplayModeChange={onDisplayModeChange}
                docTypeDisplay={docTypeDisplay}
                functionDisplay={functionDisplay}
                displayModeLabels={displayModeLabels}
                capabilities={capabilities}
                dataBlockStructure={dataBlockStructure}
            />
        );
    }

    // 编辑模式
    return (
        <EditModePanel
            systemValues={systemValues}
            systemOrder={systemOrder}
            customDefinitions={customDefinitions}
            customValues={customValues}
            editingConfig={editingConfig}
            disabled={disabled}
            onSystemChange={handleSystemChange}
            onSystemDragEnd={handleSystemDragEnd}
            onValueChange={handleValueChange}
            onToggleConfig={handleToggleConfig}
            onDeleteProperty={handleDeleteProperty}
            onConfigChange={handleConfigChange}
            onCustomDragEnd={handleCustomDragEnd}
            onAddProperty={handleAddProperty}
            defaultExpanded={defaultExpanded}
        />
    );
}

export default PropertiesPanel;
