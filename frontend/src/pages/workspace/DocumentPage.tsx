/**
 * DocumentPage - 文档详情页
 * 
 * Phase 3.8: 使用 VisualDocEditor 作为统一的文档编辑器
 * 支持属性面板、富文本编辑、源码模式三合一
 * 
 * 特殊功能文档（entity_list 等）：
 * - 阅读模式：使用特殊渲染器（如卡片视图）
 * - 编辑/源码模式：使用 VisualDocEditor
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspaceTree } from '@/components/workspace/WorkspaceTree';
// Phase 4.0.2: 移除 AnchorList，使用双栏文章模式内置目录
// import { AnchorList } from '@/components/workspace/AnchorList';
import { VisualDocEditor, type ViewMode } from '@/components/visual-editor';
import { RendererSelector } from '@/components/RendererSelector';
import { fetchDocument, type ADLDocument } from '@/api/adl';
import { fetchWorkspaceTree, type TreeNode } from '@/api/workspace';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 判断是否使用特殊渲染器（如 entity_list）
 */
function shouldUseSpecialRenderer(doc: ADLDocument): boolean {
  const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
  const atlasFunction = atlas?.function as string | undefined;
  const specialFunctions = ['entity_list', 'dashboard', 'directory_index'];
  return atlasFunction !== undefined && specialFunctions.includes(atlasFunction);
}

export function DocumentPage() {
  const params = useParams();
  const location = useLocation();
  const docPath = params['*'] || '';

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [doc, setDoc] = useState<ADLDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeAnchor, setActiveAnchor] = useState<string | undefined>();

  // 视图模式状态（用于特殊功能文档）
  const [viewMode, setViewMode] = useState<ViewMode>('read');

  // Block refs for scrolling
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadTree();
  }, []);

  useEffect(() => {
    if (docPath) {
      loadDocument();
      // 重置视图模式
      setViewMode('read');
    }
  }, [docPath]);

  // 处理 URL 中的 hash，滚动到对应的 block
  useEffect(() => {
    if (doc && location.hash) {
      const anchor = location.hash.slice(1);
      if (anchor) {
        setActiveAnchor(anchor);
        setTimeout(() => {
          const ref = blockRefs.current[anchor];
          if (ref) {
            ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    }
  }, [doc, location.hash]);

  async function loadTree() {
    try {
      const treeData = await fetchWorkspaceTree();
      setTree(treeData);
    } catch (e) {
      console.error('Failed to load tree:', e);
    }
  }

  async function loadDocument() {
    setLoading(true);
    setError(null);

    try {
      const document = await fetchDocument(docPath);
      setDoc(document);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleAnchorClick(anchor: string) {
    setActiveAnchor(anchor);
    const ref = blockRefs.current[anchor];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /**
   * 保存文档
   */
  async function handleSave(content: string) {
    const response = await fetch(`/api/adl/document?path=${encodeURIComponent(docPath)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'text/plain' },
      body: content,
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('保存失败');
    }
    await loadDocument();
    await loadTree();
  }

  const sidebar = <WorkspaceTree tree={tree} />;

  // Phase 4.0.2: 移除右侧文档结构面板，改用双栏文章模式的内置目录
  // const anchors = doc ? (
  //   <AnchorList
  //     blocks={doc.blocks}
  //     activeAnchor={activeAnchor}
  //     onAnchorClick={handleAnchorClick}
  //   />
  // ) : null;

  // 视图切换按钮组（用于特殊功能文档）
  function ViewModeToggle() {
    return (
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setViewMode('read')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === 'read'
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Eye className="w-4 h-4" />
          阅读
        </button>
        <button
          type="button"
          onClick={() => setViewMode('edit')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === 'edit'
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Pencil className="w-4 h-4" />
          编辑
        </button>
        <button
          type="button"
          onClick={() => setViewMode('source')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            viewMode === 'source'
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Code className="w-4 h-4" />
          源码
        </button>
      </div>
    );
  }

  // 渲染内容
  function renderContent() {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          加载中...
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            {error}
          </div>
          <Button onClick={loadDocument}>重试</Button>
        </div>
      );
    }

    if (!doc) {
      return null;
    }

    const rawContent = doc.raw || '';
    const frontmatterMatch = rawContent.match(/^---\n([\s\S]*?)\n---\n?/);
    const bodyContent = frontmatterMatch
      ? rawContent.slice(frontmatterMatch[0].length)
      : rawContent;

    // 特殊渲染器（entity_list 等）
    if (shouldUseSpecialRenderer(doc)) {
      // 阅读模式：使用特殊渲染器
      if (viewMode === 'read') {
        return (
          <div className="min-h-full">
            {/* 头部：标题 + 视图切换 */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold text-slate-800">
                {doc.frontmatter?.title || docPath.split('/').pop()?.replace('.md', '')}
              </h1>
              <ViewModeToggle />
            </div>
            {/* 特殊渲染器内容 */}
            <div className="p-6">
              <RendererSelector
                document={doc}
                selectedAnchor={activeAnchor}
                onBlockClick={(block) => handleAnchorClick(block.anchor)}
              />
            </div>
          </div>
        );
      }

      // 编辑/源码模式：使用 VisualDocEditor
      return (
        <div className="h-full flex flex-col">
          {/* 头部：标题 + 视图切换 */}
          <div className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-800">
              {doc.frontmatter?.title || docPath.split('/').pop()?.replace('.md', '')}
            </h1>
            <ViewModeToggle />
          </div>
          {/* VisualDocEditor 内容 */}
          <div className="flex-1 min-h-0">
            <VisualDocEditor
              documentPath={docPath}
              rawContent={rawContent}
              frontmatter={doc.frontmatter || {}}
              bodyContent={bodyContent}
              onSave={handleSave}
              initialMode={viewMode}
              hideHeader={true}
            />
          </div>
        </div>
      );
    }

    // 普通文档：使用 VisualDocEditor（包含自己的视图切换）
    return (
      <VisualDocEditor
        documentPath={docPath}
        rawContent={rawContent}
        frontmatter={doc.frontmatter || {}}
        bodyContent={bodyContent}
        onSave={handleSave}
        initialMode="read"
      />
    );
  }

  const content = (
    <div className="h-full flex flex-col">
      {renderContent()}
    </div>
  );

  return (
    <WorkspaceLayout
      sidebar={sidebar}
      content={content}
    />
  );
}
