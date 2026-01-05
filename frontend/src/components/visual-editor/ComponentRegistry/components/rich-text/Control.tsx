/**
 * RichText 组件 - 数据块控件
 * 
 * 简化版富文本编辑器
 */

import { useState } from 'react';
import { Bold, Italic, List, ListOrdered, Quote, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, RichTextComponentDefinition } from '../../types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const richTextDef = component as RichTextComponentDefinition;
    const [isFocused, setIsFocused] = useState(false);

    const stringValue = typeof value === 'string' ? value : '';

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value || null);
    };

    // 工具栏按钮
    const ToolbarButton = ({ icon: Icon, title, onClick }: { 
        icon: React.ElementType; 
        title: string;
        onClick: () => void;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'p-1.5 rounded hover:bg-slate-100 transition-colors',
                'text-slate-500 hover:text-slate-700',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
            title={title}
        >
            <Icon className="h-4 w-4" />
        </button>
    );

    // 简单的格式化插入（实际应用中需要更复杂的富文本编辑器）
    const insertFormat = (prefix: string, suffix: string = prefix) => {
        const textarea = document.querySelector('textarea[data-rich-text]') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = stringValue.substring(start, end);
        const newText = stringValue.substring(0, start) + prefix + selectedText + suffix + stringValue.substring(end);
        
        onChange(newText);
    };

    return (
        <div className={cn(
            'border rounded-lg overflow-hidden',
            isFocused ? 'border-purple-400 ring-2 ring-purple-400/50' : 'border-slate-200'
        )}>
            {/* 工具栏 */}
            <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200">
                <ToolbarButton icon={Bold} title="粗体" onClick={() => insertFormat('**')} />
                <ToolbarButton icon={Italic} title="斜体" onClick={() => insertFormat('_')} />
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <ToolbarButton icon={List} title="无序列表" onClick={() => insertFormat('- ', '')} />
                <ToolbarButton icon={ListOrdered} title="有序列表" onClick={() => insertFormat('1. ', '')} />
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <ToolbarButton icon={Quote} title="引用" onClick={() => insertFormat('> ', '')} />
                <ToolbarButton icon={Code} title="代码" onClick={() => insertFormat('`')} />
            </div>

            {/* 编辑区 */}
            <textarea
                data-rich-text
                value={stringValue}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                placeholder={richTextDef.placeholder}
                className={cn(
                    'w-full px-3 py-2 text-sm resize-none',
                    'focus:outline-none',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
                style={{
                    minHeight: richTextDef.minHeight || 150,
                    maxHeight: richTextDef.maxHeight || 400,
                }}
            />
        </div>
    );
}

export default Control;


