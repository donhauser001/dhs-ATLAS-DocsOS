/**
 * Toggle 组件 - 配置表单
 */

import { ConfiguratorProps, ToggleComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const toggleData = formData as ToggleComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">开启时文案</label>
                <input
                    type="text"
                    value={toggleData.onLabel || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            onLabel: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="开启"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">关闭时文案</label>
                <input
                    type="text"
                    value={toggleData.offLabel || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            offLabel: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="关闭"
                />
            </div>
        </div>
    );
}

export default Configurator;

