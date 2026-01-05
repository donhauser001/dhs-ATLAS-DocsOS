/**
 * Formula 组件 - 配置表单
 */

import { ConfiguratorProps, FormulaComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const formulaData = formData as FormulaComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    公式
                </label>
                <textarea
                    value={formulaData.formula || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            formula: e.target.value,
                        }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg font-mono
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="sqrt(a^2 + b^2)"
                />
                <p className="mt-1 text-xs text-slate-500">
                    支持 mathjs 语法：sqrt, sin, cos, log, pow 等
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    错误时的默认值
                </label>
                <input
                    type="text"
                    value={formulaData.errorValue || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            errorValue: e.target.value,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="N/A"
                />
            </div>
        </div>
    );
}

export default Configurator;


