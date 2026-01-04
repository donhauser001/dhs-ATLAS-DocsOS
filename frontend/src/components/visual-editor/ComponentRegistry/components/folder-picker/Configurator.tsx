/**
 * FolderPicker 组件 - 配置表单
 */

import { ConfiguratorProps, FolderPickerComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const folderData = formData as FolderPickerComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={folderData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="点击选择目录..."
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="multiple"
                    checked={folderData.multiple !== false}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            multiple: e.target.checked,
                        }))
                    }
                    className="w-4 h-4 text-purple-500 rounded border-slate-300 
                        focus:ring-purple-400/50"
                />
                <label htmlFor="multiple" className="text-sm text-slate-700">
                    允许多选
                </label>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    根目录限制（可选）
                </label>
                <input
                    type="text"
                    value={folderData.rootPath || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            rootPath: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="例如: /projects"
                />
                <p className="mt-1 text-xs text-slate-500">限制用户只能在指定目录下选择</p>
            </div>
        </div>
    );
}

export default Configurator;

