/**
 * File 组件 - 数据块控件
 */

import { useState } from 'react';
import { File, X, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ControlProps, FileComponentDefinition } from '../../types';
import { FileManagerDialog } from '../../../FileManager';
import type { FileReference } from '../../../FileManager/types';

export function Control({ component, value, onChange, disabled }: ControlProps) {
    const fileDef = component as FileComponentDefinition;
    const [showFileManager, setShowFileManager] = useState(false);
    // 过滤掉 "null" 字符串（可能由错误数据产生）
    const filePath = (typeof value === 'string' && value !== 'null') ? value : '';
    const fileName = filePath ? filePath.split('/').pop() : '';

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
                    'w-full flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer',
                    'hover:border-slate-300 transition-colors',
                    disabled && 'bg-slate-50 cursor-not-allowed opacity-60'
                )}
            >
                <File size={16} className="text-slate-400 flex-shrink-0" />
                {fileName ? (
                    <>
                        <span className="flex-1 text-sm text-slate-700 truncate">{fileName}</span>
                        {!disabled && (
                            <X
                                size={14}
                                className="text-slate-400 hover:text-red-500 cursor-pointer"
                                onClick={handleClear}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <span className="flex-1 text-sm text-slate-400">选择文件...</span>
                        <FolderOpen size={14} className="text-slate-400" />
                    </>
                )}
            </div>

            {showFileManager && (
                <FileManagerDialog
                    open={showFileManager}
                    onClose={() => setShowFileManager(false)}
                    onSelect={handleSelect}
                    allowedTypes={fileDef.accept}
                    initialPath={fileDef.directory || '/'}
                    restrictToPath={!!fileDef.directory}
                />
            )}
        </>
    );
}

export default Control;

