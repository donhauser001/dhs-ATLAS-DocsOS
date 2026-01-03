/**
 * MarkdownEditor - 即时渲染的 Markdown 编辑器
 * 
 * 特点：
 * - 直接编辑 Markdown 源码（不转换成 HTML）
 * - 实时渲染成可视化样式
 * - 光标所在行显示原始 Markdown，其他行渲染成样式
 */

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorView, keymap, lineNumbers, highlightActiveLine, Decoration, DecorationSet, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    onSave?: () => void;
    className?: string;
    disabled?: boolean;
}

export interface MarkdownEditorRef {
    focus: () => void;
    getValue: () => string;
}

// ============================================================
// 装饰器定义
// ============================================================

// 分隔线 Widget
class HRWidget extends WidgetType {
    toDOM() {
        const hr = document.createElement('div');
        hr.className = 'h-px bg-slate-300 my-4';
        return hr;
    }
}

// 装饰器类型
interface DecorationItem {
    from: number;
    to: number;
    decoration: Decoration;
}

// 创建即时渲染装饰器
function createLivePreviewDecorations(view: EditorView): DecorationSet {
    const doc = view.state.doc;
    const cursorLine = doc.lineAt(view.state.selection.main.head).number;

    // 收集所有装饰，最后排序
    const decorations: DecorationItem[] = [];

    // 是否在代码块内
    let inCodeBlock = false;

    for (let i = 1; i <= doc.lines; i++) {
        const line = doc.line(i);
        const text = line.text;
        const isCurrentLine = i === cursorLine;

        // 代码块开始/结束检测
        if (text.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            // 代码块标记行样式
            decorations.push({
                from: line.from,
                to: line.to,
                decoration: Decoration.mark({ class: 'bg-slate-800 text-green-400 font-mono text-sm rounded px-2' }),
            });
            continue;
        }

        // 代码块内容
        if (inCodeBlock) {
            decorations.push({
                from: line.from,
                to: line.to,
                decoration: Decoration.mark({ class: 'bg-slate-100 font-mono text-sm' }),
            });
            continue;
        }

        // 跳过当前行（显示原始 Markdown 方便编辑）
        if (isCurrentLine) continue;

        // 空行跳过
        if (!text.trim()) continue;

        // 标题渲染 # ## ### 等
        const headingMatch = text.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const styles: Record<number, string> = {
                1: 'text-2xl font-bold text-purple-700',
                2: 'text-xl font-bold text-purple-600',
                3: 'text-lg font-semibold text-purple-600',
                4: 'text-base font-semibold text-purple-500',
                5: 'text-sm font-semibold text-purple-500',
                6: 'text-sm font-medium text-purple-400',
            };

            // 隐藏 # 标记
            const markEnd = line.from + headingMatch[1].length;
            decorations.push({
                from: line.from,
                to: markEnd,
                decoration: Decoration.mark({ class: 'text-slate-300 text-xs' }),
            });

            // 标题内容样式
            decorations.push({
                from: markEnd,
                to: line.to,
                decoration: Decoration.mark({ class: styles[level] || '' }),
            });
            continue;
        }

        // 分隔线 --- 或 ***
        if (/^[-*]{3,}\s*$/.test(text)) {
            decorations.push({
                from: line.from,
                to: line.to,
                decoration: Decoration.replace({ widget: new HRWidget() }),
            });
            continue;
        }

        // 引用 > text
        if (text.startsWith('>')) {
            decorations.push({
                from: line.from,
                to: line.to,
                decoration: Decoration.mark({ class: 'text-slate-600 italic pl-4 border-l-4 border-purple-300' }),
            });
            continue;
        }

        // 无序列表 - 或 *
        const ulMatch = text.match(/^(\s*)([-*])\s+/);
        if (ulMatch) {
            const bulletStart = line.from + ulMatch[1].length;
            const bulletEnd = bulletStart + 1;
            decorations.push({
                from: bulletStart,
                to: bulletEnd,
                decoration: Decoration.mark({ class: 'text-purple-500 font-bold' }),
            });
            continue;
        }

        // 有序列表 1. 2. 等
        const olMatch = text.match(/^(\s*)(\d+\.)\s+/);
        if (olMatch) {
            const numStart = line.from + olMatch[1].length;
            const numEnd = numStart + olMatch[2].length;
            decorations.push({
                from: numStart,
                to: numEnd,
                decoration: Decoration.mark({ class: 'text-purple-500 font-semibold' }),
            });
            continue;
        }

        // 行内样式处理（收集后统一处理避免顺序问题）
        const inlineDecorations: DecorationItem[] = [];

        // 粗体 **text**
        const boldRegex = /\*\*([^*]+)\*\*/g;
        let boldMatch;
        while ((boldMatch = boldRegex.exec(text)) !== null) {
            const start = line.from + boldMatch.index;
            inlineDecorations.push({
                from: start,
                to: start + 2,
                decoration: Decoration.mark({ class: 'text-slate-300 text-xs' }),
            });
            inlineDecorations.push({
                from: start + 2,
                to: start + boldMatch[0].length - 2,
                decoration: Decoration.mark({ class: 'font-bold' }),
            });
            inlineDecorations.push({
                from: start + boldMatch[0].length - 2,
                to: start + boldMatch[0].length,
                decoration: Decoration.mark({ class: 'text-slate-300 text-xs' }),
            });
        }

        // 行内代码 `code`
        const codeRegex = /`([^`]+)`/g;
        let codeMatch;
        while ((codeMatch = codeRegex.exec(text)) !== null) {
            const start = line.from + codeMatch.index;
            inlineDecorations.push({
                from: start,
                to: start + 1,
                decoration: Decoration.mark({ class: 'text-slate-400' }),
            });
            inlineDecorations.push({
                from: start + 1,
                to: start + codeMatch[0].length - 1,
                decoration: Decoration.mark({ class: 'bg-slate-100 text-red-600 px-1 rounded font-mono text-sm' }),
            });
            inlineDecorations.push({
                from: start + codeMatch[0].length - 1,
                to: start + codeMatch[0].length,
                decoration: Decoration.mark({ class: 'text-slate-400' }),
            });
        }

        // 链接 [text](url)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(text)) !== null) {
            const start = line.from + linkMatch.index;
            const textEnd = start + 1 + linkMatch[1].length;

            // [ 
            inlineDecorations.push({
                from: start,
                to: start + 1,
                decoration: Decoration.mark({ class: 'text-slate-300' }),
            });
            // 链接文字
            inlineDecorations.push({
                from: start + 1,
                to: textEnd,
                decoration: Decoration.mark({ class: 'text-blue-600 underline' }),
            });
            // ](url)
            inlineDecorations.push({
                from: textEnd,
                to: start + linkMatch[0].length,
                decoration: Decoration.mark({ class: 'text-slate-300 text-xs' }),
            });
        }

        // 按位置排序并添加
        inlineDecorations.sort((a, b) => a.from - b.from || a.to - b.to);
        decorations.push(...inlineDecorations);
    }

    // 按位置排序所有装饰
    decorations.sort((a, b) => a.from - b.from || a.to - b.to);

    // 构建 DecorationSet
    const builder = new RangeSetBuilder<Decoration>();
    for (const d of decorations) {
        if (d.from < d.to) {  // 确保范围有效
            builder.add(d.from, d.to, d.decoration);
        }
    }

    return builder.finish();
}

// 即时渲染插件
const livePreviewPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = createLivePreviewDecorations(view);
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.selectionSet) {
                this.decorations = createLivePreviewDecorations(update.view);
            }
        }
    },
    {
        decorations: (v) => v.decorations,
    }
);

// ============================================================
// 主组件
// ============================================================

export const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(function MarkdownEditor({
    value,
    onChange,
    onSave,
    className = '',
    disabled = false,
}, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    useImperativeHandle(ref, () => ({
        focus: () => viewRef.current?.focus(),
        getValue: () => viewRef.current?.state.doc.toString() || '',
    }));

    useEffect(() => {
        if (!editorRef.current) return;

        const updateListener = EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                onChange(update.state.doc.toString());
            }
        });

        // 编辑器主题
        const theme = EditorView.theme({
            '&': {
                height: '100%',
                fontSize: '15px',
                backgroundColor: '#ffffff',
            },
            '.cm-content': {
                fontFamily: '"Source Han Sans SC", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif',
                padding: '20px 0',
                caretColor: '#7c3aed',
                lineHeight: '1.8',
            },
            '.cm-line': {
                padding: '2px 24px',
            },
            '.cm-gutters': {
                backgroundColor: '#fafafa',
                color: '#c0c0c0',
                border: 'none',
                borderRight: '1px solid #f0f0f0',
            },
            '.cm-activeLineGutter': {
                backgroundColor: '#f5f5f5',
                color: '#888',
            },
            '.cm-activeLine': {
                backgroundColor: '#fafaff',
            },
            '.cm-cursor': {
                borderLeftColor: '#7c3aed',
                borderLeftWidth: '2px',
            },
            '.cm-selectionBackground': {
                backgroundColor: '#e9d5ff !important',
            },
            '&.cm-focused .cm-selectionBackground': {
                backgroundColor: '#ddd6fe !important',
            },
        });

        // 快捷键
        const customKeymap = keymap.of([
            {
                key: 'Mod-s',
                run: () => {
                    onSave?.();
                    return true;
                },
            },
            {
                key: 'Mod-b',
                run: (view) => {
                    const { from, to } = view.state.selection.main;
                    const selectedText = view.state.sliceDoc(from, to);
                    view.dispatch({
                        changes: { from, to, insert: `**${selectedText}**` },
                        selection: { anchor: from + 2, head: to + 2 },
                    });
                    return true;
                },
            },
            {
                key: 'Mod-i',
                run: (view) => {
                    const { from, to } = view.state.selection.main;
                    const selectedText = view.state.sliceDoc(from, to);
                    view.dispatch({
                        changes: { from, to, insert: `*${selectedText}*` },
                        selection: { anchor: from + 1, head: to + 1 },
                    });
                    return true;
                },
            },
        ]);

        const state = EditorState.create({
            doc: value,
            extensions: [
                // lineNumbers(), // 不显示行号
                highlightActiveLine(),
                history(),
                highlightSelectionMatches(),
                search({ top: true }),
                markdown({ base: markdownLanguage }),
                livePreviewPlugin,
                theme,
                keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
                customKeymap,
                updateListener,
                EditorView.lineWrapping,
                EditorView.editable.of(!disabled),
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
    }, []);

    // 同步外部值
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;

        const currentValue = view.state.doc.toString();
        if (value !== currentValue) {
            view.dispatch({
                changes: { from: 0, to: currentValue.length, insert: value },
            });
        }
    }, [value]);

    return (
        <div
            ref={editorRef}
            className={`markdown-editor bg-white rounded-lg border border-slate-200 overflow-hidden ${className}`}
            style={{ minHeight: '400px' }}
        />
    );
});

export default MarkdownEditor;
