/**
 * FolderTree - 目录树组件
 * 
 * 精致的可折叠目录树，支持创建/删除文件夹
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFolderTree, createFolder, deleteFolder } from '@/api/files';
import type { FolderNode, FolderTreeProps } from './types';

interface TreeNodeProps {
    node: FolderNode;
    level: number;
    selectedPath: string;
    expandedPaths: Set<string>;
    onSelect: (path: string) => void;
    onToggle: (path: string) => void;
    onCreateFolder: (parentPath: string) => void;
    onDeleteFolder: (path: string) => void;
}

function TreeNode({
    node,
    level,
    selectedPath,
    expandedPaths,
    onSelect,
    onToggle,
    onCreateFolder,
    onDeleteFolder,
}: TreeNodeProps) {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = level === 0;

    return (
        <div>
            <div
                className={cn(
                    'group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all',
                    'hover:bg-slate-100',
                    isSelected && 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => onSelect(node.path)}
            >
                {/* 展开/折叠按钮 */}
                {hasChildren ? (
                    <button
                        className="p-0.5 hover:bg-slate-200 rounded transition-colors"
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

                {/* 文件夹图标 */}
                {isExpanded ? (
                    <FolderOpen size={16} className={cn(
                        'flex-shrink-0',
                        isSelected ? 'text-indigo-500' : 'text-amber-500'
                    )} />
                ) : (
                    <Folder size={16} className={cn(
                        'flex-shrink-0',
                        isSelected ? 'text-indigo-500' : 'text-amber-500'
                    )} />
                )}

                {/* 名称 */}
                <span className={cn(
                    'flex-1 text-sm truncate',
                    isRoot && 'font-medium'
                )}>
                    {node.name}
                </span>

                {/* 操作按钮 */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCreateFolder(node.path);
                        }}
                        title="新建子文件夹"
                    >
                        <Plus size={12} className="text-slate-500" />
                    </button>
                    {!isRoot && (
                        <button
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteFolder(node.path);
                            }}
                            title="删除文件夹"
                        >
                            <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                        </button>
                    )}
                </div>
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
                            onDeleteFolder={onDeleteFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FolderTree({
    selectedPath,
    onSelect,
    onCreateFolder: onCreateFolderProp,
    onDeleteFolder: onDeleteFolderProp,
}: FolderTreeProps) {
    const [tree, setTree] = useState<FolderNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [creatingIn, setCreatingIn] = useState<string | null>(null);
    const [newFolderName, setNewFolderName] = useState('');

    // 加载目录树
    const loadTree = useCallback(async () => {
        try {
            const data = await getFolderTree();
            setTree(data);
        } catch (err) {
            console.error('Failed to load folder tree:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadTree();
    }, [loadTree]);

    // 展开/折叠
    const handleToggle = useCallback((path: string) => {
        setExpandedPaths(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    // 创建文件夹
    const handleCreateFolder = useCallback((parentPath: string) => {
        setCreatingIn(parentPath);
        setNewFolderName('');
        // 确保父目录展开
        setExpandedPaths(prev => new Set([...prev, parentPath]));
    }, []);

    const handleConfirmCreate = useCallback(async () => {
        if (!creatingIn || !newFolderName.trim()) return;

        const newPath = creatingIn === '/'
            ? `/${newFolderName.trim()}`
            : `${creatingIn}/${newFolderName.trim()}`;

        try {
            await createFolder(newPath);
            await loadTree();
            onSelect(newPath);
            onCreateFolderProp?.(creatingIn);
        } catch (err) {
            console.error('Failed to create folder:', err);
        } finally {
            setCreatingIn(null);
            setNewFolderName('');
        }
    }, [creatingIn, newFolderName, loadTree, onSelect, onCreateFolderProp]);

    // 删除文件夹
    const handleDeleteFolder = useCallback(async (path: string) => {
        if (!confirm(`确定要删除文件夹 "${path.split('/').pop()}" 吗？`)) return;

        try {
            await deleteFolder(path);
            await loadTree();
            // 如果删除的是当前选中的，选中父目录
            if (selectedPath.startsWith(path)) {
                const parentPath = path.split('/').slice(0, -1).join('/') || '/';
                onSelect(parentPath);
            }
            onDeleteFolderProp?.(path);
        } catch (err) {
            alert(err instanceof Error ? err.message : '删除失败');
        }
    }, [selectedPath, loadTree, onSelect, onDeleteFolderProp]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    if (!tree) {
        return (
            <div className="text-center text-slate-400 py-8">
                加载失败
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* 标题 */}
            <div className="px-3 py-2 border-b border-slate-200">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    文件夹
                </h3>
            </div>

            {/* 目录树 */}
            <div className="flex-1 overflow-auto py-2">
                <TreeNode
                    node={tree}
                    level={0}
                    selectedPath={selectedPath}
                    expandedPaths={expandedPaths}
                    onSelect={onSelect}
                    onToggle={handleToggle}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFolder={handleDeleteFolder}
                />

                {/* 新建文件夹输入 */}
                {creatingIn !== null && (
                    <div
                        className="flex items-center gap-2 px-3 py-2 mt-1 mx-2 bg-indigo-50 rounded-md"
                    >
                        <Folder size={14} className="text-indigo-400 flex-shrink-0" />
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleConfirmCreate();
                                if (e.key === 'Escape') setCreatingIn(null);
                            }}
                            placeholder="文件夹名称"
                            className="flex-1 text-sm bg-transparent outline-none placeholder:text-indigo-300"
                            autoFocus
                        />
                        <button
                            onClick={handleConfirmCreate}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                            创建
                        </button>
                        <button
                            onClick={() => setCreatingIn(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                        >
                            取消
                        </button>
                    </div>
                )}
            </div>

            {/* 底部新建按钮 */}
            <div className="px-3 py-2 border-t border-slate-200">
                <button
                    onClick={() => handleCreateFolder(selectedPath)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 
                             hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                >
                    <Plus size={14} />
                    新建文件夹
                </button>
            </div>
        </div>
    );
}

export default FolderTree;

