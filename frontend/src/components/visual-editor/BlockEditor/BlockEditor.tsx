/**
 * 块式 Markdown 编辑器 - 精致版
 */

import { useState, useEffect, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import yaml from 'js-yaml';
import type { Block, BlockType } from './types';
import { generateDefaultDataBlockContent } from './types';
import { parseMarkdownToBlocks, blocksToMarkdown } from './parser';
import { BlockItem } from './BlockItem';
import type { DocumentComponentDefinition } from '../ComponentPanel/types';
import type { StatusOption } from './StatusOptionsDialog';
import { type IdConfig, generateId, DEFAULT_ID_CONFIG } from './IdConfigDialog';
import type { TemplateComponent } from '@/api/data-templates';

/** 内部状态选项键名 */
const INTERNAL_STATUS_OPTIONS_KEY = '_status_options';
/** 内部编号配置键名 */
const INTERNAL_ID_CONFIG_KEY = '_id_config';

export interface BlockEditorRef {
    getContent: () => string;
    setContent: (content: string) => void;
    focus: () => void;
    /** 获取当前选中的块 ID（用于视口同步） */
    getSelectedBlockId: () => string | null;
    /** 立即同步内容（跳过防抖） */
    flushContent: () => void;
}

export interface BlockEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSave?: () => void;
    readOnly?: boolean;
    className?: string;
    /** 文档组件定义（来自文档级 _components） */
    documentComponents?: Record<string, DocumentComponentDefinition>;
    /** 注入模板组件到文档的回调 */
    onInjectComponents?: (components: Record<string, TemplateComponent>) => void;
}

export const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(function BlockEditor(
    { value, onChange, onSave, readOnly = false, className = '', documentComponents = {}, onInjectComponents },
    ref
) {
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // 使用 ref 存储最新的 blocks，确保同步函数能访问到最新状态
    const blocksRef = useRef<Block[]>(blocks);
    blocksRef.current = blocks;

    // 初始化
    useEffect(() => {
        const parsedBlocks = parseMarkdownToBlocks(value);
        setBlocks(parsedBlocks.length > 0 ? parsedBlocks : [createEmptyBlock()]);
    }, []);

    // 同步外部值
    useEffect(() => {
        const currentMarkdown = blocksToMarkdown(blocks);
        if (value !== currentMarkdown && blocks.length > 0) {
            const parsedBlocks = parseMarkdownToBlocks(value);
            if (parsedBlocks.length > 0) {
                setBlocks(parsedBlocks);
            }
        }
    }, [value]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const createEmptyBlock = useCallback((): Block => ({
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'paragraph',
        content: '',
    }), []);

    // 防抖序列化：延迟 300ms 后再触发 onChange
    // 提升大文档时的输入性能
    const debouncedSerialize = useDebouncedCallback((newBlocks: Block[]) => {
        onChange(blocksToMarkdown(newBlocks));
    }, 300);

    // 立即同步（用于保存前或块失焦时）
    const flushSerialize = useCallback(() => {
        debouncedSerialize.flush();
    }, [debouncedSerialize]);

    const updateBlocks = useCallback((newBlocks: Block[]) => {
        setBlocks(newBlocks);
        debouncedSerialize(newBlocks);
    }, [debouncedSerialize]);

    // 块失焦时立即同步
    const handleBlockBlur = useCallback(() => {
        flushSerialize();
    }, [flushSerialize]);

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
        getContent: () => blocksToMarkdown(blocks),
        setContent: (content: string) => {
            const parsedBlocks = parseMarkdownToBlocks(content);
            setBlocks(parsedBlocks.length > 0 ? parsedBlocks : [createEmptyBlock()]);
        },
        focus: () => {
            if (blocks.length > 0) {
                setSelectedBlockId(blocks[0].id);
            }
        },
        getSelectedBlockId: () => selectedBlockId,
        flushContent: flushSerialize,
    }), [blocks, selectedBlockId, flushSerialize]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            updateBlocks(arrayMove(blocks, oldIndex, newIndex));
        }
    };

    const handleBlockChange = (index: number, updatedBlock: Block) => {
        const newBlocks = [...blocks];
        newBlocks[index] = updatedBlock;
        updateBlocks(newBlocks);
    };

    const handleBlockDelete = (index: number) => {
        if (blocks.length === 1) {
            updateBlocks([{ ...blocks[0], content: '' }]);
            return;
        }
        const newBlocks = blocks.filter((_, i) => i !== index);
        updateBlocks(newBlocks);
        setSelectedBlockId(newBlocks[Math.max(0, index - 1)]?.id || null);
    };

    const handleAddBlock = (index: number) => {
        const newBlock = createEmptyBlock();
        const newBlocks = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
        updateBlocks(newBlocks);
        setSelectedBlockId(newBlock.id);
    };

    const handleTypeChange = (index: number, newType: BlockType) => {
        const newBlocks = [...blocks];
        const currentBlock = newBlocks[index];

        // 如果转换为数据块且当前内容为空，使用默认模板
        if (newType === 'yaml' && (!currentBlock.content || currentBlock.content.trim() === '')) {
            newBlocks[index] = {
                ...currentBlock,
                type: newType,
                content: generateDefaultDataBlockContent()
            };
        } else {
            newBlocks[index] = { ...currentBlock, type: newType };
        }

        updateBlocks(newBlocks);
    };

    // 同步数据块结构（纯前端操作）
    // 找到当前文档中所有同类型的 YAML 数据块，统一字段结构、组件绑定、状态选项和编号配置
    const handleSyncDataStructure = useCallback((dataType: string, fieldKeys: string[], sourceBindings?: Record<string, string>, sourceStatusOptions?: StatusOption[], sourceIdConfig?: IdConfig) => {
        let updatedCount = 0;

        // 使用 ref 获取最新的 blocks 状态
        const currentBlocks = blocksRef.current;

        // 如果有编号配置，先收集所有同类型数据块的现有编号，用于确定下一个编号
        const idConfig = sourceIdConfig || DEFAULT_ID_CONFIG;
        const hasIdField = fieldKeys.includes('id');
        // 源数据块的冻结状态决定是否重新生成所有编号
        const sourceIdFrozen = idConfig.frozen === true;

        // 用于分配新编号的计数器（从 startFrom 开始）
        let nextSequence = idConfig.startFrom;

        const newBlocks = currentBlocks.map((block) => {
            // 只处理 YAML 块
            if (block.type !== 'yaml') return block;

            try {
                // 解析 YAML 内容
                const data = yaml.load(block.content) as Record<string, unknown>;

                // 检查类型是否匹配
                if (!data || data.type !== dataType) return block;

                // 构建新的数据对象，按照 fieldKeys 的顺序
                const newData: Record<string, unknown> = {};

                for (const key of fieldKeys) {
                    if (key === 'id' && hasIdField) {
                        // 处理 id 字段
                        // 按照源数据块的 frozen 状态决定是否重新生成编号
                        if (sourceIdFrozen && data.id) {
                            // 源数据块设置为冻结，保留所有现有编号
                            newData[key] = data.id;
                        } else {
                            // 源数据块未冻结，按新格式重新生成编号
                            newData[key] = generateId(idConfig, nextSequence);
                            nextSequence++;
                        }
                    } else {
                        // 保留原有值，如果没有则设为空字符串
                        newData[key] = data[key] ?? '';
                    }
                }

                // 同步组件绑定：使用源数据块的绑定
                if (sourceBindings && Object.keys(sourceBindings).length > 0) {
                    // 只保留在新字段中存在的绑定
                    const newBindings: Record<string, string> = {};
                    for (const [fieldKey, componentId] of Object.entries(sourceBindings)) {
                        if (fieldKeys.includes(fieldKey)) {
                            newBindings[fieldKey] = componentId;
                        }
                    }
                    if (Object.keys(newBindings).length > 0) {
                        newData._bindings = newBindings;
                    }
                }

                // 同步状态选项：仅当有 status 字段时
                if (fieldKeys.includes('status') && sourceStatusOptions && sourceStatusOptions.length > 0) {
                    newData[INTERNAL_STATUS_OPTIONS_KEY] = sourceStatusOptions;
                }

                // 同步编号配置：仅当有 id 字段时
                if (hasIdField && sourceIdConfig) {
                    // 只有非默认配置时才写入
                    const isDefault = JSON.stringify(sourceIdConfig) === JSON.stringify(DEFAULT_ID_CONFIG);
                    if (!isDefault) {
                        newData[INTERNAL_ID_CONFIG_KEY] = sourceIdConfig;
                    }
                }

                // 序列化回 YAML
                const newContent = yaml.dump(newData, {
                    lineWidth: -1,
                    quotingType: '"',
                    forceQuotes: false
                }).trim();

                // 检查是否有变化
                if (newContent !== block.content) {
                    updatedCount++;
                    return { ...block, content: newContent };
                }
            } catch {
                // 解析失败的块保持不变
            }

            return block;
        });

        if (updatedCount > 0) {
            updateBlocks(newBlocks);
        }

        return updatedCount;
    }, [updateBlocks]);

    // 快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave]);

    const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

    if (readOnly) {
        return (
            <div className={`block-editor-readonly px-6 py-6 ${className}`}>
                {blocks.map((block) => (
                    <div key={block.id} className="mb-3">
                        {renderReadOnlyBlock(block)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`block-editor px-6 py-6 ${className}`}>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                        {blocks.map((block, index) => (
                            <BlockItem
                                key={block.id}
                                block={block}
                                isSelected={selectedBlockId === block.id}
                                onSelect={() => setSelectedBlockId(block.id)}
                                onChange={(b) => handleBlockChange(index, b)}
                                onDelete={() => handleBlockDelete(index)}
                                onAddBelow={() => handleAddBlock(index)}
                                onTypeChange={(type) => handleTypeChange(index, type)}
                                onSyncDataStructure={handleSyncDataStructure}
                                documentComponents={documentComponents}
                                onInjectComponents={onInjectComponents}
                                onBlur={handleBlockBlur}
                            />
                        ))}
                    </div>
                </SortableContext>

                {/* 拖拽预览 */}
                <DragOverlay>
                    {activeBlock && (
                        <div className="bg-white rounded-lg shadow-xl border border-purple-200 p-3 opacity-90">
                            <div className="text-sm text-slate-600 truncate max-w-[300px]">
                                {activeBlock.content || '空块'}
                            </div>
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* 底部添加按钮 */}
            <button
                onClick={() => handleAddBlock(blocks.length - 1)}
                className="mt-6 flex items-center gap-2 text-slate-400 hover:text-purple-500 text-sm 
          transition-colors py-2 px-3 rounded-lg hover:bg-purple-50/50 group"
            >
                <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                <span>新建块</span>
            </button>
        </div>
    );
});

function renderReadOnlyBlock(block: Block): React.ReactNode {
    switch (block.type) {
        case 'heading1':
            return <h1 className="text-2xl font-bold text-slate-900 mb-4">{block.content}</h1>;
        case 'heading2':
            return <h2 className="text-xl font-semibold text-slate-800 mb-3">{block.content}</h2>;
        case 'heading3':
            return <h3 className="text-lg font-medium text-slate-700 mb-2">{block.content}</h3>;
        case 'paragraph':
            return <p className="text-slate-700 leading-relaxed">{block.content}</p>;
        case 'code':
            return (
                <div className="bg-slate-100 rounded-lg px-3 py-2">
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                        {block.language || 'code'}
                    </span>
                    <pre className="mt-2 text-sm font-mono text-slate-700 overflow-x-auto">
                        <code>{block.content}</code>
                    </pre>
                </div>
            );
        case 'yaml':
            return (
                <div className="px-3 py-2">
                    <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">数据</span>
                    <pre className="mt-2 text-sm font-mono text-slate-600">{block.content}</pre>
                </div>
            );
        case 'quote':
            return (
                <div className="bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-slate-500 italic">{block.content}</p>
                </div>
            );
        case 'list':
            return (
                <ul className="space-y-1">
                    {(block.items || block.content.split('\n')).map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-700">
                            <span className="text-slate-400 mt-0.5">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            );
        case 'divider':
            return <hr className="border-0 h-px bg-slate-200 my-4" />;
        default:
            return <p className="text-slate-700">{block.content}</p>;
    }
}

export default BlockEditor;
