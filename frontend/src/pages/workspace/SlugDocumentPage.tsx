/**
 * SlugDocumentPage - 基于 slug 的文档页面
 * 
 * 使用简洁的英文 URL 访问文档：/d/:slug
 * 例如：/d/doc_abc123
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspaceTree } from '@/components/workspace/WorkspaceTree';
import { VisualDocEditor, type ViewMode } from '@/components/visual-editor';
import { RendererSelector } from '@/components/RendererSelector';
import { fetchDocumentBySlug, type ADLDocument } from '@/api/adl';
import { fetchWorkspaceTree, type TreeNode } from '@/api/workspace';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Code, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 判断是否使用特殊渲染器
 */
function shouldUseSpecialRenderer(doc: ADLDocument): boolean {
    const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
    const atlasFunction = atlas?.function as string | undefined;
    const specialFunctions = ['entity_list', 'dashboard', 'directory_index'];
    return specialFunctions.includes(atlasFunction || '');
}

export function SlugDocumentPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [tree, setTree] = useState<TreeNode[]>([]);
    const [doc, setDoc] = useState<(ADLDocument & { _path: string; _slug: string }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('read');

    // 从 raw 提取 rawContent 和 bodyContent
    const rawContent = doc?.raw || '';
    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
    const bodyContent = frontmatterMatch
        ? rawContent.slice(frontmatterMatch[0].length)
        : rawContent;

    useEffect(() => {
        loadTree();
    }, []);

    useEffect(() => {
        if (slug) {
            loadDocument();
            setViewMode('read');
        }
    }, [slug]);

    async function loadTree() {
        try {
            const treeData = await fetchWorkspaceTree();
            setTree(treeData);
        } catch (e) {
            console.error('Failed to load tree:', e);
        }
    }

    async function loadDocument() {
        if (!slug) return;

        setLoading(true);
        setError(null);

        try {
            const document = await fetchDocumentBySlug(slug);
            setDoc(document);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    /**
     * 保存文档
     */
    async function handleSave(content: string) {
        if (!doc?._path) return;

        const response = await fetch(`/api/adl/document?path=${encodeURIComponent(doc._path)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'text/plain' },
            credentials: 'include',
            body: content,
        });

        if (!response.ok) {
            throw new Error('Failed to save document');
        }

        // 重新加载文档
        await loadDocument();
    }

    const sidebar = <WorkspaceTree tree={tree} />;

    // 加载中
    if (loading) {
        return (
            <WorkspaceLayout
                sidebar={sidebar}
                content={
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </div>
                }
            />
        );
    }

    // 错误
    if (error || !doc) {
        return (
            <WorkspaceLayout
                sidebar={sidebar}
                content={
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="text-red-500 text-lg">文档未找到</div>
                        <div className="text-sm text-slate-500">{error || `Slug: ${slug}`}</div>
                        <Button variant="outline" onClick={() => navigate('/workspace')}>
                            返回工作区
                        </Button>
                    </div>
                }
            />
        );
    }

    // 特殊功能文档（如 entity_list）
    const useSpecialRenderer = shouldUseSpecialRenderer(doc);

    if (useSpecialRenderer) {
        return (
            <WorkspaceLayout
                sidebar={sidebar}
                content={
                    <div className="flex flex-col h-full">
                        {/* 顶部工具栏 */}
                        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">{doc._path}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant={viewMode === 'read' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('read')}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    阅读
                                </Button>
                                <Button
                                    variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('edit')}
                                >
                                    <Pencil className="w-4 h-4 mr-1" />
                                    编辑
                                </Button>
                                <Button
                                    variant={viewMode === 'source' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('source')}
                                >
                                    <Code className="w-4 h-4 mr-1" />
                                    源码
                                </Button>
                            </div>
                        </div>

                        {/* 内容区 */}
                        <div className="flex-1 overflow-auto">
                            {viewMode === 'read' ? (
                                <RendererSelector document={doc} documentPath={doc._path} />
                            ) : (
                                <VisualDocEditor
                                    documentPath={doc._path}
                                    rawContent={rawContent}
                                    frontmatter={doc.frontmatter}
                                    bodyContent={bodyContent}
                                    onSave={handleSave}
                                    initialMode={viewMode}
                                    hideHeader
                                />
                            )}
                        </div>
                    </div>
                }
            />
        );
    }

    // 普通文档：使用 VisualDocEditor
    return (
        <WorkspaceLayout
            sidebar={sidebar}
            content={
                <VisualDocEditor
                    documentPath={doc._path}
                    rawContent={rawContent}
                    frontmatter={doc.frontmatter}
                    bodyContent={bodyContent}
                    onSave={handleSave}
                    initialMode="read"
                />
            }
        />
    );
}

export default SlugDocumentPage;
