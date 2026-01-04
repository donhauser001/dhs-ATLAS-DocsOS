/**
 * FileList 组件 - 数据块控件
 * 纯展示型文件列表，支持下载和删除
 */

import { useMemo } from 'react';
import {
    FileText,
    FileImage,
    FileVideo,
    FileAudio,
    FileArchive,
    File,
    Download,
    Trash2,
    ExternalLink,
    LayoutGrid,
    List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, FileListComponentDefinition } from '../../types';

interface FileItem {
    name: string;
    path: string;
    size?: number;
    type?: string;
}

// 根据文件类型获取图标
function getFileIcon(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return FileImage;
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
        return FileVideo;
    }
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
        return FileAudio;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return FileArchive;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
        return FileText;
    }
    return File;
}

// 格式化文件大小
function formatSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const fileListDef = component as FileListComponentDefinition;
    
    // 解析文件列表
    const files: FileItem[] = useMemo(() => {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.map((item) => {
                if (typeof item === 'string') {
                    return { name: item.split('/').pop() || item, path: item };
                }
                return item as FileItem;
            });
        }
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => {
                        if (typeof item === 'string') {
                            return { name: item.split('/').pop() || item, path: item };
                        }
                        return item as FileItem;
                    });
                }
            } catch {
                // 单个路径
                return [{ name: value.split('/').pop() || value, path: value }];
            }
        }
        return [];
    }, [value]);

    const handleDownload = (file: FileItem) => {
        // TODO: 实现真实下载逻辑
        window.open(`/api/files/download?path=${encodeURIComponent(file.path)}`, '_blank');
    };

    const handleDelete = (file: FileItem) => {
        if (!fileListDef.allowDelete) return;
        const newFiles = files.filter((f) => f.path !== file.path);
        onChange(newFiles.length > 0 ? JSON.stringify(newFiles) : null);
    };

    const handleOpen = (file: FileItem) => {
        window.open(`/api/files/preview?path=${encodeURIComponent(file.path)}`, '_blank');
    };

    if (files.length === 0) {
        return (
            <div className="text-sm text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-lg">
                暂无文件
            </div>
        );
    }

    // 网格模式
    if (fileListDef.displayMode === 'grid') {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((file, index) => {
                    const IconComponent = getFileIcon(file.name);
                    return (
                        <div
                            key={index}
                            className="group relative p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <IconComponent className="h-10 w-10 text-slate-400" />
                                <span className="text-xs text-slate-600 text-center line-clamp-2" title={file.name}>
                                    {file.name}
                                </span>
                                {file.size && (
                                    <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                                )}
                            </div>
                            
                            {/* 悬浮操作按钮 */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {fileListDef.allowDownload && (
                                    <button
                                        onClick={() => handleDownload(file)}
                                        className="p-1 bg-white rounded shadow hover:bg-purple-50"
                                        title="下载"
                                    >
                                        <Download className="h-3 w-3 text-purple-500" />
                                    </button>
                                )}
                                {fileListDef.allowDelete && !disabled && (
                                    <button
                                        onClick={() => handleDelete(file)}
                                        className="p-1 bg-white rounded shadow hover:bg-red-50"
                                        title="删除"
                                    >
                                        <Trash2 className="h-3 w-3 text-red-500" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 列表模式（默认）
    return (
        <div className="space-y-2">
            {files.map((file, index) => {
                const IconComponent = getFileIcon(file.name);
                return (
                    <div
                        key={index}
                        className={cn(
                            'group flex items-center gap-3 p-2 rounded-lg',
                            'bg-slate-50 hover:bg-slate-100 transition-colors'
                        )}
                    >
                        <IconComponent className="h-5 w-5 text-slate-400 shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-700 truncate" title={file.name}>
                                {file.name}
                            </div>
                            {file.size && (
                                <div className="text-xs text-slate-400">{formatSize(file.size)}</div>
                            )}
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleOpen(file)}
                                className="p-1.5 hover:bg-slate-200 rounded"
                                title="预览"
                            >
                                <ExternalLink className="h-4 w-4 text-slate-500" />
                            </button>
                            {fileListDef.allowDownload && (
                                <button
                                    onClick={() => handleDownload(file)}
                                    className="p-1.5 hover:bg-purple-100 rounded"
                                    title="下载"
                                >
                                    <Download className="h-4 w-4 text-purple-500" />
                                </button>
                            )}
                            {fileListDef.allowDelete && !disabled && (
                                <button
                                    onClick={() => handleDelete(file)}
                                    className="p-1.5 hover:bg-red-100 rounded"
                                    title="删除"
                                >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default Control;

