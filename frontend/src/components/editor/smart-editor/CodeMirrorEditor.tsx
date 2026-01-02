/**
 * CodeMirrorEditor - 带语法高亮的代码编辑器
 * 
 * 支持 Markdown 和 YAML 语法高亮
 * 支持搜索/替换 (Ctrl+F / Ctrl+H)
 * 支持行跳转 (Ctrl+G)
 */

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches, openSearchPanel, replaceAll, findNext, findPrevious } from '@codemirror/search';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { gotoLine } from '@codemirror/commands';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  className?: string;
  placeholder?: string;
}

export interface CodeMirrorEditorRef {
  openSearch: () => void;
  gotoLine: () => void;
  focus: () => void;
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorRef, CodeMirrorEditorProps>(function CodeMirrorEditor({
  value,
  onChange,
  onSave,
  className = '',
}, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartment = useRef(new Compartment());

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    openSearch: () => {
      if (viewRef.current) {
        openSearchPanel(viewRef.current);
      }
    },
    gotoLine: () => {
      if (viewRef.current) {
        gotoLine(viewRef.current);
      }
    },
    focus: () => {
      if (viewRef.current) {
        viewRef.current.focus();
      }
    },
  }));

  // 检测语言并返回对应的扩展
  const detectLanguage = useCallback((content: string) => {
    // 检测是否是纯 YAML（以 --- 开头或不包含 markdown 特征）
    if (content.startsWith('---') || /^[\w_-]+:\s/m.test(content)) {
      // 混合内容（Markdown + YAML），使用 Markdown
      return markdown();
    }
    return markdown();
  }, []);

  // 初始化编辑器
  useEffect(() => {
    if (!editorRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    // 自定义主题扩展
    const customTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-content': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        padding: '16px 0',
      },
      '.cm-line': {
        padding: '0 16px',
      },
      '.cm-gutters': {
        backgroundColor: '#1e293b',
        color: '#64748b',
        border: 'none',
        paddingRight: '8px',
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#334155',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(51, 65, 85, 0.5)',
      },
      '.cm-cursor': {
        borderLeftColor: '#f8fafc',
      },
      '.cm-selectionBackground': {
        backgroundColor: '#3b82f6 !important',
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: '#3b82f640 !important',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      // 搜索面板样式
      '.cm-panels': {
        backgroundColor: '#1e293b',
        color: '#e2e8f0',
      },
      '.cm-panels-top': {
        borderBottom: '1px solid #334155',
      },
      '.cm-searchMatch': {
        backgroundColor: '#fbbf24',
        color: '#1e293b',
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: '#f97316',
      },
      '.cm-panel.cm-search': {
        padding: '8px 16px',
      },
      '.cm-panel.cm-search input': {
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '4px',
        color: '#e2e8f0',
        padding: '4px 8px',
        marginRight: '8px',
      },
      '.cm-panel.cm-search input:focus': {
        outline: 'none',
        borderColor: '#3b82f6',
      },
      '.cm-panel.cm-search button': {
        backgroundColor: '#334155',
        border: 'none',
        borderRadius: '4px',
        color: '#e2e8f0',
        padding: '4px 12px',
        marginRight: '4px',
        cursor: 'pointer',
      },
      '.cm-panel.cm-search button:hover': {
        backgroundColor: '#475569',
      },
      '.cm-panel.cm-search label': {
        marginRight: '12px',
      },
      // 行跳转面板
      '.cm-panel.cm-gotoLine': {
        padding: '8px 16px',
      },
      '.cm-panel.cm-gotoLine input': {
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '4px',
        color: '#e2e8f0',
        padding: '4px 8px',
        marginRight: '8px',
      },
    });

    // 自定义快捷键
    const customKeymap = keymap.of([
      // 保存
      {
        key: 'Mod-s',
        run: () => {
          onSave?.();
          return true;
        },
      },
      // 行跳转
      {
        key: 'Mod-g',
        run: (view) => {
          gotoLine(view);
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        highlightSelectionMatches(),
        search({ top: true }), // 搜索面板在顶部
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        languageCompartment.current.of(detectLanguage(value)),
        oneDark,
        customTheme,
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...searchKeymap,
        ]),
        customKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // 只在挂载时初始化一次

  // 同步外部值变化
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className={`codemirror-editor bg-slate-900 rounded-lg overflow-hidden ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
});

export default CodeMirrorEditor;

