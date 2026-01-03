/**
 * RichTextEditor - 富文本编辑器主组件
 * 
 * 基于 Tiptap 实现所见即所得编辑
 */

import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { Toolbar } from './Toolbar';

// 创建 lowlight 实例
const lowlight = createLowlight(common);

export interface RichTextEditorRef {
    /** 获取编辑器实例 */
    getEditor: () => Editor | null;
    /** 获取 HTML 内容 */
    getHTML: () => string;
    /** 获取纯文本内容 */
    getText: () => string;
    /** 设置内容 */
    setContent: (content: string) => void;
    /** 聚焦编辑器 */
    focus: () => void;
    /** 插入文本 */
    insertText: (text: string) => void;
}

export interface RichTextEditorProps {
    /** 初始内容（HTML 或纯文本） */
    content?: string;
    /** 内容变更回调 */
    onChange?: (html: string) => void;
    /** 占位文本 */
    placeholder?: string;
    /** 是否显示工具栏 */
    showToolbar?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定义类名 */
    className?: string;
    /** 最小高度 */
    minHeight?: string;
    /** 自动聚焦 */
    autofocus?: boolean;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
    function RichTextEditor(
        {
            content = '',
            onChange,
            placeholder = '开始输入...',
            showToolbar = true,
            disabled = false,
            className = '',
            minHeight = '300px',
            autofocus = false,
        },
        ref
    ) {
        // 初始化编辑器
        const editor = useEditor({
            extensions: [
                StarterKit.configure({
                    codeBlock: false, // 使用 CodeBlockLowlight 代替
                    heading: {
                        levels: [1, 2, 3, 4, 5, 6],
                    },
                }),
                Placeholder.configure({
                    placeholder,
                    emptyEditorClass: 'is-editor-empty',
                }),
                Link.configure({
                    openOnClick: false,
                    HTMLAttributes: {
                        class: 'text-purple-600 hover:text-purple-800 underline',
                    },
                }),
                Image.configure({
                    HTMLAttributes: {
                        class: 'max-w-full h-auto rounded-lg',
                    },
                }),
                CodeBlockLowlight.configure({
                    lowlight,
                    HTMLAttributes: {
                        class: 'rounded-lg bg-slate-900 text-slate-50 p-4 font-mono text-sm overflow-x-auto',
                    },
                }),
            ],
            content,
            editable: !disabled,
            autofocus,
            onUpdate: ({ editor }) => {
                onChange?.(editor.getHTML());
            },
            editorProps: {
                attributes: {
                    class: `prose prose-slate max-w-none focus:outline-none px-4 py-3`,
                    style: `min-height: ${minHeight}`,
                },
            },
        });

        // 暴露方法给父组件
        useImperativeHandle(ref, () => ({
            getEditor: () => editor,
            getHTML: () => editor?.getHTML() || '',
            getText: () => editor?.getText() || '',
            setContent: (content: string) => {
                editor?.commands.setContent(content);
            },
            focus: () => {
                editor?.commands.focus();
            },
            insertText: (text: string) => {
                editor?.commands.insertContent(text);
            },
        }), [editor]);

        // 同步 disabled 状态
        useEffect(() => {
            if (editor) {
                editor.setEditable(!disabled);
            }
        }, [editor, disabled]);

        // 同步内容变更（外部驱动）
        useEffect(() => {
            if (editor && content !== editor.getHTML()) {
                // 只有当外部内容与编辑器内容不同时才更新
                // 避免光标位置跳动
                const currentContent = editor.getHTML();
                if (content !== currentContent) {
                    editor.commands.setContent(content, false);
                }
            }
        }, [editor, content]);

        return (
            <div className={`rich-text-editor rounded-lg border border-slate-200 overflow-hidden bg-white ${className}`}>
                {/* 工具栏 */}
                {showToolbar && !disabled && (
                    <Toolbar editor={editor} />
                )}

                {/* 编辑区 */}
                <EditorContent
                    editor={editor}
                    className={`
            [&_.ProseMirror]:min-h-[${minHeight}]
            [&_.ProseMirror]:focus:outline-none
            [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.is-editor-empty:first-child::before]:text-slate-400
            [&_.is-editor-empty:first-child::before]:float-left
            [&_.is-editor-empty:first-child::before]:pointer-events-none
            [&_.is-editor-empty:first-child::before]:h-0
            ${disabled ? 'opacity-60' : ''}
          `}
                />
            </div>
        );
    }
);

export default RichTextEditor;

