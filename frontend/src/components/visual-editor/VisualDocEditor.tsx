/**
 * VisualDocEditor - 可视化文档编辑器主组件
 * 
 * 整合属性面板、富文本编辑器和源码编辑器
 * 
 * 概念区分：
 * - 文档属性（Properties）：描述文档本身的元数据，在顶部属性面板编辑
 * - 组件（Components）：文档内容中的结构化字段，通过左侧边栏插入
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Save,
    X,
    Eye,
    Edit3,
    Code,
    Loader2,
    Variable,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';
import yaml from 'js-yaml';

import { PropertiesPanel } from './PropertiesPanel';
import { RichTextEditor, type RichTextEditorRef } from './RichTextEditor';
import { BlockEditor, type BlockEditorRef } from './BlockEditor';
import { ComponentPanel, type DocumentComponentDefinition } from './ComponentPanel';
import { CodeMirrorEditor, type CodeMirrorEditorRef } from '@/components/editor/smart-editor/CodeMirrorEditor';
import { PropertyViewNode, setPropertyViewContext } from './RichTextEditor/extensions/PropertyView';
import { createSlashCommandExtension, defaultCommands, type CommandItem } from './RichTextEditor/extensions/SlashCommand';
import { useProperties } from './hooks';
import { cn } from '@/lib/utils';

// 创建 lowlight 实例
const lowlight = createLowlight(common);

export type ViewMode = 'read' | 'edit' | 'source';

export interface VisualDocEditorProps {
    /** 文档路径 */
    documentPath: string;
    /** 原始 Markdown 内容 */
    rawContent: string;
    /** 解析后的 frontmatter */
    frontmatter: Record<string, unknown>;
    /** 文档正文（不含 frontmatter） */
    bodyContent: string;
    /** 保存回调 */
    onSave: (content: string) => Promise<void>;
    /** 取消回调（可选） */
    onCancel?: () => void;
    /** 初始视图模式 */
    initialMode?: ViewMode;
    /** 隐藏头部（由外部管理视图切换时使用） */
    hideHeader?: boolean;
}

export function VisualDocEditor({
    documentPath,
    rawContent: _rawContent, // 保留 prop 供未来使用
    frontmatter: initialFrontmatter,
    bodyContent: initialBodyContent,
    onSave,
    onCancel,
    initialMode = 'edit',
    hideHeader = false,
}: VisualDocEditorProps) {
    // 状态
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [frontmatter, setFrontmatter] = useState(initialFrontmatter);
    const [bodyContent, setBodyContent] = useState(initialBodyContent);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [_showPropertySelector, setShowPropertySelector] = useState(false); // 保留：用于富文本编辑器的属性选择器
    const [showComponentPanel, setShowComponentPanel] = useState(true);

    // 文档组件状态（从 frontmatter._components 读取）
    // 注意：字段-组件绑定现在存储在每个数据块内部（_bindings），不再是文档级
    const [documentComponents, setDocumentComponents] = useState<Record<string, DocumentComponentDefinition>>(
        () => (initialFrontmatter._components as Record<string, DocumentComponentDefinition>) || {}
    );

    // 引用
    const richTextEditorRef = useRef<RichTextEditorRef>(null);
    const blockEditorRef = useRef<BlockEditorRef>(null);
    const codeEditorRef = useRef<CodeMirrorEditorRef>(null);

    // 使用 ref 存储 frontmatter 以避免 useCallback 依赖
    const frontmatterRef = useRef(frontmatter);
    frontmatterRef.current = frontmatter;

    // 稳定的 frontmatter 变更回调
    const handleFrontmatterChange = useCallback((newFrontmatter: Record<string, unknown>) => {
        setFrontmatter(newFrontmatter);
        setIsDirty(true);
    }, []);

    // 处理从模板注入组件（将模板组件合并到文档组件）
    const handleInjectComponents = useCallback((templateComponents: Record<string, unknown>) => {
        setDocumentComponents(prev => {
            const merged = { ...prev };
            for (const [id, comp] of Object.entries(templateComponents)) {
                // 如果组件ID已存在，跳过（不覆盖现有组件）
                if (!merged[id]) {
                    merged[id] = comp as DocumentComponentDefinition;
                }
            }
            return merged;
        });
        setIsDirty(true);
    }, []);

    // 处理文档组件变化
    // 简化设计：选项值就是显示名，无需同步
    const handleComponentsChange = useCallback((newComponents: Record<string, DocumentComponentDefinition>) => {
        setDocumentComponents(newComponents);
        // 同步到 frontmatter
        setFrontmatter(prev => ({
            ...prev,
            _components: Object.keys(newComponents).length > 0 ? newComponents : undefined,
        }));
        setIsDirty(true);
    }, []);

    // 属性管理
    const {
        definitions,
        values,
        definitionMap,
        setValue,
    } = useProperties({
        initialFrontmatter: frontmatter,
        onFrontmatterChange: handleFrontmatterChange,
    });

    // 创建包含属性插入命令的斜杠命令
    const slashCommands = useMemo<CommandItem[]>(() => {
        const propertyCommand: CommandItem = {
            title: '插入属性',
            description: '插入已定义的属性字段',
            icon: Variable,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).run();
                setShowPropertySelector(true);
            },
        };

        return [...defaultCommands, propertyCommand];
    }, []);

    // Tiptap 编辑器（用于编辑模式）
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            Placeholder.configure({
                placeholder: '开始输入...',
            }),
            Link.configure({
                openOnClick: false,
            }),
            Image,
            CodeBlockLowlight.configure({ lowlight }),
            PropertyViewNode,
            createSlashCommandExtension(slashCommands),
        ],
        content: bodyContent,
        editable: viewMode === 'edit',
        onUpdate: ({ editor }) => {
            setBodyContent(editor.getHTML());
            setIsDirty(true);
        },
    });

    // 设置 PropertyView 上下文
    useEffect(() => {
        setPropertyViewContext({
            definitions: definitionMap,
            values,
            onValueChange: (key, value) => {
                setValue(key, value);
                setIsDirty(true);
            },
            readonly: viewMode !== 'edit',
        });

        // 刷新编辑器
        if (editor) {
            editor.view.dispatch(editor.state.tr);
        }

        return () => {
            setPropertyViewContext(null);
        };
    }, [editor, definitionMap, values, setValue, viewMode]);

    // 同步 editable 状态
    useEffect(() => {
        if (editor) {
            editor.setEditable(viewMode === 'edit');
        }
    }, [editor, viewMode]);

    // 构建完整内容
    const buildFullContent = useCallback(() => {
        // 构建 frontmatter
        const frontmatterYaml = yaml.dump(frontmatter, {
            lineWidth: -1,
            quotingType: '"',
            forceQuotes: false,
        });

        // 构建完整内容
        return `---\n${frontmatterYaml}---\n\n${bodyContent}`;
    }, [frontmatter, bodyContent]);

    // 保存处理
    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const content = buildFullContent();
            await onSave(content);
            setIsDirty(false);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, buildFullContent, onSave]);

    // 源码内容（用于源码模式）- 仅在切换到源码模式时计算
    const [sourceContent, setSourceContent] = useState(() => buildFullContent());

    // 切换到源码模式时，同步当前内容到 sourceContent
    useEffect(() => {
        if (viewMode === 'source') {
            setSourceContent(buildFullContent());
        }
    }, [viewMode]); // 只在 viewMode 变化时执行

    // 源码变更处理
    const handleSourceChange = useCallback((newContent: string) => {
        setSourceContent(newContent);
        setIsDirty(true);
    }, []);

    // 切换出源码模式时，同步 sourceContent 到 frontmatter 和 bodyContent
    useEffect(() => {
        if (viewMode !== 'source' && sourceContent) {
            // 解析 sourceContent
            const frontmatterMatch = sourceContent.match(/^---\n([\s\S]*?)\n---\n/);
            if (frontmatterMatch) {
                try {
                    const newFrontmatter = yaml.load(frontmatterMatch[1]) as Record<string, unknown>;
                    setFrontmatter(newFrontmatter);
                    const newBody = sourceContent.slice(frontmatterMatch[0].length);
                    setBodyContent(newBody);
                    // 同步到 Tiptap 编辑器
                    if (editor && newBody !== editor.getHTML()) {
                        editor.commands.setContent(newBody);
                    }
                } catch (e) {
                    console.warn('Failed to parse frontmatter:', e);
                }
            } else {
                setBodyContent(sourceContent);
                if (editor && sourceContent !== editor.getHTML()) {
                    editor.commands.setContent(sourceContent);
                }
            }
        }
    }, [viewMode]); // 只在离开源码模式时同步

    // 插入属性引用（保留：用于富文本编辑器，暂时不使用）
    void useCallback((key: string) => {
        if (!editor) return;

        editor.chain().focus().insertContent({
            type: 'propertyView',
            attrs: { propertyKey: key },
        }).run();

        setShowPropertySelector(false);
    }, [editor]);

    // 文档标题
    const docTitle = useMemo(() => {
        return (
            frontmatter.title as string ||
            documentPath.split('/').pop()?.replace('.md', '') ||
            '未命名文档'
        );
    }, [frontmatter, documentPath]);

    return (
        <div className="visual-doc-editor min-h-full flex flex-col bg-white">
            {/* 顶部工具栏（hideHeader 为 true 时隐藏） - sticky 固定在顶部 */}
            {!hideHeader && (
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-semibold text-slate-800">{docTitle}</h1>
                        {isDirty && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                未保存
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 模式切换 */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                            <button
                                type="button"
                                onClick={() => setViewMode('read')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'read'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Eye size={16} />
                                阅读
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('edit')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'edit'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Edit3 size={16} />
                                编辑
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('source')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'source'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Code size={16} />
                                源码
                            </button>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2 ml-4">
                            {/* 取消按钮：有更改时显示，点击后丢弃更改并切换到阅读模式 */}
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        // 重置内容
                                        setFrontmatter(initialFrontmatter);
                                        setBodyContent(initialBodyContent);
                                        setIsDirty(false);
                                        // 如果有外部取消回调则调用，否则切换到阅读模式
                                        if (onCancel) {
                                            onCancel();
                                        } else {
                                            setViewMode('read');
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 
                           hover:bg-slate-100 rounded-md transition-colors"
                                >
                                    <X size={16} className="inline mr-1" />
                                    取消
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!isDirty || isSaving}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors 
                         flex items-center gap-1.5
                         ${isDirty
                                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                                {isSaving ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {isSaving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 属性面板（非源码模式显示） */}
            {viewMode !== 'source' && (
                <PropertiesPanel
                    frontmatter={frontmatter}
                    onFrontmatterChange={(newFrontmatter) => {
                        setFrontmatter(newFrontmatter);
                        setIsDirty(true);
                    }}
                    disabled={viewMode === 'read'}
                />
            )}

            {/* 主内容区域 */}
            <div className="flex-1 flex overflow-hidden">
                {/* 左侧组件面板（仅编辑模式显示） */}
                {viewMode === 'edit' && (
                    <ComponentPanel
                        components={documentComponents}
                        onComponentsChange={handleComponentsChange}
                        collapsed={!showComponentPanel}
                        onToggleCollapse={() => setShowComponentPanel(prev => !prev)}
                    />
                )}

                {/* 内容区域 */}
                <div className="flex-1 overflow-auto">
                    {viewMode === 'read' && (
                        // 阅读模式 - 只读渲染
                        <div className="max-w-4xl mx-auto px-6 py-8">
                            <RichTextEditor
                                ref={richTextEditorRef}
                                content={bodyContent}
                                showToolbar={false}
                                disabled={true}
                                minHeight="auto"
                            />
                        </div>
                    )}

                    {viewMode === 'edit' && (
                        // 编辑模式 - 块式 Markdown 编辑器
                        <div className="h-full flex flex-col">
                            <BlockEditor
                                ref={blockEditorRef}
                                value={bodyContent}
                                onChange={(val) => {
                                    setBodyContent(val);
                                    setIsDirty(true);
                                }}
                                onSave={handleSave}
                                className="flex-1"
                                documentComponents={documentComponents}
                                onInjectComponents={handleInjectComponents}
                            />
                        </div>
                    )}

                    {viewMode === 'source' && (
                        // 源码模式 - CodeMirror 编辑器
                        <div className="h-full">
                            <CodeMirrorEditor
                                ref={codeEditorRef}
                                value={sourceContent}
                                onChange={handleSourceChange}
                                onSave={handleSave}
                                className="h-full"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 底部状态栏 - sticky 固定在底部 */}
            <div className="sticky bottom-0 z-10 flex items-center justify-between px-6 py-2 border-t border-slate-200 
                      bg-slate-50 text-xs text-slate-500">
                <div className="flex items-center gap-3">
                    {/* 组件面板切换按钮 */}
                    {viewMode === 'edit' && (
                        <button
                            type="button"
                            onClick={() => setShowComponentPanel(prev => !prev)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded transition-colors",
                                showComponentPanel
                                    ? "text-purple-600 bg-purple-50 hover:bg-purple-100"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            )}
                            title={showComponentPanel ? "隐藏组件面板" : "显示组件面板"}
                        >
                            {showComponentPanel ? (
                                <PanelLeftClose size={14} />
                            ) : (
                                <PanelLeft size={14} />
                            )}
                            组件
                        </button>
                    )}
                    <span className="font-mono">{documentPath}</span>
                    {isDirty && (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            未保存
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span>{definitions.length} 个自定义属性</span>
                    <span>·</span>
                    <span className="text-slate-400">⌘S 保存</span>

                    {/* 保存操作按钮 - 在底部始终显示 */}
                    {(hideHeader || viewMode !== 'read') && (
                        <>
                            <span>·</span>
                            {isDirty && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFrontmatter(initialFrontmatter);
                                        setBodyContent(initialBodyContent);
                                        setIsDirty(false);
                                    }}
                                    className="px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                >
                                    <X size={14} className="inline mr-1" />
                                    放弃更改
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={isSaving || !isDirty}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1 rounded transition-colors",
                                    isDirty
                                        ? "bg-purple-600 text-white hover:bg-purple-700"
                                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    <>
                                        <Save size={14} />
                                        保存
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VisualDocEditor;
