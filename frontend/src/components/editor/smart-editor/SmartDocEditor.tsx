/**
 * SmartDocEditor - 固定键感知的智能文档编辑器
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Save, X, ChevronDown, ChevronUp,
  Lock, Loader2, Info, Code, AlertCircle, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { applyAutoComplete, getMissingFields, type MissingField } from '@/api/auto-complete';
import { CodeMirrorEditor } from './CodeMirrorEditor';

import type { ADLDocument } from './types';
import { FixedKeyField } from './FixedKeyField';
import { useEditorState } from './useEditorState';
import { createFixedKeyConfig } from './fixedKeyConfig';

export interface SmartDocEditorProps {
  document: ADLDocument | null;
  rawContent: string;
  documentPath: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function SmartDocEditor({
  document,
  rawContent,
  documentPath,
  onSave,
  onCancel,
}: SmartDocEditorProps) {
  const { getLabel } = useLabels();
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [autoCompleteMessage, setAutoCompleteMessage] = useState<string | null>(null);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState<number | null>(null);

  const {
    isSaving, setIsSaving,
    isDirty, setIsDirty,
    showFixedKeys, setShowFixedKeys,
    fixedKeyValues, originalFixedKeyValues,
    documentContent,
    handleFixedKeyChange, handleContentChange, buildFrontmatter,
  } = useEditorState({ document, rawContent });

  // 固定键配置
  const fixedKeys = useMemo(
    () => createFixedKeyConfig({ fixedKeyValues, originalFixedKeyValues }),
    [fixedKeyValues, originalFixedKeyValues]
  );

  // 检测缺失字段
  useEffect(() => {
    if (!documentPath) return;
    
    getMissingFields(documentPath)
      .then(result => {
        setMissingFields(result.missingFields || []);
      })
      .catch(err => {
        console.warn('Failed to get missing fields:', err);
        setMissingFields([]);
      });
  }, [documentPath]);

  // 清除草稿（保存成功后）- 必须在 handleSave 之前定义
  const clearDraft = useCallback(() => {
    if (!documentPath) return;
    const draftKey = `atlas-draft-${documentPath}`;
    try {
      localStorage.removeItem(draftKey);
      setShowDraftRecovery(false);
    } catch (e) {
      console.warn('Failed to clear draft:', e);
    }
  }, [documentPath]);

  // 保存处理 - 集成自动补齐
  const handleSave = useCallback(async () => {
    if (!document || isSaving) return;
    setIsSaving(true);
    setAutoCompleteMessage(null);
    
    try {
      // 1. 保存文档内容
      const fullContent = buildFrontmatter() + '\n' + documentContent;
      await onSave(fullContent);
      
      // 2. 调用自动补齐（更新 updated 时间戳等）
      try {
        const result = await applyAutoComplete(documentPath);
        if (result.changes && result.changes.length > 0) {
          setAutoCompleteMessage(`已自动补齐 ${result.changes.length} 个字段`);
          // 3秒后隐藏消息
          setTimeout(() => setAutoCompleteMessage(null), 3000);
        }
      } catch (autoCompleteError) {
        console.warn('Auto-complete failed:', autoCompleteError);
        // 自动补齐失败不影响保存成功
      }
      
      setIsDirty(false);
      setMissingFields([]); // 清空缺失字段提示
      clearDraft(); // 清除草稿
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, buildFrontmatter, documentContent, documentPath, onSave, setIsSaving, setIsDirty, clearDraft]);

  // 一键补齐处理
  const handleAutoComplete = useCallback(async () => {
    if (!documentPath) return;
    
    try {
      const result = await applyAutoComplete(documentPath);
      if (result.changes && result.changes.length > 0) {
        setAutoCompleteMessage(`已自动补齐 ${result.changes.length} 个字段`);
        setMissingFields([]);
        setTimeout(() => setAutoCompleteMessage(null), 3000);
        // 重新加载页面以显示补齐后的内容
        window.location.reload();
      }
    } catch (error) {
      console.error('Auto-complete failed:', error);
    }
  }, [documentPath]);

  // 文档标题
  const docTitle = useMemo(() => {
    const block = document?.blocks?.[0];
    return (
      block?.machine?.title as string ||
      block?.machine?.display_name as string ||
      block?.heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') ||
      documentPath.split('/').pop()?.replace('.md', '') ||
      '未命名文档'
    );
  }, [document, documentPath]);

  // 更新页面标题（添加未保存标记）
  useEffect(() => {
    const originalTitle = document.title;
    if (isDirty) {
      document.title = `* ${docTitle} - ATLAS DocsOS`;
    } else {
      document.title = `${docTitle} - ATLAS DocsOS`;
    }
    return () => {
      document.title = originalTitle;
    };
  }, [isDirty, docTitle]);

  // 离开页面确认（未保存提醒）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '您有未保存的修改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // 自动保存草稿到 localStorage
  useEffect(() => {
    if (!documentPath || !isDirty) return;

    const draftKey = `atlas-draft-${documentPath}`;
    const draftContent = buildFrontmatter() + '\n' + documentContent;
    
    // 防抖保存，每 2 秒保存一次
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({
          content: draftContent,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('Failed to save draft:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [documentPath, isDirty, buildFrontmatter, documentContent]);

  // 检测是否有未保存的草稿
  useEffect(() => {
    if (!documentPath) return;
    const draftKey = `atlas-draft-${documentPath}`;
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const { timestamp } = JSON.parse(draftData);
        // 只显示 24 小时内的草稿
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setShowDraftRecovery(true);
          setDraftTimestamp(timestamp);
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    } catch (e) {
      console.warn('Failed to check draft:', e);
    }
  }, [documentPath]);

  // 恢复草稿
  const handleRecoverDraft = useCallback(() => {
    if (!documentPath) return;
    const draftKey = `atlas-draft-${documentPath}`;
    try {
      const draftData = localStorage.getItem(draftKey);
      if (draftData) {
        const { content } = JSON.parse(draftData);
        // 触发页面刷新以加载草稿内容
        // 这里简化处理，直接重新加载页面
        window.location.reload();
      }
    } catch (e) {
      console.warn('Failed to recover draft:', e);
    }
    setShowDraftRecovery(false);
  }, [documentPath]);

  // 忽略草稿
  const handleIgnoreDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* 顶部工具栏 */}
      <EditorToolbar
        title={docTitle}
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={onCancel}
      />

      {/* 草稿恢复提示 */}
      {showDraftRecovery && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700 text-sm">
            <Info className="w-4 h-4" />
            <span>
              检测到未保存的草稿
              {draftTimestamp && ` (${new Date(draftTimestamp).toLocaleString()})`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleIgnoreDraft}
              className="px-3 py-1 text-blue-600 text-sm hover:bg-blue-100 rounded-md transition-colors"
            >
              忽略
            </button>
            <button
              onClick={handleRecoverDraft}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              恢复草稿
            </button>
          </div>
        </div>
      )}

      {/* 自动补齐成功消息 */}
      {autoCompleteMessage && (
        <div className="px-6 py-2 bg-green-50 border-b border-green-200 text-green-700 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          {autoCompleteMessage}
        </div>
      )}

      {/* 缺失字段提示栏 */}
      {missingFields.length > 0 && (
        <AutoCompleteBar
          missingFields={missingFields}
          onAutoComplete={handleAutoComplete}
          getLabel={getLabel}
        />
      )}

      {/* 固定键区 */}
      <FixedKeysSection
        fixedKeys={fixedKeys}
        showFixedKeys={showFixedKeys}
        onToggle={() => setShowFixedKeys(!showFixedKeys)}
        onChange={handleFixedKeyChange}
        getLabel={getLabel}
        documentType={String(fixedKeyValues.document_type || 'facts')}
        functionKey={String(fixedKeyValues['atlas.function'] || '')}
      />

      {/* 文档内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <ContentEditor content={documentContent} onChange={handleContentChange} onSave={handleSave} />
        </div>
      </div>

      {/* 底部状态栏 */}
      <StatusBar
        path={documentPath}
        blockCount={document.blocks?.length || 0}
        editableKeyCount={fixedKeys.filter(k => k.editable).length}
      />
    </div>
  );
}

// 工具栏子组件
interface EditorToolbarProps {
  title: string;
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function EditorToolbar({ title, isDirty, isSaving, onSave, onCancel }: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
        {isDirty && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            未保存
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
        >
          <X className="w-4 h-4 inline mr-1" />取消
        </button>
        <button
          onClick={onSave}
          disabled={!isDirty || isSaving}
          className={cn(
            'px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
            isDirty ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          )}
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// 固定键区子组件
interface FixedKeysSectionProps {
  fixedKeys: ReturnType<typeof createFixedKeyConfig>;
  showFixedKeys: boolean;
  onToggle: () => void;
  onChange: (key: string, value: unknown) => void;
  getLabel: (key: string) => string;
  documentType: string;
  functionKey: string;
}

function FixedKeysSection({ fixedKeys, showFixedKeys, onToggle, onChange, getLabel, documentType, functionKey }: FixedKeysSectionProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/50">
      <button
        onClick={onToggle}
        className="w-full px-6 py-2 flex items-center justify-between text-xs text-slate-500 hover:text-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5" />
          <span>系统元数据（固定键）</span>
          <span className="text-slate-400">· {fixedKeys.length} 项</span>
        </div>
        {showFixedKeys ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showFixedKeys && (
        <div className="px-6 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {fixedKeys.map((item) => (
              <FixedKeyField
                key={item.key}
                item={item}
                onChange={onChange}
                getLabel={getLabel}
                documentType={documentType}
                functionKey={functionKey}
              />
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-400 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            标有锁图标的字段由系统自动管理
          </p>
        </div>
      )}
    </div>
  );
}

// 文档内容编辑区 - 带语法高亮的代码编辑器
interface ContentEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

function ContentEditor({ content, onChange, onSave }: ContentEditorProps) {
  const lineCount = content.split('\n').length;

  return (
    <div className="px-6 py-4">
      <div className="mb-3 text-xs text-slate-500 flex items-center gap-2">
        <Code className="w-3.5 h-3.5" />
        文档内容（标题 + Machine Zone + Human Zone）
        <span className="text-slate-400">· {lineCount} 行</span>
        <span className="text-slate-400">· 支持语法高亮</span>
      </div>
      <div className="rounded-lg overflow-hidden border border-slate-700">
        <CodeMirrorEditor
          value={content}
          onChange={onChange}
          onSave={onSave}
          className="min-h-[400px]"
        />
      </div>
    </div>
  );
}

// 自动补齐提示栏
interface AutoCompleteBarProps {
  missingFields: MissingField[];
  onAutoComplete: () => void;
  getLabel: (key: string) => string;
}

function AutoCompleteBar({ missingFields, onAutoComplete, getLabel }: AutoCompleteBarProps) {
  const fieldNames = missingFields
    .slice(0, 3)
    .map(f => getLabel(f.key))
    .join('、');
  const remaining = missingFields.length - 3;

  return (
    <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
      <div className="flex items-center gap-2 text-amber-700 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>
          检测到缺少字段: {fieldNames}
          {remaining > 0 && ` 等 ${missingFields.length} 项`}
        </span>
      </div>
      <button
        onClick={onAutoComplete}
        className="px-3 py-1 bg-amber-600 text-white text-sm rounded-md hover:bg-amber-700 transition-colors flex items-center gap-1.5"
      >
        <Sparkles className="w-3.5 h-3.5" />
        一键补齐
      </button>
    </div>
  );
}

// 状态栏子组件
interface StatusBarProps {
  path: string;
  blockCount: number;
  editableKeyCount: number;
}

function StatusBar({ path, blockCount, editableKeyCount }: StatusBarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
      <span className="font-mono">{path}</span>
      <div className="flex items-center gap-3">
        <span>{blockCount} 个 Block</span>
        <span>·</span>
        <span>{editableKeyCount} 个可编辑固定键</span>
        <span>·</span>
        <span className="text-slate-400">⌘S 保存 · ⌘F 搜索 · ⌘G 跳转行</span>
      </div>
    </div>
  );
}

export default SmartDocEditor;

