/**
 * SlashCommand - 斜杠命令扩展
 * 
 * 输入 `/` 触发命令面板
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Extension } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  Image,
  Table,
  FileText,
  Braces,
  type LucideIcon,
} from 'lucide-react';

// 命令项定义
export interface CommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  command: (props: { editor: any; range: any }) => void;
}

// 默认命令列表
export const defaultCommands: CommandItem[] = [
  {
    title: '一级标题',
    description: '大标题',
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: '二级标题',
    description: '中标题',
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: '三级标题',
    description: '小标题',
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: '无序列表',
    description: '创建简单的项目符号列表',
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: '有序列表',
    description: '创建带编号的列表',
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: '任务列表',
    description: '创建可勾选的任务清单',
    icon: CheckSquare,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: '引用',
    description: '添加引用块',
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: '分割线',
    description: '插入水平分割线',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: '代码块',
    description: '插入代码块',
    icon: Code,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: '图片',
    description: '插入图片',
    icon: Image,
    command: ({ editor, range }) => {
      const url = window.prompt('图片 URL');
      if (url) {
        editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
      }
    },
  },
];

// 命令列表组件
interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export function CommandList({ items, command }: CommandListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 键盘导航
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (items[selectedIndex]) {
        command(items[selectedIndex]);
      }
    }
  }, [items, selectedIndex, command]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 滚动到选中项
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const selectedElement = container.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (items.length === 0) {
    return (
      <div className="p-3 text-sm text-slate-500">
        没有找到命令
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="slash-command-list bg-white rounded-lg shadow-lg border border-slate-200 
                 overflow-y-auto max-h-80 w-72"
    >
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => command(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                       ${index === selectedIndex 
                         ? 'bg-purple-50 text-purple-700' 
                         : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                            ${index === selectedIndex 
                              ? 'bg-purple-100 text-purple-600' 
                              : 'bg-slate-100 text-slate-500'}`}>
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs text-slate-500 truncate">{item.description}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 创建斜杠命令扩展
export function createSlashCommandExtension(commands: CommandItem[] = defaultCommands) {
  return Extension.create({
    name: 'slashCommand',

    addOptions() {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }: { editor: any; range: any; props: CommandItem }) => {
            props.command({ editor, range });
          },
        },
      };
    },

    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion,
          items: ({ query }: { query: string }) => {
            return commands.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              item.description.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: TippyInstance[] | null = null;

            return {
              onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                  props: {
                    ...props,
                    command: (item: CommandItem) => {
                      props.command(item);
                    },
                  },
                  editor: props.editor,
                });

                if (!props.clientRect) return;

                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },

              onUpdate(props: any) {
                component?.updateProps({
                  ...props,
                  command: (item: CommandItem) => {
                    props.command(item);
                  },
                });

                if (!props.clientRect) return;

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return false;
              },

              onExit() {
                popup?.[0]?.destroy();
                component?.destroy();
              },
            };
          },
        }),
      ];
    },
  });
}

export default createSlashCommandExtension;

