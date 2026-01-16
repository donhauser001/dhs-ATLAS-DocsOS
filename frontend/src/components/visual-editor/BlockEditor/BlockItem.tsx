/**
 * 单个块组件 - 精致版
 */

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Plus,
    Trash2,
    Type,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    List,
    Minus,
    Database,
    Paperclip,
} from 'lucide-react';
import type { Block, BlockType } from './types';
import { BLOCK_TYPE_OPTIONS, generateDefaultDataBlockContent } from './types';
import { DataBlockEditor } from './DataBlockEditor';
import { TemplateSelector } from './TemplateSelector';
import { FileManagerDialog, FileCard, type FileReference } from '../FileManager';
import type { DocumentComponentDefinition } from '../ComponentPanel/types';
import type { StatusOption } from './StatusOptionsDialog';
import type { IdConfig } from './IdConfigDialog';
import type { TemplateComponent } from '@/api/data-templates';

const ICON_MAP: Record<string, React.ElementType> = {
    Type,
    Heading1,
    Heading2,
    Heading3,
    Quote,
    Code,
    List,
    Minus,
    Database,
    Paperclip,
};

interface BlockItemProps {
    block: Block;
    isSelected: boolean;
    onSelect: () => void;
    onChange: (block: Block) => void;
    onDelete: () => void;
    onAddBelow: () => void;
    onTypeChange: (type: BlockType) => void;
    /** 同步数据块结构、组件绑定、状态选项和编号配置的回调（纯前端操作） */
    onSyncDataStructure?: (dataType: string, fieldKeys: string[], bindings?: Record<string, string>, statusOptions?: StatusOption[], idConfig?: IdConfig) => number;
    /** 文档组件定义（来自文档级 _components） */
    documentComponents?: Record<string, DocumentComponentDefinition>;
    /** 注入模板组件到文档的回调 */
    onInjectComponents?: (components: Record<string, TemplateComponent>) => void;
    /** 块失焦回调（用于防抖优化） */
    onBlur?: () => void;
}

export function BlockItem({
    block,
    isSelected,
    onSelect,
    onChange,
    onDelete,
    onAddBelow,
    onTypeChange,
    onSyncDataStructure,
    documentComponents = {},
    onInjectComponents,
    onBlur,
}: BlockItemProps) {
    const [showTypeMenu, setShowTypeMenu] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [showFileManager, setShowFileManager] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const templateSelectorRef = useRef<HTMLDivElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // 点击外部关闭菜单
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowTypeMenu(false);
            }
        };
        if (showTypeMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showTypeMenu]);

    // 选中后聚焦
    useEffect(() => {
        if (isSelected && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSelected]);

    // 自动调整高度 - 根据块类型设置不同的最小高度
    const adjustHeight = (el: HTMLTextAreaElement | null) => {
        if (!el) return;
        
        // 根据块类型设置最小高度（标题需要更高）
        const minHeights: Record<string, number> = {
            heading1: 40,  // 2xl 字体
            heading2: 36,  // xl 字体
            heading3: 32,  // lg 字体
            paragraph: 24,
            code: 24,
            quote: 24,
        };
        const minHeight = minHeights[block.type] || 24;
        
        el.style.height = '0';
        el.style.height = Math.max(el.scrollHeight, minHeight) + 'px';
    };

    // 初始化高度
    useEffect(() => {
        if (inputRef.current) {
            adjustHeight(inputRef.current);
        }
    }, [block.content]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ ...block, content: e.target.value });
        adjustHeight(e.target);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code' && block.type !== 'yaml') {
            e.preventDefault();
            onAddBelow();
        }
        if (e.key === 'Backspace' && !block.content) {
            e.preventDefault();
            onDelete();
        }
        if (e.key === '/' && !block.content) {
            e.preventDefault();
            setShowTypeMenu(true);
        }
    };

    // 渲染块内容
    const renderContent = () => {
        const baseInputClass = "w-full bg-transparent resize-none outline-none leading-relaxed overflow-hidden";

        // Atlas 数据块 - 使用精细化编辑器
        if (block.type === 'data') {
            // 从内容中提取 type 字段的值
            const typeMatch = block.content.match(/^type:\s*(.+)$/m);
            const dataTypeId = typeMatch ? typeMatch[1].trim() : '';
            
            // 类型 ID → 中文名称映射（后续可从类型包配置动态加载）
            const TYPE_NAMES: Record<string, string> = {
                'personal_info': '个人信息',
                'contact_methods': '联系方式',
                'address_info': '地址信息',
                'social_accounts': '社交账号',
                'tags_notes': '标签与备注',
                // 通用类型
                'data': '数据',
                'info': '信息',
                'list': '列表',
                'table': '表格',
            };
            
            const dataTypeName = TYPE_NAMES[dataTypeId] || dataTypeId || '数据';
            
            return (
                <div className="px-2 py-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                            {dataTypeName}
                        </span>
                    </div>
                    <DataBlockEditor
                        content={block.content}
                        onChange={(newContent) => onChange({ ...block, content: newContent })}
                        onSyncStructure={onSyncDataStructure}
                        documentComponents={documentComponents}
                    />
                </div>
            );
        }

        // 代码块
        if (block.type === 'code') {
            return (
                <div className="px-3 py-2">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                            {block.language || 'code'}
                        </span>
                    </div>
                    <textarea
                        ref={inputRef}
                        value={block.content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        className={`${baseInputClass} font-mono text-sm text-slate-800`}
                        placeholder="输入代码..."
                    />
                </div>
            );
        }

        // 分隔线
        if (block.type === 'divider') {
            return (
                <div className="py-4 flex items-center justify-center">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                </div>
            );
        }

        // 引用
        if (block.type === 'quote') {
            return (
                <div className="px-3 py-2">
                    <textarea
                        ref={inputRef}
                        value={block.content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        className={`${baseInputClass} text-slate-500 italic`}
                        placeholder="引用内容..."
                    />
                </div>
            );
        }

        // 列表
        if (block.type === 'list') {
            const items = block.content.split('\n').filter(Boolean);
            return (
                <div className="space-y-1">
                    {items.length > 0 ? items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                            <span className="text-slate-400 mt-1.5">•</span>
                            <span className="text-slate-700">{item}</span>
                        </div>
                    )) : null}
                    <textarea
                        ref={inputRef}
                        value={block.content}
                        onChange={handleContentChange}
                        onKeyDown={handleKeyDown}
                        className={`${baseInputClass} text-slate-700 hidden`}
                        placeholder="列表项（每行一项）..."
                    />
                    <input
                        type="text"
                        className="w-full bg-transparent outline-none text-slate-700 text-sm pl-5"
                        placeholder="+ 添加列表项"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value) {
                                onChange({
                                    ...block,
                                    content: block.content ? block.content + '\n' + e.currentTarget.value : e.currentTarget.value,
                                });
                                e.currentTarget.value = '';
                            }
                        }}
                    />
                </div>
            );
        }

        // 文件块
        if (block.type === 'file') {
            // 如果已有文件引用，渲染 FileCard
            if (block.fileRef) {
                return (
                    <div className="px-2 py-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">文件</span>
                        </div>
                        <FileCard
                            file={block.fileRef}
                            onReplace={() => setShowFileManager(true)}
                            onDelete={() => onChange({ ...block, fileRef: undefined, content: '' })}
                        />
                    </div>
                );
            }

            // 未选择文件，显示选择按钮
            return (
                <div className="px-2 py-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">文件</span>
                    </div>
                    <button
                        onClick={() => setShowFileManager(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-8 
                                 border-2 border-dashed border-slate-200 rounded-xl
                                 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 
                                 hover:bg-indigo-50/50 transition-all"
                    >
                        <Paperclip size={20} />
                        <span>点击选择文件</span>
                    </button>
                </div>
            );
        }

        // 标题 - 添加适当的垂直内边距以适应更大的字体
        const headingStyles: Record<string, string> = {
            heading1: 'text-2xl font-bold text-slate-900 py-1',
            heading2: 'text-xl font-semibold text-slate-800 py-0.5',
            heading3: 'text-lg font-medium text-slate-700 py-0.5',
        };

        if (block.type.startsWith('heading')) {
            return (
                <textarea
                    ref={inputRef}
                    value={block.content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    className={`${baseInputClass} ${headingStyles[block.type]}`}
                    placeholder={block.type === 'heading1' ? '标题' : block.type === 'heading2' ? '二级标题' : '三级标题'}
                />
            );
        }

        // 段落
        return (
            <textarea
                ref={inputRef}
                value={block.content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className={`${baseInputClass} text-slate-700`}
                placeholder="输入文本，或按 / 选择格式..."
            />
        );
    };

    return (
        <div
            id={`block-${block.id}`}
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-start transition-all duration-150 rounded-lg
        ${isHovered && !isSelected ? 'bg-slate-50/50' : ''}
        ${isSelected ? 'bg-slate-100/60 z-10' : ''}
        ${isDragging ? 'shadow-lg bg-white' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onSelect}
            onBlur={onBlur}
        >
            {/* 左侧操作区 - Notion 风格：+ 和手柄横排 */}
            <div className={`flex items-center pt-1.5 pr-1 transition-opacity duration-150 
        ${isHovered || isSelected || showTypeMenu ? 'opacity-100' : 'opacity-0'}`}>
                {/* 添加按钮 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddBelow();
                    }}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    title="点击添加块"
                >
                    <Plus size={13} />
                </button>

                {/* 手柄 + 菜单 */}
                <div className="relative" ref={menuRef}>
                    <button
                        {...attributes}
                        {...listeners}
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowTypeMenu(!showTypeMenu);
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                        title="拖动移动 · 点击打开菜单"
                    >
                        <GripVertical size={13} />
                    </button>

                    {/* 操作菜单 */}
                    {showTypeMenu && (
                        <div className="absolute left-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200/80 
              py-1.5 z-50 min-w-[200px] backdrop-blur-sm">
                            {/* 转换类型 */}
                            <div className="px-3 py-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                                转换为
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                                {BLOCK_TYPE_OPTIONS.map((option) => {
                                    const Icon = ICON_MAP[option.icon] || Type;
                                    const isActive = block.type === option.type;
                                    return (
                                        <button
                                            key={option.type}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // 如果是数据类型且当前不是数据类型，显示模板选择器
                                                if (option.type === 'data' && block.type !== 'data') {
                                                    setShowTypeMenu(false);
                                                    setShowTemplateSelector(true);
                                                } else if (option.type === 'file') {
                                                    // 文件类型直接打开文件管理器
                                                    setShowTypeMenu(false);
                                                    setShowFileManager(true);
                                                } else {
                                                    onTypeChange(option.type);
                                                    setShowTypeMenu(false);
                                                }
                                            }}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                        ${isActive
                                                    ? 'bg-purple-50 text-purple-700'
                                                    : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <Icon size={14} className={isActive ? 'text-purple-500' : 'text-slate-400'} />
                                            <span className="flex-1 text-left">{option.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* 删除 */}
                            <div className="border-t border-slate-100 mt-1 pt-1">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                        setShowTypeMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 size={14} />
                                    <span>删除</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 块内容 */}
            <div className="flex-1 min-w-0 py-0.5 px-1">
                {renderContent()}
            </div>

            {/* 模板选择器弹窗 */}
            {showTemplateSelector && (
                <>
                    {/* 遮罩 */}
                    <div
                        className="fixed inset-0 z-40 bg-black/10"
                        onClick={() => setShowTemplateSelector(false)}
                    />
                    {/* 选择器 */}
                    <div
                        ref={templateSelectorRef}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
                    >
                        <TemplateSelector
                            onSelect={(dataContent, components) => {
                                onChange({ ...block, type: 'data', content: dataContent });
                                // 如果模板有组件，注入到文档
                                if (components && Object.keys(components).length > 0 && onInjectComponents) {
                                    onInjectComponents(components);
                                }
                                setShowTemplateSelector(false);
                            }}
                            onClose={() => setShowTemplateSelector(false)}
                            onSelectBlank={() => {
                                onChange({
                                    ...block,
                                    type: 'data',
                                    content: generateDefaultDataBlockContent()
                                });
                            }}
                        />
                    </div>
                </>
            )}

            {/* 文件管理器对话框 */}
            <FileManagerDialog
                open={showFileManager}
                onClose={() => setShowFileManager(false)}
                onSelect={(file: FileReference) => {
                    onChange({
                        ...block,
                        type: 'file',
                        content: `file:${file.path}`,
                        fileRef: file,
                    });
                    setShowFileManager(false);
                }}
                title="选择文件"
            />
        </div>
    );
}

export default BlockItem;
