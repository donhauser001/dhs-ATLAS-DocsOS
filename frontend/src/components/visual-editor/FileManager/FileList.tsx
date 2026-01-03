/**
 * FileList - 文件列表组件
 * 
 * 网格/列表视图展示文件，支持单选/多选、双击、右键菜单
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileText,
    FileSpreadsheet,
    Image,
    Music,
    Video,
    Archive,
    File,
    Folder,
    MoreVertical,
    Trash2,
    Download,
    Edit3,
    Grid,
    List,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    Loader2,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listDirectory, deleteFile, getDownloadUrl, formatFileSize } from '@/api/files';
import type { FileInfo } from '@/api/files';
import type { FileListProps, FileReference, ViewMode, SortConfig } from './types';

// ============================================================
// 文件图标组件
// ============================================================

function FileIcon({ extension, size = 24 }: { extension?: string; size?: number }) {
    const iconProps = { size, className: 'flex-shrink-0' };

    if (!extension) return <File {...iconProps} className="text-slate-400" />;

    const ext = extension.toLowerCase();

    // 文档
    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
        return <FileText {...iconProps} className="text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet {...iconProps} className="text-emerald-500" />;
    }
    // 图片
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <Image {...iconProps} className="text-purple-500" />;
    }
    // 音频
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return <Music {...iconProps} className="text-pink-500" />;
    }
    // 视频
    if (['mp4', 'webm', 'mov'].includes(ext)) {
        return <Video {...iconProps} className="text-red-500" />;
    }
    // 压缩包
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <Archive {...iconProps} className="text-amber-500" />;
    }

    return <File {...iconProps} className="text-slate-400" />;
}

// ============================================================
// 右键菜单
// ============================================================

interface ContextMenuProps {
    x: number;
    y: number;
    file: FileInfo;
    onClose: () => void;
    onDelete: () => void;
    onDownload: () => void;
    onRename: () => void;
}

/** 受保护的文件扩展名（不允许删除） */
const PROTECTED_EXTENSIONS = new Set(['md']);

function ContextMenu({ x, y, file, onClose, onDelete, onDownload, onRename }: ContextMenuProps) {
    useEffect(() => {
        // 使用 mousedown 而不是 click，确保点击空白区域能关闭
        const handleClickOutside = () => {
            onClose();
        };
        // 延迟添加事件监听，避免立即触发
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 0);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const isProtected = file.type === 'file' && file.extension && PROTECTED_EXTENSIONS.has(file.extension.toLowerCase());

    return (
        <div
            className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[140px]"
            style={{ top: y, left: x }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {file.type === 'file' && (
                <>
                    <button
                        onClick={onDownload}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <Download size={14} />
                        下载
                    </button>
                    <button
                        onClick={onRename}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                        <Edit3 size={14} />
                        重命名
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                </>
            )}
            {isProtected ? (
                <div className="px-3 py-1.5 text-xs text-slate-400">
                    文档文件不可删除
                </div>
            ) : (
                <button
                    onClick={onDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                >
                    <Trash2 size={14} />
                    删除
                </button>
            )}
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function FileList({
    currentPath,
    selectedFiles,
    onSelectFile,
    onConfirmFile,
    onEnterFolder,
    onDeleteFile,
    onRename,
    allowedTypes,
    multiple = false,
    maxSelect,
    disabledPaths = [],
}: FileListProps) {
    const [files, setFiles] = useState<FileInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sort, setSort] = useState<SortConfig>({ by: 'name', order: 'asc' });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileInfo } | null>(null);
    const [renamingPath, setRenamingPath] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // 检查文件是否已被禁用（已在列表中）
    const isFileDisabled = useCallback((filePath: string) => {
        return disabledPaths.includes(filePath);
    }, [disabledPaths]);

    // 检查文件是否被选中
    const isFileSelected = useCallback((filePath: string) => {
        return selectedFiles.some(f => f.path === filePath);
    }, [selectedFiles]);

    // 检查是否可以选择更多文件
    const canSelectMore = useMemo(() => {
        if (!multiple) return selectedFiles.length === 0;
        if (maxSelect) return selectedFiles.length < maxSelect;
        return true;
    }, [multiple, maxSelect, selectedFiles.length]);

    // 加载文件列表
    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await listDirectory(currentPath);
            setFiles(data);
        } catch (err) {
            console.error('Failed to load files:', err);
        } finally {
            setLoading(false);
        }
    }, [currentPath]);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // 排序文件
    const sortedFiles = useMemo(() => {
        const sorted = [...files];
        sorted.sort((a, b) => {
            // 文件夹始终在前
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }

            let compare = 0;
            switch (sort.by) {
                case 'name':
                    compare = a.name.localeCompare(b.name, 'zh-CN');
                    break;
                case 'size':
                    compare = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    compare = (a.modifiedAt || '').localeCompare(b.modifiedAt || '');
                    break;
                case 'type':
                    compare = (a.extension || '').localeCompare(b.extension || '');
                    break;
            }
            return sort.order === 'asc' ? compare : -compare;
        });
        return sorted;
    }, [files, sort]);

    // 过滤允许的文件类型
    const filteredFiles = useMemo(() => {
        let result = sortedFiles;

        // 如果不能进入文件夹，则隐藏文件夹
        if (!onEnterFolder) {
            result = result.filter(f => f.type !== 'folder');
        }

        // 过滤文件类型
        if (allowedTypes && allowedTypes.length > 0) {
            result = result.filter(f =>
                f.type === 'folder' ||
                (f.extension && allowedTypes.includes(f.extension.toLowerCase()))
            );
        }

        return result;
    }, [sortedFiles, allowedTypes, onEnterFolder]);

    // 切换排序
    const toggleSort = (by: SortConfig['by']) => {
        setSort(prev => ({
            by,
            order: prev.by === by && prev.order === 'asc' ? 'desc' : 'asc',
        }));
    };

    // 文件点击
    const handleFileClick = (file: FileInfo) => {
        if (file.type === 'folder') {
            // 如果 onEnterFolder 不存在，不允许进入文件夹
            if (onEnterFolder) {
                onEnterFolder(file.path);
            }
        } else {
            // 检查文件是否被禁用（已在列表中）
            if (isFileDisabled(file.path)) {
                return; // 不允许选择已禁用的文件
            }

            const ref: FileReference = {
                path: file.path,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                extension: file.extension,
            };

            const isSelected = isFileSelected(file.path);

            if (isSelected) {
                // 已选中，取消选择
                onSelectFile(ref, false);
            } else if (canSelectMore) {
                // 未选中且可以选择更多，添加选择
                onSelectFile(ref, true);
            }
        }
    };

    // 文件双击
    const handleFileDoubleClick = (file: FileInfo) => {
        if (file.type === 'folder') {
            if (onEnterFolder) {
                onEnterFolder(file.path);
            }
        } else {
            const ref: FileReference = {
                path: file.path,
                name: file.name,
                size: file.size,
                mimeType: file.mimeType,
                extension: file.extension,
            };
            onConfirmFile(ref);
        }
    };

    // 右键菜单
    const handleContextMenu = (e: React.MouseEvent, file: FileInfo) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, file });
    };

    // 删除文件
    const handleDelete = async (file: FileInfo) => {
        if (!confirm(`确定要删除 "${file.name}" 吗？`)) return;
        try {
            await deleteFile(file.path);
            onDeleteFile?.(file.path);
            loadFiles();
            // 如果删除的文件在选择列表中，触发取消选择
            if (isFileSelected(file.path)) {
                const ref: FileReference = {
                    path: file.path,
                    name: file.name,
                };
                onSelectFile(ref, false);
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : '删除失败');
        }
    };

    // 下载文件
    const handleDownload = (file: FileInfo) => {
        window.open(getDownloadUrl(file.path), '_blank');
    };

    // 开始重命名
    const handleStartRename = (file: FileInfo) => {
        setRenamingPath(file.path);
        setRenameValue(file.name);
        setContextMenu(null);
    };

    // 确认重命名
    const handleConfirmRename = async () => {
        if (!renamingPath || !renameValue.trim()) return;
        try {
            await onRename?.(renamingPath, renameValue.trim());
            loadFiles();
        } catch (err) {
            alert(err instanceof Error ? err.message : '重命名失败');
        } finally {
            setRenamingPath(null);
            setRenameValue('');
        }
    };

    // 面包屑
    const breadcrumbs = useMemo(() => {
        const parts = currentPath.split('/').filter(Boolean);
        const crumbs = [{ name: '文件', path: '/' }];
        let accPath = '';
        for (const part of parts) {
            accPath += '/' + part;
            crumbs.push({ name: part, path: accPath });
        }
        return crumbs;
    }, [currentPath]);

    // 渲染选择指示器
    const renderSelectionIndicator = (file: FileInfo) => {
        if (file.type === 'folder') return null;

        const isSelected = isFileSelected(file.path);
        const isDisabled = isFileDisabled(file.path);

        if (multiple) {
            // 多选模式显示复选框
            return (
                <div
                    className={cn(
                        'absolute top-1 left-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        isDisabled
                            ? 'bg-slate-400 border-slate-400 opacity-100' // 已禁用状态
                            : isSelected
                                ? 'bg-indigo-500 border-indigo-500'
                                : 'bg-white/80 border-slate-300 opacity-0 group-hover:opacity-100',
                        !canSelectMore && !isSelected && !isDisabled && 'opacity-50'
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isDisabled) return; // 禁用的文件不可操作
                        const ref: FileReference = {
                            path: file.path,
                            name: file.name,
                            size: file.size,
                            mimeType: file.mimeType,
                            extension: file.extension,
                        };
                        if (isSelected) {
                            onSelectFile(ref, false);
                        } else if (canSelectMore) {
                            onSelectFile(ref, true);
                        }
                    }}
                >
                    {(isSelected || isDisabled) && <Check size={12} className="text-white" />}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-full flex flex-col">
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50/50">
                {/* 面包屑 */}
                <div className="flex items-center gap-1 text-sm overflow-hidden">
                    {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.path} className="flex items-center">
                            {i > 0 && <ChevronRight size={14} className="text-slate-300 mx-1" />}
                            <button
                                onClick={() => onEnterFolder?.(crumb.path)}
                                disabled={!onEnterFolder}
                                className={cn(
                                    'hover:text-indigo-600 transition-colors truncate max-w-[100px]',
                                    i === breadcrumbs.length - 1
                                        ? 'text-slate-800 font-medium'
                                        : 'text-slate-500',
                                    !onEnterFolder && 'cursor-default hover:text-slate-500'
                                )}
                            >
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* 视图切换 & 排序 */}
                <div className="flex items-center gap-2">
                    {/* 多选提示 */}
                    {multiple && maxSelect && (
                        <span className="text-xs text-slate-400">
                            {selectedFiles.length}/{maxSelect}
                        </span>
                    )}

                    <div className="flex items-center bg-white rounded-md border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                'p-1.5 rounded-l-md transition-colors',
                                viewMode === 'grid'
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <Grid size={14} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'p-1.5 rounded-r-md transition-colors',
                                viewMode === 'list'
                                    ? 'bg-indigo-100 text-indigo-600'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <List size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 文件列表 */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Folder size={48} className="mb-2 opacity-50" />
                        <p>此文件夹为空</p>
                        <p className="text-xs mt-1">上传文件或创建子文件夹</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* 网格视图 */
                    <div className="grid grid-cols-4 gap-3">
                        {filteredFiles.map(file => {
                            const isSelected = isFileSelected(file.path);
                            const isDisabled = isFileDisabled(file.path);
                            return (
                                <div
                                    key={file.path}
                                    onClick={() => handleFileClick(file)}
                                    onDoubleClick={() => handleFileDoubleClick(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                    className={cn(
                                        'group relative flex flex-col items-center p-3 rounded-lg transition-all',
                                        isDisabled
                                            ? 'opacity-50 cursor-not-allowed bg-slate-100'
                                            : 'cursor-pointer hover:bg-slate-100',
                                        isSelected && !isDisabled && 'bg-indigo-50 ring-2 ring-indigo-300'
                                    )}
                                >
                                    {/* 多选指示器 */}
                                    {renderSelectionIndicator(file)}

                                    {/* 图标 */}
                                    <div className="relative mb-2">
                                        {file.type === 'folder' ? (
                                            <Folder size={40} className="text-amber-400" />
                                        ) : (
                                            <FileIcon extension={file.extension} size={40} />
                                        )}
                                    </div>

                                    {/* 名称 */}
                                    {renamingPath === file.path ? (
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={handleConfirmRename}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleConfirmRename();
                                                if (e.key === 'Escape') setRenamingPath(null);
                                            }}
                                            className="w-full text-xs text-center bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none"
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : (
                                        <span className="text-xs text-center text-slate-700 truncate w-full">
                                            {file.name}
                                        </span>
                                    )}

                                    {/* 大小 */}
                                    {file.type === 'file' && file.size !== undefined && (
                                        <span className="text-[10px] text-slate-400 mt-0.5">
                                            {formatFileSize(file.size)}
                                        </span>
                                    )}

                                    {/* 更多按钮 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e, file);
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 
                                                 hover:bg-slate-200 transition-all"
                                    >
                                        <MoreVertical size={14} className="text-slate-400" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* 列表视图 */
                    <div className="space-y-0.5">
                        {/* 表头 */}
                        <div className="flex items-center px-3 py-1.5 text-xs text-slate-500 font-medium border-b border-slate-200">
                            {multiple && <div className="w-6" />}
                            <button
                                onClick={() => toggleSort('name')}
                                className="flex-1 flex items-center gap-1 hover:text-slate-700"
                            >
                                名称
                                {sort.by === 'name' && (
                                    sort.order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                )}
                            </button>
                            <button
                                onClick={() => toggleSort('size')}
                                className="w-20 flex items-center gap-1 hover:text-slate-700"
                            >
                                大小
                                {sort.by === 'size' && (
                                    sort.order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                )}
                            </button>
                            <button
                                onClick={() => toggleSort('date')}
                                className="w-28 flex items-center gap-1 hover:text-slate-700"
                            >
                                修改时间
                                {sort.by === 'date' && (
                                    sort.order === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                )}
                            </button>
                            <div className="w-8" />
                        </div>

                        {/* 文件行 */}
                        {filteredFiles.map(file => {
                            const isSelected = isFileSelected(file.path);
                            const isDisabled = isFileDisabled(file.path);
                            return (
                                <div
                                    key={file.path}
                                    onClick={() => handleFileClick(file)}
                                    onDoubleClick={() => handleFileDoubleClick(file)}
                                    onContextMenu={(e) => handleContextMenu(e, file)}
                                    className={cn(
                                        'group flex items-center px-3 py-2 rounded-md transition-all',
                                        isDisabled
                                            ? 'opacity-50 cursor-not-allowed bg-slate-50'
                                            : 'cursor-pointer hover:bg-slate-100',
                                        isSelected && !isDisabled && 'bg-indigo-50'
                                    )}
                                >
                                    {/* 多选复选框 */}
                                    {multiple && file.type !== 'folder' && (
                                        <div
                                            className={cn(
                                                'w-5 h-5 mr-2 rounded border-2 flex items-center justify-center transition-all',
                                                isDisabled
                                                    ? 'bg-slate-400 border-slate-400 cursor-not-allowed'
                                                    : 'cursor-pointer',
                                                !isDisabled && isSelected
                                                    ? 'bg-indigo-500 border-indigo-500'
                                                    : !isDisabled && 'border-slate-300 hover:border-indigo-400',
                                                !canSelectMore && !isSelected && !isDisabled && 'opacity-50'
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (isDisabled) return; // 禁用的文件不可操作
                                                const ref: FileReference = {
                                                    path: file.path,
                                                    name: file.name,
                                                    size: file.size,
                                                    mimeType: file.mimeType,
                                                    extension: file.extension,
                                                };
                                                if (isSelected) {
                                                    onSelectFile(ref, false);
                                                } else if (canSelectMore) {
                                                    onSelectFile(ref, true);
                                                }
                                            }}
                                        >
                                            {(isSelected || isDisabled) && <Check size={12} className="text-white" />}
                                        </div>
                                    )}
                                    {multiple && file.type === 'folder' && <div className="w-7" />}

                                    {/* 图标 + 名称 */}
                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                        {file.type === 'folder' ? (
                                            <Folder size={18} className="text-amber-400 flex-shrink-0" />
                                        ) : (
                                            <FileIcon extension={file.extension} size={18} />
                                        )}
                                        {renamingPath === file.path ? (
                                            <input
                                                type="text"
                                                value={renameValue}
                                                onChange={(e) => setRenameValue(e.target.value)}
                                                onBlur={handleConfirmRename}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleConfirmRename();
                                                    if (e.key === 'Escape') setRenamingPath(null);
                                                }}
                                                className="flex-1 text-sm bg-white border border-indigo-300 rounded px-2 py-0.5 outline-none"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <span className="text-sm text-slate-700 truncate">
                                                {file.name}
                                            </span>
                                        )}
                                    </div>

                                    {/* 大小 */}
                                    <span className="w-20 text-xs text-slate-400">
                                        {file.type === 'file' && file.size !== undefined
                                            ? formatFileSize(file.size)
                                            : '-'}
                                    </span>

                                    {/* 修改时间 */}
                                    <span className="w-28 text-xs text-slate-400">
                                        {file.modifiedAt
                                            ? new Date(file.modifiedAt).toLocaleDateString('zh-CN')
                                            : '-'}
                                    </span>

                                    {/* 更多按钮 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleContextMenu(e, file);
                                        }}
                                        className="w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreVertical size={14} className="text-slate-400" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 右键菜单 */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    file={contextMenu.file}
                    onClose={() => setContextMenu(null)}
                    onDelete={() => {
                        handleDelete(contextMenu.file);
                        setContextMenu(null);
                    }}
                    onDownload={() => {
                        handleDownload(contextMenu.file);
                        setContextMenu(null);
                    }}
                    onRename={() => handleStartRename(contextMenu.file)}
                />
            )}
        </div>
    );
}

export default FileList;
