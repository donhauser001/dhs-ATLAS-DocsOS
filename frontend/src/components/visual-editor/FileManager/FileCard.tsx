/**
 * FileCard - 文件卡片组件
 * 
 * 用于在文档中渲染文件引用，支持预览、下载、替换
 */

import { useState } from 'react';
import {
    FileText,
    FileSpreadsheet,
    Image,
    Music,
    Video,
    Archive,
    File,
    Download,
    RefreshCw,
    Trash2,
    ExternalLink,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDownloadUrl, getPreviewUrl, formatFileSize, isImage, isVideo, isAudio } from '@/api/files';
import type { FileCardProps } from './types';

// 文件图标
function FileIcon({ extension, size = 24 }: { extension?: string; size?: number }) {
    const iconProps = { size, className: 'flex-shrink-0' };

    if (!extension) return <File {...iconProps} className="text-slate-400" />;

    const ext = extension.toLowerCase();

    if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
        return <FileText {...iconProps} className="text-blue-500" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return <FileSpreadsheet {...iconProps} className="text-emerald-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <Image {...iconProps} className="text-purple-500" />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return <Music {...iconProps} className="text-pink-500" />;
    }
    if (['mp4', 'webm', 'mov'].includes(ext)) {
        return <Video {...iconProps} className="text-red-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return <Archive {...iconProps} className="text-amber-500" />;
    }

    return <File {...iconProps} className="text-slate-400" />;
}

export function FileCard({
    file,
    readOnly = false,
    onReplace,
    onDelete,
}: FileCardProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [imageError, setImageError] = useState(false);

    const isImageFile = isImage(file.extension);
    const isVideoFile = isVideo(file.extension);
    const isAudioFile = isAudio(file.extension);

    // 下载
    const handleDownload = () => {
        window.open(getDownloadUrl(file.path), '_blank');
    };

    // 预览
    const handlePreview = () => {
        if (isImageFile) {
            setShowPreview(true);
        } else {
            // 对于其他类型，新窗口打开
            window.open(getPreviewUrl(file.path), '_blank');
        }
    };

    return (
        <>
            <div className={cn(
                'group relative rounded-xl border transition-all overflow-hidden',
                'bg-gradient-to-br from-white to-slate-50',
                'border-slate-200 hover:border-indigo-300 hover:shadow-md'
            )}>
                {/* 图片预览 */}
                {isImageFile && !imageError && (
                    <div
                        className="relative h-40 bg-slate-100 overflow-hidden cursor-pointer"
                        onClick={handlePreview}
                    >
                        <img
                            src={getPreviewUrl(file.path)}
                            alt={file.name}
                            className="w-full h-full object-contain"
                            onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors 
                                      flex items-center justify-center opacity-0 hover:opacity-100">
                            <Eye size={24} className="text-white drop-shadow-lg" />
                        </div>
                    </div>
                )}

                {/* 视频预览 */}
                {isVideoFile && (
                    <div className="relative h-40 bg-slate-900 overflow-hidden">
                        <video
                            src={getPreviewUrl(file.path)}
                            className="w-full h-full object-contain"
                            controls
                            preload="metadata"
                        />
                    </div>
                )}

                {/* 音频预览 */}
                {isAudioFile && (
                    <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50">
                        <audio
                            src={getPreviewUrl(file.path)}
                            className="w-full"
                            controls
                            preload="metadata"
                        />
                    </div>
                )}

                {/* 文件信息 */}
                <div className="p-4">
                    <div className="flex items-start gap-3">
                        {/* 图标 */}
                        <div className={cn(
                            'p-2 rounded-lg flex-shrink-0',
                            isImageFile ? 'bg-purple-100' :
                                isVideoFile ? 'bg-red-100' :
                                    isAudioFile ? 'bg-pink-100' :
                                        'bg-slate-100'
                        )}>
                            <FileIcon extension={file.extension} size={20} />
                        </div>

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 truncate" title={file.name}>
                                {file.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                {file.size && (
                                    <span>{formatFileSize(file.size)}</span>
                                )}
                                {file.extension && (
                                    <>
                                        <span>•</span>
                                        <span className="uppercase">{file.extension}</span>
                                    </>
                                )}
                            </div>
                            <p className="text-xs text-slate-400 mt-1 truncate" title={file.path}>
                                {file.path}
                            </p>
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
                        {/* 预览按钮（非图片类型） */}
                        {!isImageFile && !isVideoFile && !isAudioFile && (
                            <button
                                onClick={handlePreview}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 
                                         hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                                <ExternalLink size={12} />
                                预览
                            </button>
                        )}

                        {/* 下载 */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 
                                     hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                            <Download size={12} />
                            下载
                        </button>

                        {/* 替换（非只读） */}
                        {!readOnly && onReplace && (
                            <button
                                onClick={onReplace}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 
                                         hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            >
                                <RefreshCw size={12} />
                                替换
                            </button>
                        )}

                        {/* 删除（非只读） */}
                        {!readOnly && onDelete && (
                            <button
                                onClick={onDelete}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 
                                         hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-auto"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 图片预览弹窗 */}
            {showPreview && isImageFile && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={() => setShowPreview(false)}
                >
                    <img
                        src={getPreviewUrl(file.path)}
                        alt={file.name}
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={() => setShowPreview(false)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 
                                 rounded-full transition-colors"
                    >
                        <span className="text-white text-2xl">&times;</span>
                    </button>
                </div>
            )}
        </>
    );
}

export default FileCard;

