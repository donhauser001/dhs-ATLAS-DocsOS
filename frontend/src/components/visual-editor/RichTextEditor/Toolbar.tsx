/**
 * Toolbar - 富文本编辑器工具栏
 */

import React from 'react';
import { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Minus,
    Link2,
    Image,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
} from 'lucide-react';

interface ToolbarProps {
    editor: Editor | null;
}

interface ToolbarButtonProps {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    title: string;
}

function ToolbarButton({ onClick, isActive, disabled, icon: Icon, title }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors
                  ${isActive
                    ? 'bg-purple-100 text-purple-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon size={18} />
        </button>
    );
}

function ToolbarDivider() {
    return <div className="w-px h-6 bg-slate-200 mx-1" />;
}

export function Toolbar({ editor }: ToolbarProps) {
    if (!editor) return null;

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) return;

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Image URL');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    return (
        <div className="toolbar flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
            {/* 历史操作 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                icon={Undo}
                title="撤销 (⌘Z)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                icon={Redo}
                title="重做 (⌘⇧Z)"
            />

            <ToolbarDivider />

            {/* 标题 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                icon={Heading1}
                title="一级标题"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                icon={Heading2}
                title="二级标题"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                icon={Heading3}
                title="三级标题"
            />

            <ToolbarDivider />

            {/* 文本格式 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                icon={Bold}
                title="粗体 (⌘B)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                icon={Italic}
                title="斜体 (⌘I)"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                icon={Strikethrough}
                title="删除线"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleCode().run()}
                isActive={editor.isActive('code')}
                icon={Code}
                title="行内代码"
            />

            <ToolbarDivider />

            {/* 列表 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                icon={List}
                title="无序列表"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                icon={ListOrdered}
                title="有序列表"
            />

            <ToolbarDivider />

            {/* 块级元素 */}
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                icon={Quote}
                title="引用"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                icon={Minus}
                title="分割线"
            />

            <ToolbarDivider />

            {/* 链接和图片 */}
            <ToolbarButton
                onClick={addLink}
                isActive={editor.isActive('link')}
                icon={Link2}
                title="链接"
            />
            <ToolbarButton
                onClick={addImage}
                icon={Image}
                title="图片"
            />
        </div>
    );
}

export default Toolbar;

