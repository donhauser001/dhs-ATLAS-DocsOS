/**
 * SmartDocEditor - 简洁的 Markdown 文档编辑器
 * 
 * 这是一个纯粹的文档编辑器，不是表单视图。
 * 用户直接编辑 Markdown 源码，带语法高亮。
 */

import { useState, useCallback, useEffect } from 'react';
import { Save, X, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SmartDocEditorProps {
  document: { raw?: string } | null;
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
  const [content, setContent] = useState(rawContent);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // 同步外部内容变化
  useEffect(() => {
    setContent(rawContent);
    setIsDirty(false);
  }, [rawContent]);

  // 内容变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsDirty(true);
  }, []);

  // 保存
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(content);
      setIsDirty(false);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, isSaving, onSave]);

  // 键盘快捷键
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      if (isDirty) handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [isDirty, handleSave, onCancel]);

  // 文件名
  const fileName = documentPath.split('/').pop() || '未命名文档';

  if (!document) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-slate-900" onKeyDown={handleKeyDown}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-slate-800">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-200">{fileName}</span>
          {isDirty && (
            <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">
              未保存
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 inline mr-1" />取消
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded transition-colors flex items-center gap-1.5',
              isDirty
                ? 'bg-blue-600 text-white hover:bg-blue-500'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            )}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="flex-1 min-h-0">
        <textarea
          value={content}
          onChange={handleChange}
          spellCheck={false}
          style={{ height: '100%' }}
          className={cn(
            'w-full resize-none p-6',
            'bg-slate-900 text-slate-100',
            'font-mono text-sm leading-relaxed',
            'focus:outline-none',
            'placeholder:text-slate-600'
          )}
          placeholder="开始编写 Markdown 文档..."
        />
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-700 bg-slate-800 text-xs text-slate-500">
        <span className="font-mono">{documentPath}</span>
        <div className="flex items-center gap-4">
          <span>{content.split('\n').length} 行</span>
          <span>{content.length} 字符</span>
          <span className="text-slate-600">⌘S 保存 · Esc 取消</span>
        </div>
      </div>
    </div>
  );
}

export default SmartDocEditor;
