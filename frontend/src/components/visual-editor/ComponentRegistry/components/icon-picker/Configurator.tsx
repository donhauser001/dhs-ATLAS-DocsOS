/**
 * IconPicker 组件 - 配置表单
 */

import { ConfiguratorProps, IconPickerComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const iconData = formData as IconPickerComponentDefinition;

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
                            checked={iconData.searchable !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    searchable: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">启用搜索</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={iconData.showLabel === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showLabel: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示图标名称</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;

