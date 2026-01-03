/**
 * Images 组件 - 数据块控件
 */

import { useState } from 'react';
import { Image as ImageIcon, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, ImagesComponentDefinition } from '../../types';
import { FileManagerDialog } from '../../../FileManager';
import type { FileReference } from '../../../FileManager/types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const imagesDef = component as ImagesComponentDefinition;
    const [showFileManager, setShowFileManager] = useState(false);
    // 过滤掉 null/undefined/空字符串，避免显示 "null"
    const images: string[] = (Array.isArray(value) ? value : (value ? [String(value)] : []))
        .filter((f): f is string => typeof f === 'string' && f !== '' && f !== 'null');

    // 计算还能选择多少个文件
    const remainingSlots = imagesDef.maxCount ? imagesDef.maxCount - images.length : undefined;
    const canAddMore = !imagesDef.maxCount || images.length < imagesDef.maxCount;

    const handleSelect = (selected: FileReference | FileReference[]) => {
        const selectedFiles = Array.isArray(selected) ? selected : [selected];
        // 过滤掉已存在的图片（去重）
        const newPaths = selectedFiles
            .map(f => f.path)
            .filter(path => !images.includes(path));
        if (newPaths.length > 0) {
            const newImages = [...images, ...newPaths];
            onChange(newImages);
        }
        setShowFileManager(false);
    };

    const handleRemove = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newImages = images.filter((_, i) => i !== index);
        onChange(newImages.length > 0 ? newImages : null);
    };

    return (
        <>
            <div className="grid grid-cols-3 gap-2">
                {images.map((imagePath, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                        <img
                            src={`/api/files/preview?path=${encodeURIComponent(imagePath)}`}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={(e) => handleRemove(index, e)}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white
                                    opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                ))}

                {canAddMore && !disabled && (
                    <button
                        type="button"
                        onClick={() => setShowFileManager(true)}
                        className={cn(
                            'aspect-square flex flex-col items-center justify-center',
                            'border-2 border-dashed border-slate-200 rounded-lg',
                            'text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors'
                        )}
                    >
                        <Plus size={20} />
                        <span className="text-xs mt-1">
                            添加
                            {imagesDef.maxCount && (
                                <span className="block text-[10px]">
                                    {images.length}/{imagesDef.maxCount}
                                </span>
                            )}
                        </span>
                    </button>
                )}
            </div>

            {images.length === 0 && disabled && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                    <ImageIcon size={32} className="mb-2" />
                    <span className="text-sm">暂无图片</span>
                </div>
            )}

            {showFileManager && (
                <FileManagerDialog
                    open={showFileManager}
                    onClose={() => setShowFileManager(false)}
                    onSelect={handleSelect}
                    allowedTypes={imagesDef.accept}
                    initialPath={imagesDef.directory || '/'}
                    restrictToPath={!!imagesDef.directory}
                    multiple={true}
                    maxSelect={remainingSlots}
                    disabledPaths={images}
                />
            )}
        </>
    );
}

export default Control;

