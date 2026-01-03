/**
 * Image 组件 - 数据块控件
 */

import { useState } from 'react';
import { Image as ImageIcon, X, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, ImageComponentDefinition } from '../../types';
import { FileManagerDialog } from '../../../FileManager';
import type { FileReference } from '../../../FileManager/types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const imageDef = component as ImageComponentDefinition;
    const [showFileManager, setShowFileManager] = useState(false);
    // 过滤掉 "null" 字符串（可能由错误数据产生）
    const imagePath = (typeof value === 'string' && value !== 'null') ? value : '';

    const handleSelect = (selected: FileReference | FileReference[]) => {
        const file = Array.isArray(selected) ? selected[0] : selected;
        if (file) {
            onChange(file.path);
        }
        setShowFileManager(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
    };

    return (
        <>
            <div
                onClick={() => !disabled && setShowFileManager(true)}
                className={cn(
                    'relative group cursor-pointer rounded-lg overflow-hidden border-2 border-dashed',
                    'border-slate-200 hover:border-slate-300 transition-colors',
                    disabled && 'cursor-not-allowed opacity-60'
                )}
            >
                {imagePath ? (
                    <div className="relative aspect-video">
                        <img
                            src={`/api/files/preview?path=${encodeURIComponent(imagePath)}`}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white
                                    opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <ImageIcon size={32} className="mb-2" />
                        <span className="text-sm">点击选择图片</span>
                        <FolderOpen size={14} className="mt-1" />
                    </div>
                )}
            </div>

            {showFileManager && (
                <FileManagerDialog
                    open={showFileManager}
                    onClose={() => setShowFileManager(false)}
                    onSelect={handleSelect}
                    allowedTypes={imageDef.accept}
                    initialPath={imageDef.directory || '/'}
                    restrictToPath={!!imageDef.directory}
                />
            )}
        </>
    );
}

export default Control;

