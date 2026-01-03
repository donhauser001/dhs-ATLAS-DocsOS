/**
 * Checkbox 组件 - 配置表单
 */

import { AlertCircle } from 'lucide-react';
import { ConfiguratorProps, SelectComponentDefinition } from '../../types';
import { OptionEditor } from '../../shared';

export function Configurator({ formData, errors, onUpdateFormData }: ConfiguratorProps) {
    const selectData = formData as SelectComponentDefinition;

    return (
        <>
            <OptionEditor
                options={selectData.options || []}
                onChange={(options) =>
                    onUpdateFormData((prev) => ({ ...prev, options } as SelectComponentDefinition))
                }
            />
            {errors.options && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle size={12} />
                    {errors.options}
                </p>
            )}
            <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最大选择数（可选）
                </label>
                <input
                    type="number"
                    value={selectData.maxSelect || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            maxSelect: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                    }
                    min={1}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
                    placeholder="不限制"
                />
            </div>
        </>
    );
}

export default Configurator;

