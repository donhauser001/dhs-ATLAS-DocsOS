/**
 * Number 组件 - 配置表单
 */

import { ConfiguratorProps, NumberComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const numberData = formData as NumberComponentDefinition;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">最小值</label>
                    <input
                        type="number"
                        value={numberData.min ?? ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                min: e.target.value ? parseFloat(e.target.value) : undefined,
                            }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="无"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">最大值</label>
                    <input
                        type="number"
                        value={numberData.max ?? ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                max: e.target.value ? parseFloat(e.target.value) : undefined,
                            }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="无"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">步进</label>
                    <input
                        type="number"
                        value={numberData.step ?? 1}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                step: parseFloat(e.target.value) || 1,
                            }))
                        }
                        min={0.01}
                        step={0.01}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">单位（可选）</label>
                <input
                    type="text"
                    value={numberData.unit || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            unit: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="如：元、个、%"
                />
            </div>
        </div>
    );
}

export default Configurator;

