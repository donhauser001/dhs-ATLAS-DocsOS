/**
 * FolderPicker 组件 - 数据块控件
 * 支持多选目录
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { FolderTree, ChevronRight, ChevronDown, X, Plus, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, FolderPickerComponentDefinition } from '../../types';
import { getFolderTree } from '@/api/files';

interface FolderNode {
    name: string;
    path: string;
    children?: FolderNode[];
}

interface TreeNodeProps {
    node: FolderNode;
    level: number;
    selectedPaths: string[];
    expandedPaths: Set<string>;
    onSelect: (path: string) => void;
    onToggle: (path: string) => void;
}

function TreeNode({ node, level, selectedPaths, expandedPaths, onSelect, onToggle }: TreeNodeProps) {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPaths.includes(node.path);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    'flex items-center gap-1 py-1 px-2 rounded cursor-pointer hover:bg-slate-100',
                    isSelected && 'bg-purple-50 text-purple-700'
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(node.path);
                }}
            >
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.path);
                        }}
                        className="p-0.5 hover:bg-slate-200 rounded"
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-3 w-3" />
                        ) : (
                            <ChevronRight className="h-3 w-3" />
                        )}
                    </button>
                ) : (
                    <span className="w-4" />
                )}
                <Folder className={cn('h-4 w-4', isSelected ? 'text-purple-500' : 'text-amber-500')} />
                <span className="text-sm truncate">{node.name}</span>
            </div>
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            level={level + 1}
                            selectedPaths={selectedPaths}
                            expandedPaths={expandedPaths}
                            onSelect={onSelect}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const folderDef = component as FolderPickerComponentDefinition;
    const [isOpen, setIsOpen] = useState(false);
    const [folderTree, setFolderTree] = useState<FolderNode | null>(null);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 解析当前值
    const selectedPaths: string[] = (() => {
        if (!value) return [];
        if (Array.isArray(value)) return value as string[];
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                return value ? [value] : [];
            }
        }
        return [];
    })();

    // 加载目录树
    useEffect(() => {
        if (isOpen && !folderTree) {
            setLoading(true);
            getFolderTree()
                .then((tree) => {
                    setFolderTree(tree || null);
                    // 默认展开根目录
                    if (tree?.path) {
                        setExpandedPaths(new Set([tree.path]));
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, folderTree]);

    // 点击外部关闭
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = useCallback((path: string) => {
        if (folderDef.multiple) {
            const newPaths = selectedPaths.includes(path)
                ? selectedPaths.filter((p) => p !== path)
                : [...selectedPaths, path];
            onChange(JSON.stringify(newPaths));
        } else {
            onChange(path);
            setIsOpen(false);
        }
    }, [folderDef.multiple, selectedPaths, onChange]);

    const handleToggle = useCallback((path: string) => {
        setExpandedPaths((prev) => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const handleRemove = (path: string) => {
        const newPaths = selectedPaths.filter((p) => p !== path);
        onChange(newPaths.length > 0 ? JSON.stringify(newPaths) : null);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* 已选择的路径标签 */}
            {selectedPaths.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {selectedPaths.map((path) => (
                        <span
                            key={path}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded-md"
                        >
                            <Folder className="h-3 w-3" />
                            {path}
                            {!disabled && (
                                <button
                                    onClick={() => handleRemove(path)}
                                    className="hover:text-purple-900"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* 触发按钮 */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-lg text-left',
                    'hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                    disabled && 'bg-slate-50 text-slate-400 cursor-not-allowed'
                )}
            >
                <Plus className="h-4 w-4 text-slate-400" />
                <span className="text-slate-500">
                    {folderDef.placeholder || '点击选择目录...'}
                </span>
            </button>

            {/* 下拉目录树 */}
            {isOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-slate-500">加载中...</div>
                    ) : !folderTree ? (
                        <div className="p-4 text-center text-sm text-slate-500">暂无目录</div>
                    ) : (
                        <div className="p-2">
                            <TreeNode
                                node={folderTree}
                                level={0}
                                selectedPaths={selectedPaths}
                                expandedPaths={expandedPaths}
                                onSelect={handleSelect}
                                onToggle={handleToggle}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Control;

