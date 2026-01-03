/**
 * Files 组件 - 数据块控件（卡片式布局）
 */

import { useState } from 'react';
import { 
    File, 
    FileText, 
    FileSpreadsheet, 
    Image as ImageIcon, 
    Music, 
    Video, 
    Archive,
    X, 
    Plus,
    Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, FilesComponentDefinition } from '../../types';
import { FileManagerDialog } from '../../../FileManager';
import type { FileReference } from '../../../FileManager/types';

// 获取文件扩展名
function getExtension(path: string): string {
    const name = path.split('/').pop() || '';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

// 判断是否为图片文件
function isImageFile(ext: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext);
}

// 文件类型图标组件
function FileTypeIcon({ extension, size = 32 }: { extension: string; size?: number }) {
    const iconProps = { size, strokeWidth: 1.5 };
    const ext = extension.toLowerCase();

    // 文档类
    if (['pdf'].includes(ext)) {
        return <FileText {...iconProps} className="text-red-500" />;
    }
    if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
        return <FileText {...iconProps} className="text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet {...iconProps} className="text-emerald-500" />;
    }
    // 图片（这里返回图标，虽然通常会显示预览）
    if (isImageFile(ext)) {
        return <ImageIcon {...iconProps} className="text-purple-500" />;
    }
    // 音频
    if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
        return <Music {...iconProps} className="text-pink-500" />;
    }
    // 视频
    if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
        return <Video {...iconProps} className="text-rose-500" />;
    }
    // 压缩包
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <Archive {...iconProps} className="text-amber-500" />;
    }
    // 默认文件图标
    return <File {...iconProps} className="text-slate-400" />;
}

// 文件卡片组件
function FileCard({ 
    filePath, 
    onRemove, 
    disabled 
}: { 
    filePath: string; 
    onRemove: (e: React.MouseEvent) => void; 
    disabled?: boolean;
}) {
    const [imgError, setImgError] = useState(false);
    const fileName = filePath.split('/').pop() || '';
    const extension = getExtension(filePath);
    const isImage = isImageFile(extension);

    return (
        <div className="group relative">
            {/* 卡片主体 */}
            <div className={cn(
                'relative aspect-square rounded-lg overflow-hidden',
                'border border-slate-200',
                'transition-all duration-200',
                'hover:border-slate-300 hover:shadow-md',
                // 图片使用棋盘格背景，便于看到透明图片
                isImage && !imgError 
                    ? 'bg-[length:16px_16px] bg-[linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%),linear-gradient(45deg,#f1f5f9_25%,transparent_25%,transparent_75%,#f1f5f9_75%)] bg-[position:0_0,8px_8px] bg-white'
                    : 'bg-slate-50'
            )}>
                {isImage && !imgError ? (
                    // 图片预览
                    <img
                        src={`/api/files/preview?path=${encodeURIComponent(filePath)}`}
                        alt={fileName}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    // 文件类型图标 - 使用更大的尺寸
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
                        <FileTypeIcon extension={extension} size={48} />
                        <span className="mt-2 text-sm font-medium text-slate-400 uppercase">
                            {extension || 'FILE'}
                        </span>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className={cn(
                    'absolute top-1.5 right-1.5 flex gap-1',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-200'
                )}>
                    {/* 下载按钮 */}
                    <a
                        href={`/api/files/download?path=${encodeURIComponent(filePath)}`}
                        download={fileName}
                        onClick={(e) => e.stopPropagation()}
                        className={cn(
                            'p-1 rounded-full',
                            'bg-black/50 text-white',
                            'hover:bg-indigo-500 transition-all duration-200',
                            'backdrop-blur-sm'
                        )}
                        title="下载文件"
                    >
                        <Download size={12} />
                    </a>
                    
                    {/* 删除按钮 */}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className={cn(
                                'p-1 rounded-full',
                                'bg-black/50 text-white',
                                'hover:bg-red-500 transition-all duration-200',
                                'backdrop-blur-sm'
                            )}
                            title="移除文件"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* 文件名 */}
            <p className="mt-1.5 text-xs text-slate-600 truncate text-center" title={fileName}>
                {fileName}
            </p>
        </div>
    );
}

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const filesDef = component as FilesComponentDefinition;
    const [showFileManager, setShowFileManager] = useState(false);
    // 过滤掉 null/undefined/空字符串，避免显示 "null"
    const files: string[] = (Array.isArray(value) ? value : (value ? [String(value)] : []))
        .filter((f): f is string => typeof f === 'string' && f !== '' && f !== 'null');

    // 计算还能选择多少个文件
    const remainingSlots = filesDef.maxCount ? filesDef.maxCount - files.length : undefined;
    const canAddMore = !filesDef.maxCount || files.length < filesDef.maxCount;

    const handleSelect = (selected: FileReference | FileReference[]) => {
        const selectedFiles = Array.isArray(selected) ? selected : [selected];
        // 过滤掉已存在的文件（去重）
        const newPaths = selectedFiles
            .map(f => f.path)
            .filter(path => !files.includes(path));
        if (newPaths.length > 0) {
            const newFiles = [...files, ...newPaths];
            onChange(newFiles);
        }
        setShowFileManager(false);
    };

    const handleRemove = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newFiles = files.filter((_, i) => i !== index);
        onChange(newFiles.length > 0 ? newFiles : null);
    };

    return (
        <>
            <div className="grid grid-cols-6 gap-2">
                {/* 文件卡片列表 */}
                {files.map((filePath, index) => (
                    <FileCard
                        key={index}
                        filePath={filePath}
                        onRemove={(e) => handleRemove(index, e)}
                        disabled={disabled}
                    />
                ))}

                {/* 添加按钮 */}
                {canAddMore && !disabled && (
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowFileManager(true)}
                            className={cn(
                                'w-full aspect-square flex flex-col items-center justify-center',
                                'border-2 border-dashed border-slate-200 rounded-lg',
                                'text-slate-400 bg-slate-50/50',
                                'hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50',
                                'transition-all duration-200'
                            )}
                        >
                            <Plus size={24} strokeWidth={1.5} />
                            <span className="text-xs mt-1">添加</span>
                        </button>
                        {filesDef.maxCount && (
                            <p className="mt-1 text-xs text-slate-400 text-center">
                                {files.length}/{filesDef.maxCount}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* 空状态 */}
            {files.length === 0 && disabled && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    <File size={32} className="mb-2" />
                    <span className="text-sm">暂无文件</span>
                </div>
            )}

            {showFileManager && (
                <FileManagerDialog
                    open={showFileManager}
                    onClose={() => setShowFileManager(false)}
                    onSelect={handleSelect}
                    allowedTypes={filesDef.accept}
                    initialPath={filesDef.directory || '/'}
                    restrictToPath={!!filesDef.directory}
                    multiple={true}
                    maxSelect={remainingSlots}
                    disabledPaths={files}
                />
            )}
        </>
    );
}

export default Control;

