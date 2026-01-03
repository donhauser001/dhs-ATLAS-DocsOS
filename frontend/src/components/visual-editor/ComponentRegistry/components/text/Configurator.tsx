/**
 * Text 组件 - 配置表单
 */

import { ConfiguratorProps, TextComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const textData = formData as TextComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={textData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="请输入..."
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">最大长度（可选）</label>
                <input
                    type="number"
                    value={textData.maxLength || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                    }
                    min={1}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="不限制"
                />
            </div>
        </div>
    );
}

export default Configurator;

