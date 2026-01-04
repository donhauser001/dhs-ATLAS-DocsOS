/**
 * FolderPicker - 目录选择器组件
 * 
 * 用于在配置器中选择文件上传目录
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, X, Check, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFolderTree, createFolder } from '@/api/files';
import type { FolderNode } from '@/api/files';

interface FolderPickerProps {
    /** 当前选中的目录路径 */
    value?: string;
    /** 选择变更回调 */
    onChange: (path: string | undefined) => void;
    /** 占位文字 */
    placeholder?: string;
    /** 是否禁用 */
    disabled?: boolean;
}

interface TreeNodeProps {
    node: FolderNode;
    level: number;
    selectedPath: string;
    expandedPaths: Set<string>;
    onSelect: (path: string) => void;
    onToggle: (path: string) => void;
    onCreateFolder: (parentPath: string) => void;
}

function TreeNode({
    node,
    level,
    selectedPath,
    expandedPaths,
    onSelect,
    onToggle,
    onCreateFolder,
}: TreeNodeProps) {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div>
            <div
                className={cn(
                    'group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-colors',
                    'hover:bg-slate-100',
                    isSelected && 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                )}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onClick={() => onSelect(node.path)}
            >
                {/* 展开/折叠 */}
                {hasChildren ? (
                    <button
                        className="p-0.5 hover:bg-slate-200 rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.path);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown size={14} className="text-slate-400" />
                        ) : (
                            <ChevronRight size={14} className="text-slate-400" />
                        )}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                {/* 图标 */}
                {isExpanded ? (
                    <FolderOpen size={16} className={isSelected ? 'text-purple-500' : 'text-amber-500'} />
                ) : (
                    <Folder size={16} className={isSelected ? 'text-purple-500' : 'text-amber-500'} />
                )}

                {/* 名称 */}
                <span className="flex-1 text-sm truncate">{node.name}</span>

                {/* 新建子目录按钮 */}
                <button
                    className="p-0.5 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCreateFolder(node.path);
                    }}
                    title="新建子目录"
                >
                    <Plus size={12} className="text-slate-400 hover:text-purple-600" />
                </button>

                {/* 选中标记 */}
                {isSelected && <Check size={14} className="text-purple-600" />}
            </div>

            {/* 子节点 */}
            {hasChildren && isExpanded && (
                <div>
                    {node.children!.map((child) => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            level={level + 1}
                            selectedPath={selectedPath}
                            expandedPaths={expandedPaths}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            onCreateFolder={onCreateFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderPicker({
    value,
    onChange,
    placeholder = '选择目录（默认根目录）',
    disabled = false,
}: FolderPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tree, setTree] = useState<FolderNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [tempSelected, setTempSelected] = useState<string>(value || '/');
    const containerRef = useRef<HTMLDivElement>(null);

    // 新建目录状态
    const [creatingIn, setCreatingIn] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');
    const [creating, setCreating] = useState(false);

    // 加载目录树
    const loadTree = useCallback(async (force = false) => {
        if (tree && !force) return; // 已加载
        setLoading(true);
        try {
            const data = await getFolderTree();
            setTree(data);
        } catch (err) {
            console.error('Failed to load folder tree:', err);
        } finally {
            setLoading(false);
        }
    }, [tree]);

    // 打开下拉时加载
    useEffect(() => {
        if (isOpen) {
            loadTree();
            setTempSelected(value || '/');
        }
    }, [isOpen, loadTree, value]);

    // 点击外部关闭
    useEffect(() => {
        if (!isOpen) return;
        
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        
        // 延迟添加，避免立即触发
        const timeoutId = setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);
        
        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    // 展开/折叠
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

    // 开始创建目录
    const handleStartCreate = useCallback((parentPath: string) => {
        setCreatingIn(parentPath);
        setNewFolderName('');
        // 确保父目录展开
        setExpandedPaths((prev) => new Set([...prev, parentPath]));
    }, []);

    // 确认创建目录
    const handleConfirmCreate = useCallback(async () => {
        if (!creatingIn || !newFolderName.trim()) return;

        const newPath = creatingIn === '/'
            ? `/${newFolderName.trim()}`
            : `${creatingIn}/${newFolderName.trim()}`;

        setCreating(true);
        try {
            await createFolder(newPath);
            // 重新加载目录树
            setTree(null);
            await loadTree(true);
            // 选中新创建的目录
            setTempSelected(newPath);
            setExpandedPaths((prev) => new Set([...prev, newPath]));
        } catch (err) {
            console.error('Failed to create folder:', err);
            alert(err instanceof Error ? err.message : '创建失败');
        } finally {
            setCreating(false);
            setCreatingIn(null);
            setNewFolderName('');
        }
    }, [creatingIn, newFolderName, loadTree]);

    // 取消创建
    const handleCancelCreate = useCallback(() => {
        setCreatingIn(null);
        setNewFolderName('');
    }, []);

    // 确认选择
    const handleConfirm = () => {
        onChange(tempSelected === '/' ? undefined : tempSelected);
        setIsOpen(false);
    };

    // 清除选择
    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(undefined);
    };

    // 显示文本
    const displayText = value ? value : placeholder;

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm border rounded-lg text-left transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-purple-400/50',
                    disabled
                        ? 'bg-slate-50 cursor-not-allowed border-slate-200 text-slate-400'
                        : 'border-slate-200 hover:border-slate-300 cursor-pointer',
                    isOpen && 'border-purple-400 ring-2 ring-purple-400/50'
                )}
            >
                <Folder size={16} className={value ? 'text-amber-500' : 'text-slate-400'} />
                <span className={cn('flex-1 truncate', !value && 'text-slate-400')}>
                    {displayText}
                </span>
                {value && !disabled && (
                    <X
                        size={14}
                        className="text-slate-400 hover:text-red-500"
                        onClick={handleClear}
                    />
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50"
                >
                    {/* 头部 */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <span className="text-xs font-medium text-slate-500">选择保存目录</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-0.5 hover:bg-slate-200 rounded"
                        >
                            <X size={14} className="text-slate-400" />
                        </button>
                    </div>

                    {/* 目录树 */}
                    <div className="max-h-64 overflow-auto p-2">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="animate-spin text-slate-400" size={20} />
                            </div>
                        ) : tree ? (
                            <>
                                <TreeNode
                                    node={tree}
                                    level={0}
                                    selectedPath={tempSelected}
                                    expandedPaths={expandedPaths}
                                    onSelect={setTempSelected}
                                    onToggle={handleToggle}
                                    onCreateFolder={handleStartCreate}
                                />

                                {/* 新建目录输入框 */}
                                {creatingIn !== null && (
                                    <div className="flex items-center gap-2 px-3 py-2 mt-1 mx-1 bg-purple-50 rounded-md border border-purple-200">
                                        <Folder size={14} className="text-purple-400 flex-shrink-0" />
                                        <input
                                            type="text"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirmCreate();
                                                if (e.key === 'Escape') handleCancelCreate();
                                            }}
                                            placeholder="新文件夹名称"
                                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-purple-300"
                                            autoFocus
                                            disabled={creating}
                                        />
                                        {creating ? (
                                            <Loader2 size={14} className="animate-spin text-purple-500" />
                                        ) : (
                                            <>
                                                <button
                                                    onClick={handleConfirmCreate}
                                                    disabled={!newFolderName.trim()}
                                                    className="text-xs text-purple-600 hover:text-purple-800 disabled:opacity-50"
                                                >
                                                    创建
                                                </button>
                                                <button
                                                    onClick={handleCancelCreate}
                                                    className="text-xs text-slate-400 hover:text-slate-600"
                                                >
                                                    取消
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center text-slate-400 py-4 text-sm">
                                加载失败
                            </div>
                        )}
                    </div>

                    {/* 底部 */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50">
                        <button
                            onClick={() => handleStartCreate(tempSelected)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        >
                            <Plus size={12} />
                            新建目录
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleConfirm}
                                className="px-3 py-1 text-xs text-white bg-purple-600 hover:bg-purple-700 rounded"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FolderPicker;
