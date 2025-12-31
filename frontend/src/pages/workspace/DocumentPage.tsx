/**
 * DocumentPage - 文档详情页
 * 
 * 复用 GenesisPage 的逻辑，支持动态路径
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspaceTree } from '@/components/workspace/WorkspaceTree';
import { AnchorList } from '@/components/workspace/AnchorList';
import { BlockRenderer } from '@/pages/genesis/BlockRenderer';
import { ProposalPreview } from '@/pages/genesis/ProposalPreview';
import { fetchDocument, type ADLDocument, type UpdateYamlOp } from '@/api/adl';
import { fetchWorkspaceTree, type TreeNode } from '@/api/workspace';
import { Button } from '@/components/ui/button';

type ViewMode = 'read' | 'edit';

export function DocumentPage() {
  const params = useParams();
  const docPath = params['*'] || '';
  
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [doc, setDoc] = useState<ADLDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('read');
  const [activeAnchor, setActiveAnchor] = useState<string | undefined>();
  
  // Pending changes for proposal
  const [pendingChanges, setPendingChanges] = useState<UpdateYamlOp[]>([]);
  const [showProposalPreview, setShowProposalPreview] = useState(false);
  
  // Block refs for scrolling
  const blockRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
  useEffect(() => {
    loadTree();
  }, []);
  
  useEffect(() => {
    if (docPath) {
      loadDocument();
    }
  }, [docPath]);
  
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
    setPendingChanges([]);
    
    try {
      const document = await fetchDocument(docPath);
      setDoc(document);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  
  function handleFieldChange(anchor: string, path: string, value: unknown, oldValue: unknown) {
    const existingIndex = pendingChanges.findIndex(
      c => c.anchor === anchor && c.path === path
    );
    
    if (existingIndex >= 0) {
      const newChanges = [...pendingChanges];
      newChanges[existingIndex] = { op: 'update_yaml', anchor, path, value, old_value: oldValue };
      setPendingChanges(newChanges);
    } else {
      setPendingChanges([...pendingChanges, { op: 'update_yaml', anchor, path, value, old_value: oldValue }]);
    }
  }
  
  function handleCancelChanges() {
    setPendingChanges([]);
    setShowProposalPreview(false);
  }
  
  function handleProposalExecuted() {
    setPendingChanges([]);
    setShowProposalPreview(false);
    loadDocument();
    loadTree(); // Refresh tree to update stats
  }
  
  function handleAnchorClick(anchor: string) {
    setActiveAnchor(anchor);
    const ref = blockRefs.current[anchor];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  
  const sidebar = <WorkspaceTree tree={tree} />;
  
  const anchors = doc ? (
    <AnchorList
      blocks={doc.blocks}
      activeAnchor={activeAnchor}
      onAnchorClick={handleAnchorClick}
    />
  ) : null;
  
  const content = (
    <div className="min-h-full">
      {/* Document Header */}
      {doc && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-medium">{doc.frontmatter?.title as string || docPath}</h1>
              <p className="text-sm text-muted-foreground">{docPath}</p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setViewMode('read')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'read' 
                      ? 'bg-background shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  阅读
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'edit' 
                      ? 'bg-background shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  编辑
                </button>
              </div>
              
              {/* Pending Changes */}
              {pendingChanges.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-600">
                    {pendingChanges.length} 个变更
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowProposalPreview(true)}
                  >
                    提交变更
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelChanges}
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Loading / Error / Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          加载中...
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            {error}
          </div>
          <Button onClick={loadDocument}>重试</Button>
        </div>
      ) : doc ? (
        <div className="p-6 max-w-4xl">
          {/* Frontmatter */}
          {doc.frontmatter && Object.keys(doc.frontmatter).length > 0 && (
            <div className="mb-6 p-4 bg-muted rounded-lg text-sm">
              <div className="font-medium mb-2">文档元数据</div>
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                {Object.entries(doc.frontmatter).map(([key, value]) => (
                  <div key={key}>
                    <span className="opacity-70">{key}:</span>{' '}
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Blocks */}
          <div className="space-y-6">
            {doc.blocks.map((block) => (
              <div
                key={block.anchor}
                ref={(el) => { blockRefs.current[block.anchor] = el; }}
              >
                <BlockRenderer
                  block={block}
                  viewMode={viewMode}
                  onFieldChange={handleFieldChange}
                  pendingChanges={pendingChanges.filter(c => c.anchor === block.anchor)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      
      {/* Proposal Preview Modal */}
      {showProposalPreview && doc && (
        <ProposalPreview
          docPath={doc.path}
          changes={pendingChanges}
          onClose={() => setShowProposalPreview(false)}
          onExecuted={handleProposalExecuted}
        />
      )}
    </div>
  );
  
  return (
    <WorkspaceLayout
      sidebar={sidebar}
      content={content}
      anchors={anchors}
    />
  );
}

