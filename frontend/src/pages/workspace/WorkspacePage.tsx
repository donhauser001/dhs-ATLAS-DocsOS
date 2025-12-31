/**
 * WorkspacePage - Workspace 首页
 * 
 * 显示 Workspace 概览和快速导航
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspaceTree } from '@/components/workspace/WorkspaceTree';
import { fetchWorkspaceIndex, fetchWorkspaceTree, rebuildWorkspaceIndex } from '@/api/workspace';
import type { WorkspaceIndex, TreeNode } from '@/api/workspace';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Hash, RefreshCw } from 'lucide-react';

export function WorkspacePage() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [index, setIndex] = useState<WorkspaceIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);
  
  async function loadData() {
    setLoading(true);
    setError(null);
    
    try {
      const [treeData, indexData] = await Promise.all([
        fetchWorkspaceTree(),
        fetchWorkspaceIndex(),
      ]);
      setTree(treeData);
      setIndex(indexData);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  
  async function handleRebuild() {
    setRebuilding(true);
    try {
      await rebuildWorkspaceIndex();
      await loadData();
    } catch (e) {
      setError(String(e));
    } finally {
      setRebuilding(false);
    }
  }
  
  const sidebar = loading ? (
    <div className="p-4 text-sm text-muted-foreground">加载中...</div>
  ) : (
    <WorkspaceTree tree={tree} />
  );
  
  const content = (
    <div className="p-6 max-w-4xl mx-auto">
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">工作空间</h1>
          <p className="text-muted-foreground mt-1">
            管理和浏览所有 ADL 文档
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRebuild}
          disabled={rebuilding}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${rebuilding ? 'animate-spin' : ''}`} />
          重建索引
        </Button>
      </div>
      
      {/* Stats */}
      {index && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <FileText className="h-4 w-4" />
              <span className="text-sm">文档总数</span>
            </div>
            <div className="text-2xl font-semibold">{index.stats.total_documents}</div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Folder className="h-4 w-4" />
              <span className="text-sm">Block 总数</span>
            </div>
            <div className="text-2xl font-semibold">{index.stats.total_blocks}</div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Hash className="h-4 w-4" />
              <span className="text-sm">Anchor 总数</span>
            </div>
            <div className="text-2xl font-semibold">{index.stats.total_anchors}</div>
          </div>
        </div>
      )}
      
      {/* Recent Documents */}
      {index && (
        <div>
          <h2 className="text-lg font-medium mb-4">所有文档</h2>
          <div className="border rounded-lg divide-y">
            {index.documents.map((doc) => (
              <Link
                key={doc.path}
                to={`/workspace/${doc.path}`}
                className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-sm text-muted-foreground">{doc.path}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{doc.block_count} blocks</span>
                  <span className="px-2 py-0.5 bg-muted rounded">
                    {doc.document_type}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <WorkspaceLayout
      sidebar={sidebar}
      content={content}
    />
  );
}

