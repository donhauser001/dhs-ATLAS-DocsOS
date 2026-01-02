/**
 * MarkdownPane - Markdown 编辑区
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 基于 TipTap 实现的 Markdown 编辑器：
 * - 支持 YAML 代码块语法高亮
 * - 实时解析和同步
 * - 快捷键支持
 */

import { useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';
import yaml from 'highlight.js/lib/languages/yaml';
import { useEditorStore } from '@/stores/editorStore';

// 创建 lowlight 实例并注册 YAML 语言
const lowlight = createLowlight(common);
lowlight.register('yaml', yaml);

interface MarkdownPaneProps {
  /** 初始内容 */
  initialContent?: string;
  /** 内容变更回调 */
  onChange?: (content: string) => void;
  /** 保存回调（Ctrl+S） */
  onSave?: () => void;
  /** 是否只读 */
  readOnly?: boolean;
  /** 占位符文本 */
  placeholder?: string;
}

export function MarkdownPane({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  placeholder = '开始编写文档...',
}: MarkdownPaneProps) {
  const { setEditorContent } = useEditorStore();
  
  // 创建编辑器实例
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // 使用 CodeBlockLowlight 替代
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'yaml',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const content = editor.getText();
      setEditorContent(content);
      onChange?.(content);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });
  
  // 处理快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    },
    [onSave]
  );
  
  // 注册快捷键
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  // 同步外部内容变化
  useEffect(() => {
    if (editor && initialContent !== editor.getText()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);
  
  // 更新只读状态
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [editor, readOnly]);
  
  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        加载编辑器...
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* 编辑器内容区 */}
      <div className="flex-1 overflow-auto bg-white">
        <EditorContent
          editor={editor}
          className="h-full"
        />
      </div>
      
      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            {editor.storage.characterCount?.words() || 0} 词
          </span>
          <span>
            {editor.storage.characterCount?.characters() || editor.getText().length} 字符
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Markdown</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 简化版 Markdown 编辑器（不使用 TipTap，用 textarea）
 * 作为备用方案
 */
export function MarkdownPaneSimple({
  initialContent = '',
  onChange,
  onSave,
  readOnly = false,
  placeholder = '开始编写文档...',
}: MarkdownPaneProps) {
  const { editorContent, setEditorContent } = useEditorStore();
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    setEditorContent(content);
    onChange?.(content);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + S 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave?.();
    }
    
    // Tab 缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      setEditorContent(newValue);
      
      // 恢复光标位置
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <textarea
        value={editorContent || initialContent}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={readOnly}
        placeholder={placeholder}
        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-white"
        spellCheck={false}
      />
      
      {/* 底部状态栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>{(editorContent || initialContent).split(/\s+/).filter(Boolean).length} 词</span>
          <span>{(editorContent || initialContent).length} 字符</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Markdown</span>
          <span>•</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
}

export default MarkdownPane;

