/**
 * 文档类型选择器组件
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, FileText, FolderKanban, Pencil, Settings, Compass, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DocumentTypeItem } from './types';

// 文档类型定义
export const DOCUMENT_TYPES: DocumentTypeItem[] = [
    {
        key: 'facts',
        label: '事实文档',
        description: '记录客观事实、人员信息、业务数据等不可变内容',
        icon: 'file-text',
        color: 'blue',
        examples: '联系人、客户档案、产品信息',
    },
    {
        key: 'project',
        label: '项目文档',
        description: '项目管理相关文档，追踪进度和状态变化',
        icon: 'folder-kanban',
        color: 'green',
        examples: '项目计划、任务清单、里程碑',
    },
    {
        key: 'note',
        label: '笔记',
        description: '自由创作的内容，随笔、备忘、知识记录',
        icon: 'pencil',
        color: 'amber',
        examples: '学习笔记、会议记录、灵感草稿',
    },
    {
        key: 'system',
        label: '系统文档',
        description: '系统级配置和注册表，影响系统行为',
        icon: 'settings',
        color: 'purple',
        examples: '标签注册表、类型定义、权限配置',
    },
    {
        key: 'navigation',
        label: '导航文档',
        description: '定义目录结构和页面导航关系',
        icon: 'compass',
        color: 'orange',
        examples: '侧边栏配置、菜单结构、路由定义',
    },
    {
        key: 'config',
        label: '配置文档',
        description: '业务级配置文件，可热更新',
        icon: 'sliders',
        color: 'slate',
        examples: '显示配置、工作流配置、模板',
    },
];

// 颜色样式映射
const COLOR_CLASSES: Record<string, { bg: string; hover: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-50', icon: 'bg-blue-100 text-blue-600' },
    green: { bg: 'bg-green-50', hover: 'hover:bg-green-50', icon: 'bg-green-100 text-green-600' },
    amber: { bg: 'bg-amber-50', hover: 'hover:bg-amber-50', icon: 'bg-amber-100 text-amber-600' },
    purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-50', icon: 'bg-purple-100 text-purple-600' },
    orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-50', icon: 'bg-orange-100 text-orange-600' },
    slate: { bg: 'bg-slate-100', hover: 'hover:bg-slate-100', icon: 'bg-slate-200 text-slate-600' },
};

// 图标映射
function getIcon(iconName: string) {
    switch (iconName) {
        case 'file-text': return <FileText className="w-3.5 h-3.5" />;
        case 'folder-kanban': return <FolderKanban className="w-3.5 h-3.5" />;
        case 'pencil': return <Pencil className="w-3.5 h-3.5" />;
        case 'settings': return <Settings className="w-3.5 h-3.5" />;
        case 'compass': return <Compass className="w-3.5 h-3.5" />;
        case 'sliders': return <Sliders className="w-3.5 h-3.5" />;
        default: return <FileText className="w-3.5 h-3.5" />;
    }
}

interface DocumentTypeSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function DocumentTypeSelector({ value, onChange }: DocumentTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentType = DOCUMENT_TYPES.find(t => t.key === value) || DOCUMENT_TYPES[0];

    // 点击外部关闭
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (typeKey: string) => {
        onChange(typeKey);
        setIsOpen(false);
    };

    const getColorClass = (color: string, isSelected: boolean) => {
        const c = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
        return isSelected ? c.bg : c.hover;
    };

    const getIconColorClass = (color: string) => {
        return COLOR_CLASSES[color]?.icon || COLOR_CLASSES.blue.icon;
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 类型显示按钮 */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'w-full px-2 py-1.5 text-xs rounded border flex items-center justify-between gap-2',
                    'bg-white text-slate-700 border-slate-200',
                    'hover:border-blue-400 hover:bg-blue-50 transition-colors',
                    isOpen && 'border-blue-500 ring-1 ring-blue-500'
                )}
            >
                <div className="flex items-center gap-2">
                    <span className={cn('w-5 h-5 rounded flex items-center justify-center', getIconColorClass(currentType.color))}>
                        {getIcon(currentType.icon)}
                    </span>
                    <span className="font-medium">{currentType.label}</span>
                </div>
                <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {/* 下拉菜单 */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[300px]">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                        <p className="text-[10px] text-slate-500 font-medium">选择文档类型</p>
                    </div>

                    {DOCUMENT_TYPES.map((type, index) => {
                        const isSelected = type.key === value;
                        return (
                            <button
                                key={type.key}
                                type="button"
                                onClick={() => handleSelect(type.key)}
                                className={cn(
                                    "w-full px-3 py-2.5 text-left text-xs flex items-start gap-3 transition-colors",
                                    index < DOCUMENT_TYPES.length - 1 && "border-b border-slate-100",
                                    getColorClass(type.color, isSelected)
                                )}
                            >
                                <span className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5', getIconColorClass(type.color))}>
                                    {getIcon(type.icon)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700">{type.label}</span>
                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                                            {type.key}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 mt-0.5 leading-relaxed">{type.description}</p>
                                    <p className="text-slate-400 mt-1 text-[10px]">
                                        <span className="text-slate-500">示例：</span>{type.examples}
                                    </p>
                                </div>
                                {isSelected && <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default DocumentTypeSelector;

