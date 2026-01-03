/**
 * FileManagerDialog - 文件管理器主对话框
 * 
 * 整合目录树、文件列表、上传组件的完整文件管理器
 * 支持单选和多选模式
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    FolderOpen,
    Search,
    CheckCircle2,
    ChevronRight,
    Home,
    FolderPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { rename, createFolder } from '@/api/files';
import { FolderTree } from './FolderTree';
import { FileList } from './FileList';
import { FileUploader } from './FileUploader';
import type { FileManagerDialogProps, FileReference } from './types';

export function FileManagerDialog({
    open,
    onClose,
    onSelect,
    initialPath = '/',
    allowedTypes,
    title = '文件管理器',
    restrictToPath = false,
    multiple = false,
    maxSelect,
    disabledPaths = [],
}: FileManagerDialogProps) {
    const [currentPath, setCurrentPath] = useState(initialPath);
    const [selectedFiles, setSelectedFiles] = useState<FileReference[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const dialogRef = useRef<HTMLDivElement>(null);
    
    // 新建文件夹状态（限定模式下使用）
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // ESC 关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (open) {
            document.addEventListener('keydown', handleKeyDown);
            return () => document.removeEventListener('keydown', handleKeyDown);
        }
    }, [open, onClose]);

    // 点击外部关闭
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    // 刷新文件列表
    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);

    // 选择目录
    const handleSelectFolder = useCallback((path: string) => {
        setCurrentPath(path);
        // 切换目录时清空选择
        setSelectedFiles([]);
    }, []);

    // 进入文件夹（受限模式下只能在限定目录内导航）
    const handleEnterFolder = useCallback((path: string) => {
        // 如果是受限模式，检查目标路径是否在限定目录内
        if (restrictToPath) {
            const normalizedInitial = initialPath.endsWith('/') ? initialPath : initialPath + '/';
            const normalizedTarget = path.endsWith('/') ? path : path + '/';
            // 目标路径必须以限定目录开头，或者就是限定目录本身
            if (path !== initialPath && !normalizedTarget.startsWith(normalizedInitial)) {
                return; // 不允许退出限定目录
            }
        }
        setCurrentPath(path);
        // 切换目录时清空选择
        setSelectedFiles([]);
    }, [restrictToPath, initialPath]);

    // 计算面包屑路径（受限模式下从限定目录开始显示）
    const breadcrumbs = useMemo(() => {
        const basePath = restrictToPath ? initialPath : '/';
        const normalizedBase = basePath.replace(/\/$/, '') || '/';
        const normalizedCurrent = currentPath.replace(/\/$/, '') || '/';
        
        if (normalizedCurrent === normalizedBase || normalizedCurrent === '/') {
            return [];
        }
        
        // 获取相对于基础路径的部分
        let relativePath = normalizedCurrent;
        if (restrictToPath && normalizedCurrent.startsWith(normalizedBase)) {
            relativePath = normalizedCurrent.slice(normalizedBase.length);
        }
        
        const parts = relativePath.split('/').filter(Boolean);
        const result: { name: string; path: string }[] = [];
        
        let accPath = normalizedBase;
        for (const part of parts) {
            accPath = accPath === '/' ? `/${part}` : `${accPath}/${part}`;
            result.push({ name: part, path: accPath });
        }
        
        return result;
    }, [currentPath, initialPath, restrictToPath]);

    // 选择/取消选择文件
    const handleSelectFile = useCallback((file: FileReference, selected: boolean) => {
        if (multiple) {
            // 多选模式
            if (selected) {
                // 检查是否已达到最大选择数
                if (maxSelect && selectedFiles.length >= maxSelect) {
                    return;
                }
                setSelectedFiles(prev => [...prev, file]);
            } else {
                setSelectedFiles(prev => prev.filter(f => f.path !== file.path));
            }
        } else {
            // 单选模式
            setSelectedFiles(selected ? [file] : []);
        }
    }, [multiple, maxSelect, selectedFiles.length]);

    // 双击确认选择（单选模式直接确认，多选模式添加到选择）
    const handleConfirmFile = useCallback((file: FileReference) => {
        if (multiple) {
            // 多选模式：双击添加到选择
            const isSelected = selectedFiles.some(f => f.path === file.path);
            if (!isSelected && (!maxSelect || selectedFiles.length < maxSelect)) {
                setSelectedFiles(prev => [...prev, file]);
            }
        } else {
            // 单选模式：直接确认
            onSelect(file);
            onClose();
        }
    }, [multiple, maxSelect, selectedFiles, onSelect, onClose]);

    // 确认按钮
    const handleConfirm = useCallback(() => {
        if (selectedFiles.length === 0) return;
        
        if (multiple) {
            onSelect(selectedFiles);
        } else {
            onSelect(selectedFiles[0]);
        }
        onClose();
    }, [selectedFiles, multiple, onSelect, onClose]);

    // 重命名
    const handleRename = useCallback(async (path: string, newName: string) => {
        await rename(path, newName);
        handleRefresh();
    }, [handleRefresh]);

    // 在限定模式下创建文件夹
    const handleCreateFolder = useCallback(async () => {
        if (!newFolderName.trim()) {
            setIsCreatingFolder(false);
            return;
        }
        
        const folderPath = currentPath === '/' 
            ? `/${newFolderName.trim()}`
            : `${currentPath}/${newFolderName.trim()}`;
        
        try {
            await createFolder(folderPath);
            handleRefresh();
            // 自动进入新创建的文件夹
            handleEnterFolder(folderPath);
        } catch (err) {
            console.error('Failed to create folder:', err);
        } finally {
            setIsCreatingFolder(false);
            setNewFolderName('');
        }
    }, [currentPath, newFolderName, handleRefresh, handleEnterFolder]);

    if (!open) return null;

    // 计算提示文本
    const getSelectionHint = () => {
        if (multiple) {
            if (maxSelect) {
                return `可选择 ${maxSelect} 个文件`;
            }
            return '可选择多个文件';
        }
        return '选择文件插入到文档';
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                ref={dialogRef}
                className="relative flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden
                         w-[90vw] max-w-[1000px] h-[70vh] min-h-[500px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 头部 */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <FolderOpen size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                            <p className="text-xs text-slate-400">{getSelectionHint()}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* 搜索框 */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="搜索文件..."
                                className="pl-9 pr-3 py-1.5 text-sm bg-slate-100 border-0 rounded-lg 
                                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                                         w-48 placeholder:text-slate-400"
                            />
                        </div>

                        {/* 关闭按钮 */}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* 主体 */}
                <div className="flex-1 flex overflow-hidden">
                    {/* 左侧：目录树（非限制模式时显示） */}
                    {!restrictToPath && (
                        <div className="w-64 border-r border-slate-200 bg-slate-50/50 flex-shrink-0">
                            <FolderTree
                                selectedPath={currentPath}
                                onSelect={handleSelectFolder}
                                onCreateFolder={handleRefresh}
                                onDeleteFolder={handleRefresh}
                            />
                        </div>
                    )}

                    {/* 右侧：文件列表 + 上传 */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* 限制模式时显示面包屑导航 */}
                        {restrictToPath && (
                            <div className="flex items-center gap-1 px-4 py-2 bg-amber-50 border-b border-amber-100">
                                <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
                                    <FolderOpen size={14} className="text-amber-600 flex-shrink-0" />
                                    <span className="text-sm text-amber-600 flex-shrink-0">限定:</span>
                                    
                                    {/* 根目录（限定目录） */}
                                    <button
                                        onClick={() => handleEnterFolder(initialPath)}
                                        className={cn(
                                            'text-sm px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors flex-shrink-0',
                                            currentPath === initialPath || currentPath === initialPath + '/'
                                                ? 'text-amber-800 font-medium'
                                                : 'text-amber-600 hover:text-amber-800'
                                        )}
                                    >
                                        <Home size={14} className="inline-block mr-1" />
                                        {initialPath === '/' ? '根目录' : initialPath.split('/').pop() || initialPath}
                                    </button>
                                    
                                    {/* 子目录面包屑 */}
                                    {breadcrumbs.map((crumb, index) => (
                                        <div key={crumb.path} className="flex items-center gap-1 flex-shrink-0">
                                            <ChevronRight size={12} className="text-amber-400" />
                                            <button
                                                onClick={() => handleEnterFolder(crumb.path)}
                                                className={cn(
                                                    'text-sm px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors',
                                                    index === breadcrumbs.length - 1
                                                        ? 'text-amber-800 font-medium'
                                                        : 'text-amber-600 hover:text-amber-800'
                                                )}
                                            >
                                                {crumb.name}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* 新建文件夹按钮/输入框 */}
                                <div className="flex-shrink-0 ml-2">
                                    {isCreatingFolder ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleCreateFolder();
                                                    } else if (e.key === 'Escape') {
                                                        setIsCreatingFolder(false);
                                                        setNewFolderName('');
                                                    }
                                                }}
                                                placeholder="文件夹名称"
                                                autoFocus
                                                className="w-32 px-2 py-1 text-sm border border-amber-300 rounded 
                                                         focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                                            />
                                            <button
                                                onClick={handleCreateFolder}
                                                className="px-2 py-1 text-xs text-white bg-amber-500 hover:bg-amber-600 rounded transition-colors"
                                            >
                                                创建
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsCreatingFolder(false);
                                                    setNewFolderName('');
                                                }}
                                                className="px-2 py-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsCreatingFolder(true)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 
                                                     hover:text-amber-800 hover:bg-amber-100 rounded transition-colors"
                                            title="在当前目录新建文件夹"
                                        >
                                            <FolderPlus size={14} />
                                            <span>新建目录</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 文件列表 */}
                        <div className="flex-1 overflow-hidden" key={refreshKey}>
                            <FileList
                                currentPath={currentPath}
                                selectedFiles={selectedFiles}
                                onSelectFile={handleSelectFile}
                                onConfirmFile={handleConfirmFile}
                                onEnterFolder={handleEnterFolder}
                                onDeleteFile={handleRefresh}
                                onRename={handleRename}
                                allowedTypes={allowedTypes}
                                multiple={multiple}
                                maxSelect={maxSelect}
                                disabledPaths={disabledPaths}
                            />
                        </div>

                        {/* 上传区域 */}
                        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
                            <FileUploader
                                currentPath={currentPath}
                                onUploadComplete={handleRefresh}
                                allowedTypes={allowedTypes}
                                showDropzone={true}
                            />
                        </div>
                    </div>
                </div>

                {/* 底部 */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50">
                    {/* 已选择文件 */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {selectedFiles.length > 0 ? (
                            <>
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                {multiple ? (
                                    <span className="text-sm text-slate-600 truncate">
                                        已选择 <span className="font-medium text-slate-800">{selectedFiles.length}</span> 个文件
                                        {maxSelect && (
                                            <span className="text-slate-400"> / {maxSelect}</span>
                                        )}
                                        {selectedFiles.length <= 3 && (
                                            <span className="text-slate-400 ml-2">
                                                ({selectedFiles.map(f => f.name).join(', ')})
                                            </span>
                                        )}
                                    </span>
                                ) : (
                                    <span className="text-sm text-slate-600 truncate">
                                        已选择: <span className="font-medium text-slate-800">{selectedFiles[0].name}</span>
                                        {selectedFiles[0].size && (
                                            <span className="text-xs text-slate-400 ml-1">
                                                ({formatSize(selectedFiles[0].size)})
                                            </span>
                                        )}
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="text-sm text-slate-400">
                                {multiple ? '请选择文件（可多选）' : '请选择一个文件'}
                            </span>
                        )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 
                                     hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedFiles.length === 0}
                            className={cn(
                                'px-5 py-2 text-sm font-medium rounded-lg transition-all',
                                selectedFiles.length > 0
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            )}
                        >
                            确定插入{multiple && selectedFiles.length > 0 ? ` (${selectedFiles.length})` : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// 格式化文件大小
function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default FileManagerDialog;
