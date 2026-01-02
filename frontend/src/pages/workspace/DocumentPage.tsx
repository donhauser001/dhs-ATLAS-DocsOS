/**
 * DocumentPage - 文档详情页
 * 
 * Phase 3.3: 使用 RendererSelector 根据功能声明选择渲染器
 * Phase 3.5: 添加智能 MD 编辑器模式
 * Phase 3.6: 场景化视图系统
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { WorkspaceTree } from '@/components/workspace/WorkspaceTree';
import { AnchorList } from '@/components/workspace/AnchorList';
import { BlockRenderer } from '@/pages/genesis/BlockRenderer';
import { ProposalPreview } from '@/pages/genesis/ProposalPreview';
import { RendererSelector } from '@/components/RendererSelector';
import { SmartDocEditor } from '@/components/editor/SmartDocEditor';
import { ActionBar } from '@/components/action-bar';
import { useViewModeConfig, useActionConfig, DefaultReadView } from '@/components/views';
import { FunctionViewRegistry } from '@/registry';
import { fetchDocument, type ADLDocument, type UpdateYamlOp } from '@/api/adl';
import { fetchWorkspaceTree, type TreeNode } from '@/api/workspace';
import { Button } from '@/components/ui/button';
import { useLabels } from '@/providers/LabelProvider';
import { FileText, FormInput, Code, List, Eye, Edit, Settings } from 'lucide-react';
import type { ViewMode } from '@/registry/types';

// 视图模式图标映射
const MODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  read: FileText,
  form: FormInput,
  md: Code,
  '阅读': FileText,
  '列表': List,
  '看板': Eye,
  '表单': FormInput,
  '编辑': Edit,
  '配置': Settings,
  '预览': Eye,
  'MD编辑': Code,
  'JSON': Code,
  '批量编辑': FormInput,
};

/**
 * 判断是否使用特殊渲染器
 */
function shouldUseSpecialRenderer(doc: ADLDocument): boolean {
  const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
  const atlasFunction = atlas?.function as string | undefined;
  const specialFunctions = ['entity_list', 'dashboard'];
  return atlasFunction !== undefined && specialFunctions.includes(atlasFunction);
}

/**
 * 获取功能标识
 */
function getDocumentFunction(doc: ADLDocument | null): string | undefined {
  if (!doc) return undefined;
  const atlas = doc.frontmatter?.atlas as Record<string, unknown> | undefined;
  return atlas?.function as string | undefined;
}

export function DocumentPage() {
  const params = useParams();
  const docPath = params['*'] || '';
  
  const { resolveLabel, isHidden } = useLabels();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [doc, setDoc] = useState<ADLDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('read');
  const [activeAnchor, setActiveAnchor] = useState<string | undefined>();

  // Phase 3.6: 场景化视图配置
  const viewModeConfig = useViewModeConfig(doc);
  const actions = useActionConfig(doc);

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

  // 文档加载后，设置默认视图模式
  useEffect(() => {
    if (doc && viewModeConfig.availableModes.length > 0) {
      // 如果当前模式不可用，切换到默认模式
      if (!viewModeConfig.availableModes.includes(viewMode)) {
        setViewMode(viewModeConfig.defaultMode);
      }
    }
  }, [doc, viewModeConfig.availableModes, viewModeConfig.defaultMode]);

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
    loadTree();
  }

  function handleAnchorClick(anchor: string) {
    setActiveAnchor(anchor);
    const ref = blockRefs.current[anchor];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleAction(actionId: string) {
    console.log('Action triggered:', actionId, doc);
    // TODO: 实现具体操作逻辑
  }

  const sidebar = <WorkspaceTree tree={tree} />;

  const anchors = doc ? (
    <AnchorList
      blocks={doc.blocks}
      activeAnchor={activeAnchor}
      onAnchorClick={handleAnchorClick}
    />
  ) : null;

  // 获取模式图标
  const getModeIcon = (mode: ViewMode, label: string) => {
    const Icon = MODE_ICONS[label] || MODE_ICONS[mode] || FileText;
    return <Icon className="w-4 h-4" />;
  };

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
              {/* Phase 3.6: 场景化视图模式切换 */}
              <div className="flex bg-muted rounded-lg p-1">
                {viewModeConfig.availableModes.map(mode => {
                  const label = viewModeConfig.getModeLabel(mode);
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                        viewMode === mode
                          ? 'bg-background shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {getModeIcon(mode, label)}
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Phase 3.6: 操作按钮 */}
              {actions.length > 0 && viewMode === 'read' && (
                <ActionBar
                  actions={actions}
                  document={doc}
                  onAction={handleAction}
                  onEdit={() => setViewMode('form')}
                />
              )}

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
        // Phase 3.6: 场景化视图渲染
        renderView()
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

  // 渲染视图内容
  function renderView() {
    if (!doc) return null;

    const fn = getDocumentFunction(doc);

    // MD 编辑模式 - 统一使用 SmartDocEditor
    if (viewMode === 'md') {
      return (
        <SmartDocEditor
          document={doc}
          rawContent={doc.raw || ''}
          documentPath={docPath}
          onSave={async () => {
            await loadDocument();
          }}
          onCancel={() => setViewMode('read')}
        />
      );
    }

    // 特殊渲染器（entity_list 等）
    if (shouldUseSpecialRenderer(doc)) {
      return (
        <RendererSelector
          document={doc}
          selectedAnchor={activeAnchor}
          onBlockClick={(block) => handleAnchorClick(block.anchor)}
        />
      );
    }

    // Phase 3.6: 场景化视图选择
    // 尝试从注册表获取专属视图
    const RegisteredView = fn ? FunctionViewRegistry.getViewComponent(fn, viewMode) : undefined;

    if (RegisteredView) {
      return (
        <RegisteredView
          document={doc}
          onSave={async (data) => {
            console.log('Save data:', data);
            await loadDocument();
          }}
          onCancel={() => setViewMode('read')}
          onViewModeChange={setViewMode}
        />
      );
    }

    // 表单模式 - 回退到默认 BlockRenderer
    if (viewMode === 'form') {
      return (
        <div className="p-6 max-w-4xl">
          {/* Blocks - 表单编辑模式 */}
          <div className="space-y-6">
            {doc.blocks.map((block) => (
              <div
                key={block.anchor}
                ref={(el) => { blockRefs.current[block.anchor] = el; }}
              >
                <BlockRenderer
                  block={block}
                  viewMode="edit"
                  onFieldChange={handleFieldChange}
                  pendingChanges={pendingChanges.filter(c => c.anchor === block.anchor)}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 阅读模式 - 使用默认阅读视图
    return (
      <DefaultReadView
        document={doc}
        onViewModeChange={setViewMode}
      />
    );
  }

  return (
    <WorkspaceLayout
      sidebar={sidebar}
      content={content}
      anchors={anchors}
    />
  );
}
