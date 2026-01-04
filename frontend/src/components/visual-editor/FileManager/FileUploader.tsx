/**
 * FileUploader - 文件上传组件
 * 
 * 支持拖拽上传、多文件上传、进度显示
 */

import { useState, useCallback, useRef } from 'react';
import {
    Upload,
    X,
    CheckCircle2,
    AlertCircle,
    Loader2,
    FileUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/api/files';
import type { FileUploaderProps, UploadProgress } from './types';

export function FileUploader({
    currentPath,
    onUploadComplete,
    allowedTypes,
    showDropzone = true,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploads, setUploads] = useState<UploadProgress[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件上传
    const handleUpload = useCallback(async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;

        // 过滤文件类型（兼容带点号和不带点号的格式）
        const validFiles = allowedTypes && allowedTypes.length > 0
            ? fileArray.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                if (!ext) return false;
                // 同时检查带点号和不带点号的格式
                return allowedTypes.some(t => {
                    const normalizedType = t.startsWith('.') ? t.slice(1).toLowerCase() : t.toLowerCase();
                    return ext === normalizedType;
                });
            })
            : fileArray;

        if (validFiles.length === 0) {
            alert('没有可上传的文件（文件类型不支持）');
            return;
        }

        // 初始化进度
        const initialProgress: UploadProgress[] = validFiles.map(f => ({
            fileName: f.name,
            progress: 0,
            status: 'pending',
        }));
        setUploads(prev => [...prev, ...initialProgress]);

        // 逐个上传
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const uploadIndex = uploads.length + i;

            setUploads(prev => prev.map((u, idx) =>
                idx === uploadIndex ? { ...u, status: 'uploading' } : u
            ));

            try {
                await uploadFile(file, currentPath, (progress) => {
                    setUploads(prev => prev.map((u, idx) =>
                        idx === uploadIndex ? { ...u, progress } : u
                    ));
                });

                setUploads(prev => prev.map((u, idx) =>
                    idx === uploadIndex ? { ...u, status: 'success', progress: 100 } : u
                ));
            } catch (err) {
                setUploads(prev => prev.map((u, idx) =>
                    idx === uploadIndex ? {
                        ...u,
                        status: 'error',
                        error: err instanceof Error ? err.message : '上传失败'
                    } : u
                ));
            }
        }

        onUploadComplete();

        // 3秒后清理成功的上传
        setTimeout(() => {
            setUploads(prev => prev.filter(u => u.status !== 'success'));
        }, 3000);
    }, [currentPath, allowedTypes, onUploadComplete, uploads.length]);

    // 拖拽事件
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    }, [handleUpload]);

    // 选择文件
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUpload(e.target.files);
            e.target.value = ''; // 重置 input
        }
    }, [handleUpload]);

    // 清除上传项
    const handleRemoveUpload = useCallback((index: number) => {
        setUploads(prev => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <div className="space-y-3">
            {/* 上传按钮/拖拽区域 */}
            {showDropzone && (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        'relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer',
                        'hover:border-indigo-400 hover:bg-indigo-50/50',
                        isDragging
                            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
                            : 'border-slate-200 bg-slate-50/50'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept={allowedTypes?.map(t => `.${t}`).join(',')}
                    />

                    <div className={cn(
                        'flex flex-col items-center gap-2 transition-transform',
                        isDragging && 'scale-105'
                    )}>
                        <div className={cn(
                            'p-3 rounded-full transition-colors',
                            isDragging ? 'bg-indigo-100' : 'bg-slate-100'
                        )}>
                            <FileUp
                                size={24}
                                className={cn(
                                    'transition-colors',
                                    isDragging ? 'text-indigo-600' : 'text-slate-400'
                                )}
                            />
                        </div>
                        <div>
                            <p className={cn(
                                'text-sm font-medium transition-colors',
                                isDragging ? 'text-indigo-700' : 'text-slate-600'
                            )}>
                                {isDragging ? '释放以上传' : '拖拽文件到此处'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                或 <span className="text-indigo-500 hover:underline">点击选择文件</span>
                            </p>
                        </div>
                    </div>

                    {/* 允许的类型提示 */}
                    {allowedTypes && allowedTypes.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-3">
                            支持: {allowedTypes.join(', ')}
                        </p>
                    )}
                </div>
            )}

            {/* 紧凑上传按钮 */}
            {!showDropzone && (
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 
                             bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                    <Upload size={16} />
                    上传文件
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept={allowedTypes?.map(t => `.${t}`).join(',')}
                    />
                </button>
            )}

            {/* 上传进度列表 */}
            {uploads.length > 0 && (
                <div className="space-y-2">
                    {uploads.map((upload, index) => (
                        <div
                            key={`${upload.fileName}-${index}`}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm',
                                upload.status === 'success' && 'bg-emerald-50',
                                upload.status === 'error' && 'bg-red-50',
                                upload.status === 'uploading' && 'bg-indigo-50',
                                upload.status === 'pending' && 'bg-slate-50'
                            )}
                        >
                            {/* 状态图标 */}
                            {upload.status === 'success' && (
                                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                            )}
                            {upload.status === 'error' && (
                                <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                            )}
                            {upload.status === 'uploading' && (
                                <Loader2 size={16} className="text-indigo-500 animate-spin flex-shrink-0" />
                            )}
                            {upload.status === 'pending' && (
                                <div className="w-4 h-4 rounded-full bg-slate-300 flex-shrink-0" />
                            )}

                            {/* 文件名 */}
                            <span className={cn(
                                'flex-1 truncate',
                                upload.status === 'error' && 'text-red-700',
                                upload.status === 'success' && 'text-emerald-700'
                            )}>
                                {upload.fileName}
                            </span>

                            {/* 进度/错误信息 */}
                            {upload.status === 'uploading' && (
                                <span className="text-xs text-indigo-600 font-medium">
                                    {upload.progress}%
                                </span>
                            )}
                            {upload.status === 'error' && upload.error && (
                                <span className="text-xs text-red-500">
                                    {upload.error}
                                </span>
                            )}

                            {/* 关闭按钮 */}
                            {(upload.status === 'success' || upload.status === 'error') && (
                                <button
                                    onClick={() => handleRemoveUpload(index)}
                                    className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                                >
                                    <X size={14} className="text-slate-400" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FileUploader;

