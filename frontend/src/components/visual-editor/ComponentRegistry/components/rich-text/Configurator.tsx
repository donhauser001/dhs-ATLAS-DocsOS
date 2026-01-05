/**
 * RichText 组件 - 配置表单
 */

import { ConfiguratorProps, RichTextComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const richTextData = formData as RichTextComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    占位文本
                </label>
                <input
                    type="text"
                    value={richTextData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="输入内容..."
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        最小高度 (px)
                    </label>
                    <input
                        type="number"
                        value={richTextData.minHeight || 150}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                minHeight: parseInt(e.target.value) || 150,
                            }))
                        }
                        min={100}
                        max={500}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        最大高度 (px)
                    </label>
                    <input
                        type="number"
                        value={richTextData.maxHeight || 400}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                maxHeight: parseInt(e.target.value) || 400,
                            }))
                        }
                        min={200}
                        max={800}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            </div>
        </div>
    );
}

export default Configurator;

