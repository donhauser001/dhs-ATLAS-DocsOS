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
import YAML from 'yaml';
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    ChevronDown, ChevronRight, Plus, User, Calendar, Tag,
    FileType, Workflow, Info, X, Copy, Check
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PropertyDefinition, PropertyValues, DocumentPropertyFields, PropertyComponentConfig } from '@/types/property';
import { AddPropertyDialog } from './AddPropertyDialog';
import { SystemPropertiesSection, type SystemPropertyValues } from './SystemPropertiesSection';
import { CustomPropertiesSection } from './CustomPropertiesSection';
import { ViewSwitcher } from './ViewSwitcher';
import type { PropertiesPanelProps, PropertiesPanelMode } from './types';
import { DEFAULT_SYSTEM_ORDER, formatRelativeTime, formatDateDisplay, COLOR_CLASSES, getDefaultTagColor } from './utils';
import { fetchDocTypeConfig, type DocTypeConfig, type DocTypeItem } from '@/api/doc-types';
import { fetchFunctionTypeConfig, type FunctionTypeConfig } from '@/api/function-types';
import { useLabels } from '@/providers/LabelProvider';
// 导入能力组件注册表
import { CapabilityActions } from '@/components/capabilities';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type IconComponent = React.ComponentType<any>;

/**
 * 获取 Lucide 图标组件
 */
function getIcon(iconName?: string): IconComponent | null {
    if (!iconName) return null;
    const pascalCase = iconName
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (LucideIcons as any)[pascalCase] || null;
}

/**
 * 元信息行组件 - 显示作者、时间和标签
 */
function MetaInfoRow({ frontmatter }: { frontmatter: Record<string, unknown> }) {
    const { getColor } = useLabels();

    const author = frontmatter.author as string || '';
    const created = (frontmatter.created_at || frontmatter.created) as string || '';
    const updated = (frontmatter.updated_at || frontmatter.updated) as string || '';
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];

    // 时间显示：优先显示更新时间
    const timeDisplay = updated ? formatRelativeTime(updated) : (created ? formatRelativeTime(created) : null);
    const timeTitle = updated ? `更新于 ${formatDateDisplay(updated)}` : (created ? `创建于 ${formatDateDisplay(created)}` : '');

    const hasMetaInfo = author || timeDisplay || tags.length > 0;

    if (!hasMetaInfo) return null;

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* 作者 */}
            {author && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                    <User size={13} className="text-slate-400" />
                    {author}
                </span>
            )}

            {/* 分隔点 */}
            {author && timeDisplay && <span className="text-slate-300 text-sm">·</span>}

            {/* 时间 */}
            {timeDisplay && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500" title={timeTitle}>
                    <Calendar size={13} className="text-slate-400" />
                    {timeDisplay}
                </span>
            )}

            {/* 分隔点 */}
            {(author || timeDisplay) && tags.length > 0 && <span className="text-slate-300 text-sm">·</span>}

            {/* 标签 */}
            {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((tag, idx) => {
                        const tagStr = String(tag);
                        const systemColor = getColor(tagStr);
                        const colorClasses = systemColor
                            ? COLOR_CLASSES[systemColor] || COLOR_CLASSES.slate
                            : getDefaultTagColor(idx);

                        return (
                            <span
                                key={tagStr}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                    colorClasses.bg,
                                    colorClasses.text,
                                )}
                            >
                                <Tag size={10} />
                                {tagStr}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/** 解析 atlas-data 块结构（不含数据值） */
function parseDataBlockStructure(content: string): Array<{ type: string; fields: string[] }> {
    const blocks: Array<{ type: string; fields: string[] }> = [];
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

/** 生成可复制的文档模板 */
function generateDocumentTemplate(
    frontmatter: Record<string, unknown>,
    content: string
): string {
    // 1. 构建 frontmatter（移除数据相关字段，保留结构）
    const templateFrontmatter: Record<string, unknown> = {};
    
    // 保留结构性字段
    if (frontmatter['doc-type']) templateFrontmatter['doc-type'] = frontmatter['doc-type'];
    if (frontmatter.document_type) templateFrontmatter.document_type = frontmatter.document_type;
    
    // 设置占位符
    templateFrontmatter.title = '{{标题}}';
    templateFrontmatter.created = '{{创建时间}}';
    templateFrontmatter.updated = '{{更新时间}}';
    templateFrontmatter.author = '{{作者}}';
    
    // 保留 atlas 配置
    if (frontmatter.atlas) {
        templateFrontmatter.atlas = frontmatter.atlas;
    }
    
    // 保留 _components 定义
    if (frontmatter._components) {
        templateFrontmatter._components = frontmatter._components;
    }
    
    // 2. 使用 yaml 库生成 frontmatter
    const yamlContent = YAML.stringify(templateFrontmatter, {
        indent: 2,
        lineWidth: 0, // 不自动换行
    });
    const frontmatterBlock = `---\n${yamlContent}---`;
    
    // 3. 解析并重建数据块（清空数据值）
    const bodyLines: string[] = [];
    const blockRegex = /```atlas-data\s*([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    
    // 查找标题行
    const titleMatch = content.match(/^#\s+.+$/m);
    if (titleMatch) {
        bodyLines.push('\n# {{标题}}\n');
    }
    
    while ((match = blockRegex.exec(content)) !== null) {
        // 查找这个块之前的标题（## 开头的行）
        const beforeBlock = content.slice(lastIndex, match.index);
        const sectionTitle = beforeBlock.match(/##\s+(.+)\s*$/m);
        if (sectionTitle) {
            bodyLines.push(`\n## ${sectionTitle[1]}\n`);
        }
        
        // 解析数据块
        const blockContent = match[1];
        const lines = blockContent.split('\n');
        let type = '';
        const fields: Array<{ key: string; defaultValue: string }> = [];
        const bindings: Array<{ key: string; comp: string }> = [];
        let inData = false;
        let inBindings = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('type:')) {
                type = trimmed.replace('type:', '').trim();
            } else if (trimmed === 'data:') {
                inData = true;
                inBindings = false;
            } else if (trimmed === '_bindings:') {
                inData = false;
                inBindings = true;
            } else if (inData && trimmed.includes(':')) {
                const colonIdx = trimmed.indexOf(':');
                const key = trimmed.slice(0, colonIdx).trim();
                if (key && !key.startsWith('-')) {
                    // 清空值，保持结构
                    fields.push({ key, defaultValue: '""' });
                }
            } else if (inBindings && trimmed.includes(':')) {
                const colonIdx = trimmed.indexOf(':');
                const key = trimmed.slice(0, colonIdx).trim();
                const comp = trimmed.slice(colonIdx + 1).trim();
                if (key && comp) {
                    bindings.push({ key, comp });
                }
            }
        }
        
        // 重建数据块
        const blockLines = ['```atlas-data', `type: ${type}`, 'data:'];
        for (const field of fields) {
            blockLines.push(`  ${field.key}: ${field.defaultValue}`);
        }
        if (bindings.length > 0) {
            blockLines.push('_bindings:');
            for (const b of bindings) {
                blockLines.push(`  ${b.key}: ${b.comp}`);
            }
        }
        blockLines.push('```');
        
        bodyLines.push(blockLines.join('\n'));
        lastIndex = match.index + match[0].length;
    }
    
    return frontmatterBlock + bodyLines.join('\n') + '\n';
}

export function PropertiesPanel({
    frontmatter,
    onFrontmatterChange,
    content,
    disabled = false,
    defaultExpanded = true,
    mode: controlledMode,
    onModeChange,
    documentPath,
    displayMode,
    onDisplayModeChange,
}: PropertiesPanelProps) {
    // 内部模式状态（非受控模式时使用）
    const [internalMode, setInternalMode] = useState<PropertiesPanelMode>('edit');

    // 使用受控或非受控模式
    const mode = controlledMode !== undefined ? controlledMode : internalMode;

    // 处理模式切换
    const handleModeChange = useCallback((newMode: PropertiesPanelMode) => {
        if (controlledMode === undefined) {
            setInternalMode(newMode);
        }
        onModeChange?.(newMode);
    }, [controlledMode, onModeChange]);

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
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [editingConfig, setEditingConfig] = useState<string | null>(null);
    const [showTechInfo, setShowTechInfo] = useState(false); // 技术信息浮动面板
    const [copied, setCopied] = useState(false); // 复制成功状态
    const techInfoRef = useRef<HTMLDivElement>(null); // 弹窗 ref，用于检测点击外部关闭

    // 复制文档结构到剪贴板
    const handleCopyTemplate = useCallback(async () => {
        if (!content) return;
        
        try {
            const template = generateDocumentTemplate(frontmatter, content);
            await navigator.clipboard.writeText(template);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    }, [frontmatter, content]);

    // 点击外部关闭配置弹窗
    useEffect(() => {
        if (!showTechInfo) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (techInfoRef.current && !techInfoRef.current.contains(event.target as Node)) {
                setShowTechInfo(false);
            }
        };

        // 延迟添加监听，避免触发按钮本身的点击
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [showTechInfo]);

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
    const documentType = frontmatter.document_type as string || '';
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
    const docTypeDisplay = useMemo(() => {
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
    const functionDisplay = useMemo(() => {
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
            return modeId; // 如果找不到，返回原始 ID
        });
    }, [displayModeConfig, displayModes]);

    // 解析系统属性值
    const systemValues = useMemo<SystemPropertyValues>(() => {
        const atlas = (frontmatter.atlas as Record<string, unknown>) || {};

        // 处理 atlas.display 的向后兼容性：旧文档可能是字符串，需要转换为数组
        const rawDisplay = atlas.display;
        let displayModes: string[] = [];
        if (Array.isArray(rawDisplay)) {
            displayModes = rawDisplay as string[];
        } else if (typeof rawDisplay === 'string' && rawDisplay) {
            displayModes = [rawDisplay];
        }

        return {
            title: frontmatter.title as string || '',
            author: frontmatter.author as string || '',
            created: frontmatter.created as string || new Date().toISOString(),
            updated: frontmatter.updated as string || new Date().toISOString(),
            version: frontmatter.version as string || '1.0',
            document_type: frontmatter.document_type as string || '',
            'atlas.function': atlas.function as string || '',
            'atlas.display': displayModes,
            'atlas.capabilities': (atlas.capabilities as string[]) || [],
        };
    }, [frontmatter]);

    // 系统属性顺序
    // 确保新添加的系统属性按照默认顺序插入到正确位置
    const systemOrder = useMemo(() => {
        const savedOrder = frontmatter._systemOrder as string[] | undefined;

        if (!savedOrder) {
            return DEFAULT_SYSTEM_ORDER;
        }

        // 检查是否有新的系统属性需要添加
        const missingKeys = DEFAULT_SYSTEM_ORDER.filter(key => !savedOrder.includes(key));

        if (missingKeys.length === 0) {
            return savedOrder;
        }

        // 将缺失的属性按默认顺序插入到正确位置
        const result = [...savedOrder];
        for (const missingKey of missingKeys) {
            // 找到该属性在默认顺序中的位置
            const defaultIndex = DEFAULT_SYSTEM_ORDER.indexOf(missingKey);

            // 找到在默认顺序中它之前的属性，看看在 result 中的位置
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
    const customValues = useMemo<PropertyValues>(() => {
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

                // 如果默认功能存在且当前功能为空，则自动填充
                if (docType.defaultFunction && !currentAtlas.function) {
                    newFrontmatter.atlas = {
                        ...currentAtlas,
                        function: docType.defaultFunction,
                    };
                }

                // 如果默认显现模式存在且当前显现模式为空，则自动填充（转换为数组）
                const currentDisplay = currentAtlas.display;
                const isDisplayEmpty = !currentDisplay ||
                    (Array.isArray(currentDisplay) && currentDisplay.length === 0);

                if (docType.defaultDisplay && isDisplayEmpty) {
                    newFrontmatter.atlas = {
                        ...(newFrontmatter.atlas as Record<string, unknown>),
                        display: [docType.defaultDisplay], // 转换为数组
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

    // 阅读模式：显示文档信息卡片
    if (mode === 'read') {
        return (
            <div className="bg-white border-b border-slate-100">
                <div className="px-6 py-3">
                    {/* 操作按钮 + 视图切换器（标题已在顶部标签栏显示，这里不重复） */}
                    <div className="flex items-center justify-between gap-4">
                        {/* 元信息行：作者 · 时间 · 标签 · 评论数 · 属性按钮 */}
                        <div className="flex items-center gap-4">
                            <MetaInfoRow frontmatter={frontmatter} />
                            {/* inline 类型能力（如评论数） */}
                            {capabilities.length > 0 && documentPath && (
                                <CapabilityActions
                                    capabilities={capabilities}
                                    documentPath={documentPath}
                                    frontmatter={frontmatter}
                                    renderMode="inline"
                                />
                            )}
                            {/* 配置按钮（技术信息） */}
                            {(docTypeDisplay || functionDisplay) && (
                                <div className="relative" ref={techInfoRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTechInfo(!showTechInfo)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors",
                                            showTechInfo
                                                ? "text-purple-600 bg-purple-50"
                                                : "text-slate-500 hover:text-purple-600 hover:bg-purple-50"
                                        )}
                                        title="查看文档配置"
                                    >
                                        <Info size={14} />
                                        配置
                                    </button>

                                    {/* 属性信息浮动面板 */}
                                    {showTechInfo && (
                                        <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
                                            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                                                <span className="text-xs font-medium text-slate-600">文档配置信息</span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={handleCopyTemplate}
                                                        className={cn(
                                                            "p-1 rounded transition-colors",
                                                            copied
                                                                ? "text-green-500 bg-green-50"
                                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                                        )}
                                                        title="复制文档结构"
                                                    >
                                                        {copied ? <Check size={12} /> : <Copy size={12} />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowTechInfo(false)}
                                                        className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto">
                                                <div className="p-3 space-y-3 text-sm">
                                                    {/* doc-type */}
                                                    {frontmatter['doc-type'] && (
                                                        <div className="flex items-start gap-2">
                                                            <Tag size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400">类型包</div>
                                                                <div className="text-slate-700 font-medium">{frontmatter['doc-type'] as string}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 文档类型 */}
                                                    {docTypeDisplay && (
                                                        <div className="flex items-start gap-2">
                                                            {docTypeDisplay.icon ? (
                                                                (() => {
                                                                    const Icon = getIcon(docTypeDisplay.icon);
                                                                    return Icon ? <Icon size={14} className="text-purple-500 mt-0.5 flex-shrink-0" /> : <FileType size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />;
                                                                })()
                                                            ) : (
                                                                <FileType size={14} className="text-purple-500 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400">文档类型</div>
                                                                <div className="text-slate-700 font-medium">{docTypeDisplay.label}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 功能类型 */}
                                                    {functionDisplay && (
                                                        <div className="flex items-start gap-2">
                                                            {functionDisplay.icon ? (
                                                                (() => {
                                                                    const Icon = getIcon(functionDisplay.icon);
                                                                    return Icon ? <Icon size={14} className="text-blue-500 mt-0.5 flex-shrink-0" /> : <Workflow size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />;
                                                                })()
                                                            ) : (
                                                                <Workflow size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400">功能类型</div>
                                                                <div className="text-slate-700 font-medium">{functionDisplay.label}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 显现模式 */}
                                                    {displayModeLabels.length > 0 && (
                                                        <div className="flex items-start gap-2">
                                                            <Workflow size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400">显现模式</div>
                                                                <div className="text-slate-700">{displayModeLabels.join('、')}</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 能力列表 */}
                                                    {capabilities.length > 0 && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                                            <Workflow size={14} className="text-cyan-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400 mb-1">能力 ({capabilities.length})</div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {capabilities.map((cap: string) => (
                                                                        <span key={cap} className="inline-block px-1.5 py-0.5 text-xs bg-cyan-50 text-cyan-700 rounded">
                                                                            {cap}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 组件配置 */}
                                                    {frontmatter._components && typeof frontmatter._components === 'object' && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                                            <Workflow size={14} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400 mb-1">
                                                                    组件配置 ({Object.keys(frontmatter._components as object).length})
                                                                </div>
                                                                <div className="space-y-1">
                                                                    {Object.entries(frontmatter._components as Record<string, { type?: string; label?: string }>).map(([id, comp]) => (
                                                                        <div key={id} className="flex items-center gap-1.5 text-xs">
                                                                            <span className="text-slate-400 font-mono truncate max-w-[80px]" title={id}>{id.slice(-8)}</span>
                                                                            <span className="text-slate-300">→</span>
                                                                            <span className="text-purple-600">{comp.type || 'unknown'}</span>
                                                                            {comp.label && <span className="text-slate-500">({comp.label})</span>}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 数据块结构 */}
                                                    {dataBlockStructure.length > 0 && (
                                                        <div className="flex items-start gap-2 pt-2 border-t border-slate-100">
                                                            <LucideIcons.Database size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs text-slate-400 mb-1">
                                                                    数据块结构 ({dataBlockStructure.length})
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {dataBlockStructure.map((block, idx) => (
                                                                        <div key={idx} className="bg-slate-50 rounded p-1.5">
                                                                            <div className="text-xs font-medium text-indigo-600 mb-1">{block.type}</div>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {block.fields.map((field) => (
                                                                                    <span key={field} className="inline-block px-1.5 py-0.5 text-xs bg-white text-slate-600 rounded border border-slate-200">
                                                                                        {field}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 右侧：能力操作按钮 + 视图切换器 */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* 能力操作按钮（仅 button 类型） */}
                            {capabilities.length > 0 && documentPath && (
                                <CapabilityActions
                                    capabilities={capabilities}
                                    documentPath={documentPath}
                                    frontmatter={frontmatter}
                                    renderMode="button"
                                />
                            )}

                            {/* 视图切换器（如果有多个显现模式） */}
                            {displayModes.length > 1 && documentPath && (
                                <ViewSwitcher
                                    documentPath={documentPath}
                                    availableModes={displayModes}
                                    activeMode={displayMode}
                                    onModeChange={onDisplayModeChange}
                                    compact
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 编辑模式：显示可编辑的属性表单
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
