/**
 * RelationPicker 组件 - 配置表单
 */

import { ConfiguratorProps, RelationPickerComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const relationData = formData as RelationPickerComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    关联索引
                </label>
                <input
                    type="text"
                    value={relationData.index || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            index: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="如: clients, projects"
                />
                <p className="mt-1 text-xs text-slate-500">
                    指定要关联的数据索引名称
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    显示字段
                </label>
                <input
                    type="text"
                    value={relationData.displayField || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            displayField: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="name"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    选项
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={relationData.multiple === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    multiple: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">允许多选</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={relationData.showDetails === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showDetails: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示详情</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;


