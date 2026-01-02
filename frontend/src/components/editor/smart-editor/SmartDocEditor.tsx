/**
 * SmartDocEditor - 固定键感知的智能文档编辑器
 */

import React, { useMemo, useCallback } from 'react';
import {
  Save, X, ChevronDown, ChevronUp,
  Lock, Loader2, Info, Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';

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

  // 保存处理
  const handleSave = useCallback(async () => {
    if (!document || isSaving) return;
    setIsSaving(true);
    try {
      const fullContent = buildFrontmatter() + '\n' + documentContent;
      await onSave(fullContent);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [document, isSaving, buildFrontmatter, documentContent, onSave, setIsSaving, setIsDirty]);

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
          <ContentEditor content={documentContent} onChange={handleContentChange} />
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

// 文档内容编辑区 - 带行号的可编辑源码
function ContentEditor({ content, onChange }: { content: string; onChange: (value: string) => void }) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = React.useRef<HTMLDivElement>(null);

  // 计算行号
  const lineCount = content.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

  // 同步滚动
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  return (
    <div className="px-6 py-4">
      <div className="mb-3 text-xs text-slate-500 flex items-center gap-2">
        <Code className="w-3.5 h-3.5" />
        文档内容（标题 + Machine Zone + Human Zone）
        <span className="text-slate-400">· {lineCount} 行</span>
      </div>
      <div className="relative flex rounded-lg overflow-hidden border border-slate-700">
        {/* 行号区 */}
        <div
          ref={lineNumbersRef}
          className="bg-slate-800 text-slate-500 text-right select-none overflow-hidden"
          style={{ width: '3rem' }}
        >
          <div className="py-4 pr-2 text-sm font-mono leading-relaxed">
            {lineNumbers.map((num) => (
              <div key={num} className="h-[1.625rem]">{num}</div>
            ))}
          </div>
        </div>
        {/* 编辑区 */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          spellCheck={false}
          className={cn(
            'flex-1 min-h-[400px] resize-y',
            'bg-slate-900 text-slate-100 p-4 pl-3',
            'text-sm font-mono leading-relaxed',
            'focus:outline-none',
            'placeholder:text-slate-600'
          )}
          placeholder="# 文档标题 {#anchor}

```yaml
type: principal
id: example
display_name: 示例
status: active
```

这是文档的人类可读内容..."
        />
      </div>
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
      </div>
    </div>
  );
}

export default SmartDocEditor;

