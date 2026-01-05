/**
 * Progress 组件 - 配置表单
 */

import { ConfiguratorProps, ProgressComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const progressData = formData as ProgressComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    选项
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={progressData.editable === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    editable: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">允许编辑（显示滑块）</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={progressData.showLabel !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showLabel: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示百分比</span>
                    </label>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    进度条颜色
                </label>
                <input
                    type="color"
                    value={progressData.color || '#8b5cf6'}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            color: e.target.value,
                        }))
                    }
                    className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    高度 (px)
                </label>
                <input
                    type="number"
                    value={progressData.height || 8}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            height: parseInt(e.target.value) || 8,
                        }))
                    }
                    min={4}
                    max={24}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
            </div>
        </div>
    );
}

export default Configurator;


