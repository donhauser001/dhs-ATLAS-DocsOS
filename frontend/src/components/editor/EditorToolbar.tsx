/**
 * EditorToolbar - 编辑器工具栏
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 功能：
 * - 视图模式切换（阅读/表单/编辑）
 * - 保存/取消按钮
 * - 状态显示
 */

import { BookOpen, FileEdit, Code2, Save, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore, type ViewMode } from '@/stores/editorStore';

interface EditorToolbarProps {
  /** 文档标题 */
  title?: string;
  /** 保存回调 */
  onSave?: () => void;
  /** 取消回调 */
  onCancel?: () => void;
}

const VIEW_MODES: { mode: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: 'read', label: '阅读', icon: BookOpen },
  { mode: 'form', label: '表单', icon: FileEdit },
  { mode: 'editor', label: '编辑', icon: Code2 },
];

export function EditorToolbar({ title, onSave, onCancel }: EditorToolbarProps) {
  const { viewMode, setViewMode, isDirty, isSaving } = useEditorStore();
  
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-white">
      {/* 左侧：文档标题 */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700">
          📄 {title || '未命名文档'}
        </span>
        {isDirty && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
            未保存
          </span>
        )}
      </div>
      
      {/* 中间：视图模式切换 */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
        {VIEW_MODES.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              viewMode === mode
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        {isDirty && (
          <>
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? '保存中...' : '保存'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EditorToolbar;

