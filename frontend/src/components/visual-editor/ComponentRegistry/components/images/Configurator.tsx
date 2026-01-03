/**
 * Images 组件 - 配置表单
 */

import { ConfiguratorProps, ImagesComponentDefinition } from '../../types';
import { IMAGE_EXTENSIONS, FolderPicker } from '../../shared';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const imagesData = formData as ImagesComponentDefinition;

    return (
        <div className="space-y-4">
            {/* 上传目录 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">上传目录</label>
                <FolderPicker
                    value={imagesData.directory}
                    onChange={(path) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            directory: path,
                        }))
                    }
                    placeholder="选择目录（默认根目录）"
                />
                <p className="text-xs text-slate-400 mt-1">指定图片上传到的目录</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">允许的图片格式</label>
                <input
                    type="text"
                    value={(imagesData.accept || IMAGE_EXTENSIONS).join(', ')}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            accept: e.target.value
                                ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                                : IMAGE_EXTENSIONS,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder=".jpg, .jpeg, .png, .gif, .webp, .svg"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">最大图片数量</label>
                    <input
                        type="number"
                        value={imagesData.maxCount || ''}
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
                    <label className="block text-sm font-medium text-slate-700 mb-1">单图最大（MB）</label>
                    <input
                        type="number"
                        value={imagesData.maxSize || ''}
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

