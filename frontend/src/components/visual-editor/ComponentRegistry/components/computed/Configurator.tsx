/**
 * Computed 组件 - 配置表单
 */

import { ConfiguratorProps, ComputedComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const computedData = formData as ComputedComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    计算表达式
                </label>
                <input
                    type="text"
                    value={computedData.expression || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            expression: e.target.value,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="{price} * {quantity}"
                />
                <p className="mt-1 text-xs text-slate-500">
                    使用 {'{字段ID}'} 引用其他字段，如: {'{price}'} * {'{quantity}'}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    依赖字段
                </label>
                <input
                    type="text"
                    value={computedData.dependencies?.join(', ') || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            dependencies: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="price, quantity"
                />
                <p className="mt-1 text-xs text-slate-500">
                    多个字段用逗号分隔
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    小数位数
                </label>
                <input
                    type="number"
                    value={computedData.decimals || 2}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            decimals: parseInt(e.target.value) || 2,
                        }))
                    }
                    min={0}
                    max={10}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
            </div>
        </div>
    );
}

export default Configurator;


