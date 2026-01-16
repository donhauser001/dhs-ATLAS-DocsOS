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
import { useNavigate } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import {
    Eye,
    Edit3,
    Code,
    Variable,
    PanelLeftClose,
    PanelLeft,
    Clock,
    X,
    Loader2,
    Save,
} from 'lucide-react';
import yaml from 'js-yaml';
import { rename as renameFile } from '@/api/files';
import { getDocumentSlug } from '@/api/adl';

import { PropertiesPanel } from './PropertiesPanel';
// RichTextEditor 保留用于未来扩展
// import { RichTextEditor, type RichTextEditorRef } from './RichTextEditor';
import { BlockEditor, type BlockEditorRef } from './BlockEditor';
import { ComponentPanel, type DocumentComponentDefinition } from './ComponentPanel';
import { CodeMirrorEditor, type CodeMirrorEditorRef } from '@/components/editor/smart-editor/CodeMirrorEditor';
import { PropertyViewNode, setPropertyViewContext } from './RichTextEditor/extensions/PropertyView';
import { createSlashCommandExtension, defaultCommands, type CommandItem } from './RichTextEditor/extensions/SlashCommand';
import { DisplayRenderer } from '@/components/display-renderers';
import { useProperties, useCommitBuffer } from './hooks';
import { cn } from '@/lib/utils';

// ============================================================
// 显现模式相关工具函数
// ============================================================

/**
 * 获取 localStorage key（用于存储显现模式偏好）
 */
function getDisplayModeStorageKey(documentPath: string): string {
    return `atlas-display-mode:${documentPath}`;
}

/**
 * 从 frontmatter 获取可用的显现模式列表
 */
function getAvailableDisplayModes(frontmatter: Record<string, unknown>): string[] {
    const atlas = (frontmatter.atlas as Record<string, unknown>) || {};
    const rawDisplay = atlas.display;

    if (Array.isArray(rawDisplay)) {
        return rawDisplay.map(String);
    } else if (typeof rawDisplay === 'string' && rawDisplay) {
        return [rawDisplay];
    }

    // 默认使用单栏文章
    return ['article.single'];
}

/**
 * 获取初始显现模式（优先 localStorage，其次第一个可用模式）
 */
function getInitialDisplayMode(documentPath: string, availableModes: string[]): string {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(getDisplayModeStorageKey(documentPath));
        if (saved && availableModes.includes(saved)) {
            return saved;
        }
    }
    return availableModes[0] || 'article.single';
}

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
    onCancel: _onCancel, // 保留 prop 供未来使用
    initialMode = 'edit',
    hideHeader = false,
}: VisualDocEditorProps) {
    const navigate = useNavigate();

    // 状态
    const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
    const [frontmatter, setFrontmatter] = useState(initialFrontmatter);
    const [bodyContent, setBodyContent] = useState(initialBodyContent);
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [_showPropertySelector, setShowPropertySelector] = useState(false); // 保留：用于富文本编辑器的属性选择器
    const [showComponentPanel, setShowComponentPanel] = useState(true);
    const [documentSlug, setDocumentSlug] = useState<string | null>(null);

    // 获取文档 slug（用于显示简洁 URL）
    useEffect(() => {
        getDocumentSlug(documentPath)
            .then(({ slug }) => setDocumentSlug(slug))
            .catch(() => setDocumentSlug(null));
    }, [documentPath]);

    // 显现模式状态
    const availableDisplayModes = useMemo(() => getAvailableDisplayModes(frontmatter), [frontmatter]);
    const [displayMode, setDisplayMode] = useState<string>(() =>
        getInitialDisplayMode(documentPath, availableDisplayModes)
    );

    // 显现模式变更处理
    const handleDisplayModeChange = useCallback((mode: string) => {
        // 保存到 localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem(getDisplayModeStorageKey(documentPath), mode);
        }
        setDisplayMode(mode);
    }, [documentPath]);


    // Commit Buffer：批量收集变更，显式提交
    // 注意：addChange 将在子组件中通过 context 或 props 使用
    const {
        pendingChanges,
        addChange: _addChange, // 保留供未来使用
        commitAll,
        discardAll,
        hasPendingChanges,
        pendingCount,
    } = useCommitBuffer();

    // 暴露 pendingChanges 供调试（未来移除）
    void pendingChanges;

    // 文档组件状态（从 frontmatter._components 读取）
    // 注意：字段-组件绑定现在存储在每个数据块内部（_bindings），不再是文档级
    const [documentComponents, setDocumentComponents] = useState<Record<string, DocumentComponentDefinition>>(
        () => (initialFrontmatter._components as Record<string, DocumentComponentDefinition>) || {}
    );

    // 当 frontmatter._components 从外部更新时，同步到 documentComponents
    // 这确保了当文件重新加载或粘贴新内容时，组件定义能正确同步
    const prevFrontmatterComponentsRef = useRef<Record<string, DocumentComponentDefinition> | null>(null);
    useEffect(() => {
        const newComponents = (frontmatter._components as Record<string, DocumentComponentDefinition>) || {};
        // 使用 JSON 序列化比较（简单但有效）
        const newJson = JSON.stringify(newComponents);
        const prevJson = JSON.stringify(prevFrontmatterComponentsRef.current);
        if (newJson !== prevJson) {
            prevFrontmatterComponentsRef.current = newComponents;
            setDocumentComponents(newComponents);
        }
    }, [frontmatter._components]);

    // 引用
    // const richTextEditorRef = useRef<RichTextEditorRef>(null); // 保留用于未来扩展
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

    // 内部模式切换处理（用于 hideHeader=false 的普通文档）
    const handleViewModeChange = useCallback((newMode: ViewMode) => {
        // 确保内容已同步
        if (viewMode === 'edit' && blockEditorRef.current) {
            blockEditorRef.current.flushContent?.();
        }
        setViewMode(newMode);
    }, [viewMode]);

    // 外部模式同步：当 hideHeader 为 true 时，外部控制视图模式
    const prevInitialModeRef = useRef(initialMode);

    useEffect(() => {
        if (hideHeader && initialMode !== prevInitialModeRef.current) {
            // 确保内容已同步
            if (prevInitialModeRef.current === 'edit' && blockEditorRef.current) {
                blockEditorRef.current.flushContent?.();
            }
            prevInitialModeRef.current = initialMode;
            setViewMode(initialMode);
        }
    }, [initialMode, hideHeader]);


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
        // 注意：不在 onUpdate 中设置 bodyContent，因为实际编辑使用的是 BlockEditor
        // TipTap 编辑器仅用于 PropertyView 扩展的上下文支持
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
        // 定义 frontmatter 键的顺序：系统字段优先，然后按字母排序
        const FRONTMATTER_KEY_ORDER = [
            // 基础元数据（必填）
            'title',
            'version',
            'document_type',
            'created',
            'updated',
            'author',
            // atlas 配置
            'atlas',
            // 组件定义
            '_components',
            '_status_options',
            // 系统内部字段
            '_properties',
            '_values',
            '_systemOrder',
            '_customOrder',
        ];

        // 对 frontmatter 键进行排序
        const sortFrontmatterKeys = (fm: Record<string, unknown>): Record<string, unknown> => {
            const sorted: Record<string, unknown> = {};
            const keys = Object.keys(fm);

            // 先按预定义顺序添加
            for (const key of FRONTMATTER_KEY_ORDER) {
                if (key in fm) {
                    sorted[key] = fm[key];
                }
            }

            // 再添加其他键（按字母顺序）
            const remainingKeys = keys.filter(k => !FRONTMATTER_KEY_ORDER.includes(k)).sort();
            for (const key of remainingKeys) {
                sorted[key] = fm[key];
            }

            return sorted;
        };

        // 构建排序后的 frontmatter
        const sortedFrontmatter = sortFrontmatterKeys(frontmatter);
        const frontmatterYaml = yaml.dump(sortedFrontmatter, {
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

            // 保存成功后，检查标题是否与文件名不一致，需要重命名
            const newTitle = (frontmatter.title as string)?.trim();
            const currentFileName = documentPath.split('/').pop()?.replace('.md', '') || '';

            if (newTitle && newTitle !== currentFileName) {
                try {
                    // 调用重命名 API
                    const newPath = await renameFile(documentPath, `${newTitle}.md`);
                    // 移除路径开头的 /（API 返回的路径以 / 开头）
                    const finalPath = newPath.startsWith('/') ? newPath.slice(1) : newPath;
                    // 导航到新路径
                    navigate(`/workspace/${encodeURIComponent(finalPath)}`, { replace: true });
                } catch (renameError) {
                    console.error('文件重命名失败:', renameError);
                    alert(`文档已保存，但文件重命名失败: ${renameError instanceof Error ? renameError.message : '未知错误'}`);
                }
            }

            // 刷新 slug（保存后后端会自动生成）
            try {
                const { slug } = await getDocumentSlug(documentPath);
                setDocumentSlug(slug);
            } catch {
                // 忽略 slug 获取失败
            }
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [isSaving, buildFullContent, onSave, frontmatter.title, documentPath, navigate]);

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
                    // 注意：不再同步到 TipTap 编辑器，因为实际编辑使用的是 BlockEditor
                } catch (e) {
                    console.warn('Failed to parse frontmatter:', e);
                }
            } else {
                setBodyContent(sourceContent);
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
        <div className="visual-doc-editor min-h-full h-full flex flex-col bg-white relative">
            {/* 顶部工具栏（hideHeader 为 true 时隐藏） - sticky 固定在顶部 */}
            {!hideHeader && (
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <h1 className="text-lg font-semibold text-slate-800">{docTitle}</h1>
                            {documentSlug && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        const url = `${window.location.origin}/d/${documentSlug}`;
                                        navigator.clipboard.writeText(url);
                                        // 简单的复制提示
                                        const btn = document.getElementById('slug-copy-btn');
                                        if (btn) {
                                            const original = btn.textContent;
                                            btn.textContent = '已复制!';
                                            setTimeout(() => { btn.textContent = original; }, 1500);
                                        }
                                    }}
                                    id="slug-copy-btn"
                                    className="text-xs text-slate-400 hover:text-purple-600 transition-colors text-left"
                                    title="点击复制 URL"
                                >
                                    /d/{documentSlug}
                                </button>
                            )}
                        </div>
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
                                onClick={() => handleViewModeChange('read')}
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
                                onClick={() => handleViewModeChange('edit')}
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
                                onClick={() => handleViewModeChange('source')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors
                         ${viewMode === 'source'
                                        ? 'bg-white text-slate-800 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Code size={16} />
                                源码
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
                    content={bodyContent}
                    disabled={viewMode === 'read'}
                    mode={viewMode === 'read' ? 'read' : 'edit'}
                    documentPath={documentPath}
                    displayMode={displayMode}
                    onDisplayModeChange={handleDisplayModeChange}
                />
            )}

            {/* 主内容区域 - 底部留出空间给固定状态栏 */}
            <div className="flex-1 flex overflow-hidden pb-12">
                {/* 左侧组件面板（仅编辑模式显示） */}
                {viewMode === 'edit' && (
                    <ComponentPanel
                        components={documentComponents}
                        onComponentsChange={handleComponentsChange}
                        collapsed={!showComponentPanel}
                        onToggleCollapse={() => setShowComponentPanel(prev => !prev)}
                    />
                )}

                {/* 内容区域 - 使用 CSS 隐藏实现缓存，避免重复渲染 */}
                <div id="editor-scroll-container" className="flex-1 overflow-auto">
                    {/* 阅读模式 - 使用显现模式渲染器 */}
                    <div className={cn(viewMode !== 'read' && "hidden")}>
                        <DisplayRenderer
                            displayMode={displayMode}
                            documentPath={documentPath}
                            title={docTitle}
                            bodyContent={bodyContent}
                            frontmatter={frontmatter}
                            readonly={true}
                            capabilities={(() => {
                                const atlas = (frontmatter.atlas as Record<string, unknown>) || {};
                                return Array.isArray(atlas.capabilities) ? atlas.capabilities as string[] : [];
                            })()}
                        />
                    </div>

                    {/* 编辑模式 - 块式 Markdown 编辑器（始终渲染，CSS 隐藏） */}
                    <div className={cn("h-full flex flex-col", viewMode !== 'edit' && "hidden")}>
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

                    {/* 源码模式 - CodeMirror 编辑器（始终渲染，CSS 隐藏） */}
                    <div className={cn("h-full", viewMode !== 'source' && "hidden")}>
                        <CodeMirrorEditor
                            ref={codeEditorRef}
                            value={sourceContent}
                            onChange={handleSourceChange}
                            onSave={handleSave}
                            className="h-full"
                        />
                    </div>
                </div>
            </div>

            {/* 底部状态栏 - absolute 固定在编辑器底部 */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-2 border-t border-slate-200 
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

                    {/* Commit Buffer 待提交变更显示 */}
                    {hasPendingChanges && (
                        <div className="flex items-center gap-2 ml-2 px-2 py-1 bg-amber-50 border border-amber-200 rounded">
                            <Clock size={12} className="text-amber-600" />
                            <span className="text-amber-700">
                                {pendingCount} 项待提交变更
                            </span>
                            <button
                                type="button"
                                onClick={commitAll}
                                className="text-xs text-amber-700 hover:text-amber-900 underline"
                            >
                                提交
                            </button>
                            <button
                                type="button"
                                onClick={discardAll}
                                className="text-xs text-amber-500 hover:text-amber-700 underline"
                            >
                                放弃
                            </button>
                        </div>
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
