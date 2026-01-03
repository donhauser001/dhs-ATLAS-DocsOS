/**
 * Files 组件 - 配置表单
 */

import { cn } from '@/lib/utils';
import { ConfiguratorProps, FilesComponentDefinition } from '../../types';
import { FILE_TYPE_PRESETS, FolderPicker } from '../../shared';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const filesData = formData as FilesComponentDefinition;

    return (
        <div className="space-y-4">
            {/* 上传目录 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">上传目录</label>
                <FolderPicker
                    value={filesData.directory}
                    onChange={(path) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            directory: path,
                        }))
                    }
                    placeholder="选择目录（默认根目录）"
                />
                <p className="text-xs text-slate-400 mt-1">指定文件上传到的目录</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">允许的文件类型</label>
                <div className="flex flex-wrap gap-2 mb-2">
                    {Object.entries(FILE_TYPE_PRESETS).map(([key, preset]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    accept: preset.extensions.length > 0 ? preset.extensions : undefined,
                                }))
                            }
                            className={cn(
                                'px-2 py-1 text-xs rounded-md border transition-colors',
                                JSON.stringify(filesData.accept || []) === JSON.stringify(preset.extensions)
                                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    value={(filesData.accept || []).join(', ')}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            accept: e.target.value
                                ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                : undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="如：.pdf, .doc, .docx（留空表示不限制）"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">最大文件数量</label>
                    <input
                        type="number"
                        value={filesData.maxCount || ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                maxCount: e.target.value ? parseInt(e.target.value) : undefined,
                            }))
                        }
                        min={1}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="不限制"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">单文件最大（MB）</label>
                    <input
                        type="number"
                        value={filesData.maxSize || ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                maxSize: e.target.value ? parseFloat(e.target.value) : undefined,
                            }))
                        }
                        min={0.1}
                        step={0.1}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="不限制"
                    />
                </div>
            </div>
        </div>
    );
}

export default Configurator;

