/**
 * Rating 组件 - 配置表单
 */

import { ConfiguratorProps, RatingComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const ratingData = formData as RatingComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最大评分
                </label>
                <input
                    type="number"
                    value={ratingData.max || 5}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            max: parseInt(e.target.value) || 5,
                        }))
                    }
                    min={1}
                    max={10}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                />
            </div>
            <div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={ratingData.allowHalf || false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                allowHalf: e.target.checked,
                            }))
                        }
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    允许半星
                </label>
            </div>
        </div>
    );
}

export default Configurator;

