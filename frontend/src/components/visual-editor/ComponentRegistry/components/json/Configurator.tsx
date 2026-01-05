/**
 * JSON 组件 - 配置表单
 */

import { ConfiguratorProps, JsonComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const jsonData = formData as JsonComponentDefinition;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        最小高度 (px)
                    </label>
                    <input
                        type="number"
                        value={jsonData.minHeight || 150}
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
                        value={jsonData.maxHeight || 400}
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

            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={jsonData.readOnly === true}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                readOnly: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">只读模式</span>
                </label>
            </div>
        </div>
    );
}

export default Configurator;


