/**
 * SmartEditor - 智能编辑器主组件
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 功能：
 * - 三种视图模式（阅读/表单/编辑）
 * - 两栏布局（MD 编辑区 + 字段设置面板）
 * - 自动补齐提示
 * - 双向数据同步
 */

import { useEffect, useCallback, useMemo } from 'react';
import { useEditorStore, type ViewMode } from '@/stores/editorStore';
import { EditorToolbar } from './EditorToolbar';
import { MarkdownPaneSimple } from './MarkdownPane';
import { FieldSettingsPane } from './FieldSettingsPane';
import { AutoCompleteBar } from './AutoCompleteBar';
import { ZonedBlockRenderer } from '@/components/document/ZonedBlockRenderer';
import type { ADLDocument } from '@/api/adl';

interface SmartEditorProps {
  /** 文档数据 */
  document: ADLDocument | null;
  /** 原始 Markdown 内容 */
  rawContent: string;
  /** 文档路径 */
  documentPath?: string;
  /** 保存回调 */
  onSave?: (content: string) => Promise<void>;
  /** 取消回调 */
  onCancel?: () => void;
  /** 自动补齐回调 */
  onAutoComplete?: () => Promise<void>;
  /** 初始视图模式 */
  initialViewMode?: ViewMode;
}

export function SmartEditor({
  document,
  rawContent,
  documentPath,
  onSave,
  onCancel,
  onAutoComplete,
  initialViewMode = 'read',
}: SmartEditorProps) {
  const {
    viewMode,
    setViewMode,
    setDocument,
    setRawContent,
    setEditorContent,
    editorContent,
    isDirty,
    missingFields,
    startSaving,
    finishSaving,
    reset,
  } = useEditorStore();
  
  // 初始化编辑器状态
  useEffect(() => {
    setDocument(document, documentPath);
    setRawContent(rawContent);
    setEditorContent(rawContent);
    setViewMode(initialViewMode);
  }, [document, rawContent, documentPath, initialViewMode, setDocument, setRawContent, setEditorContent, setViewMode]);
  
  // 清理
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);
  
  // 获取第一个 Block（用于编辑）
  const firstBlock = useMemo(() => {
    return document?.blocks?.[0] || null;
  }, [document]);
  
  // 文档标题
  const title = useMemo(() => {
    if (!firstBlock) return documentPath?.split('/').pop() || '未命名文档';
    return (
      (firstBlock.machine?.title as string) ||
      (firstBlock.machine?.display_name as string) ||
      firstBlock.heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') ||
      '未命名文档'
    );
  }, [firstBlock, documentPath]);
  
  // 保存处理
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    startSaving();
    try {
      await onSave(editorContent);
      finishSaving();
    } catch (error) {
      finishSaving(error instanceof Error ? error.message : 'Unknown error');
    }
  }, [onSave, editorContent, startSaving, finishSaving]);
  
  // 取消处理
  const handleCancel = useCallback(() => {
    setEditorContent(rawContent);
    onCancel?.();
  }, [rawContent, setEditorContent, onCancel]);
  
  // 字段变更处理
  const handleFieldChange = useCallback((path: string, value: unknown, source: 'block' | 'frontmatter') => {
    // TODO: 实现 AST 更新和序列化
    console.log('Field change:', { path, value, source });
  }, []);
  
  return (
    <div className="h-full flex flex-col bg-slate-100">
      {/* 工具栏 */}
      <EditorToolbar
        title={title}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      
      {/* 自动补齐提示栏 */}
      <AutoCompleteBar
        missingFields={missingFields}
        onAutoComplete={onAutoComplete}
      />
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'read' ? (
          // 阅读模式：使用分区渲染器
          <div className="h-full overflow-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {document?.blocks?.map((block, index) => (
                <ZonedBlockRenderer
                  key={block.anchor || index}
                  block={block}
                  frontmatter={document.frontmatter}
                  entityType={block.machine?.type as string}
                />
              ))}
            </div>
          </div>
        ) : viewMode === 'form' ? (
          // 表单模式：只显示字段设置面板
          <div className="h-full overflow-auto p-6">
            <div className="max-w-2xl mx-auto bg-white rounded-lg border border-slate-200 overflow-hidden">
              <FieldSettingsPane
                block={firstBlock || undefined}
                frontmatter={document?.frontmatter || {}}
                onFieldChange={handleFieldChange}
                readOnly={false}
              />
            </div>
          </div>
        ) : (
          // 编辑模式：两栏布局
          <div className="h-full flex">
            {/* 左侧：MD 编辑区 */}
            <div className="flex-1 min-w-0">
              <MarkdownPaneSimple
                initialContent={rawContent}
                onChange={setEditorContent}
                onSave={handleSave}
                readOnly={false}
                placeholder="开始编写文档..."
              />
            </div>
            
            {/* 右侧：字段设置面板 */}
            <div className="w-80 flex-shrink-0">
              <FieldSettingsPane
                block={firstBlock || undefined}
                frontmatter={document?.frontmatter || {}}
                onFieldChange={handleFieldChange}
                readOnly={false}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-white text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {documentPath && (
            <span className="font-mono">{documentPath}</span>
          )}
          {isDirty && (
            <span className="text-amber-600">• 已修改</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>{document?.blocks?.length || 0} 个 Block</span>
          <span>•</span>
          <span>{missingFields.length > 0 ? `${missingFields.length} 个待补齐` : '完整'}</span>
        </div>
      </div>
    </div>
  );
}

export default SmartEditor;

