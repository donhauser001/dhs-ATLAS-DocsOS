/**
 * Genesis Page - Phase 0 ADL 文档闭环验证页面
 */

import { useState, useEffect } from 'react';
import { fetchDocument, type ADLDocument, type Block } from '@/api/adl';
import { BlockRenderer } from './BlockRenderer';
import { ProposalPreview } from './ProposalPreview';
import type { UpdateYamlOp } from '@/api/adl';

// 默认文档路径
const DEFAULT_DOC_PATH = 'genesis/服务示例.md';

type ViewMode = 'read' | 'edit';

export function GenesisPage() {
  const [doc, setDoc] = useState<ADLDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('read');
  
  // Pending changes for proposal
  const [pendingChanges, setPendingChanges] = useState<UpdateYamlOp[]>([]);
  const [showProposalPreview, setShowProposalPreview] = useState(false);
  
  // 加载文档
  useEffect(() => {
    loadDocument();
  }, []);
  
  async function loadDocument() {
    setLoading(true);
    setError(null);
    
    try {
      const document = await fetchDocument(DEFAULT_DOC_PATH);
      setDoc(document);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  
  // 处理字段变更
  function handleFieldChange(anchor: string, path: string, value: unknown, oldValue: unknown) {
    // 检查是否已有相同的变更
    const existingIndex = pendingChanges.findIndex(
      c => c.anchor === anchor && c.path === path
    );
    
    if (existingIndex >= 0) {
      // 更新现有变更
      const newChanges = [...pendingChanges];
      newChanges[existingIndex] = { op: 'update_yaml', anchor, path, value, old_value: oldValue };
      setPendingChanges(newChanges);
    } else {
      // 添加新变更
      setPendingChanges([...pendingChanges, { op: 'update_yaml', anchor, path, value, old_value: oldValue }]);
    }
  }
  
  // 取消所有变更
  function handleCancelChanges() {
    setPendingChanges([]);
    setShowProposalPreview(false);
  }
  
  // Proposal 执行成功后刷新
  function handleProposalExecuted() {
    setPendingChanges([]);
    setShowProposalPreview(false);
    loadDocument();
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">加载中...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={loadDocument}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg"
          >
            重试
          </button>
        </div>
      </div>
    );
  }
  
  if (!doc) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Genesis</h1>
            <p className="text-sm text-slate-500">{doc.path}</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('read')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'read' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                阅读
              </button>
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'edit' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
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
                <button
                  onClick={() => setShowProposalPreview(true)}
                  className="px-3 py-1.5 text-sm bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  提交变更
                </button>
                <button
                  onClick={handleCancelChanges}
                  className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Frontmatter */}
        {doc.frontmatter && Object.keys(doc.frontmatter).length > 0 && (
          <div className="mb-8 p-4 bg-slate-100 rounded-lg text-sm text-slate-600">
            <div className="font-medium mb-2">文档元数据</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(doc.frontmatter).map(([key, value]) => (
                <div key={key}>
                  <span className="text-slate-500">{key}:</span>{' '}
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Blocks */}
        <div className="space-y-6">
          {doc.blocks.map((block) => (
            <BlockRenderer
              key={block.anchor}
              block={block}
              viewMode={viewMode}
              onFieldChange={handleFieldChange}
              pendingChanges={pendingChanges.filter(c => c.anchor === block.anchor)}
            />
          ))}
        </div>
      </main>
      
      {/* Proposal Preview Modal */}
      {showProposalPreview && (
        <ProposalPreview
          docPath={doc.path}
          changes={pendingChanges}
          onClose={() => setShowProposalPreview(false)}
          onExecuted={handleProposalExecuted}
        />
      )}
    </div>
  );
}

export default GenesisPage;

