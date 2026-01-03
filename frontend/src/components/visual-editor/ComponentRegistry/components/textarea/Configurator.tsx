/**
 * Textarea 组件 - 配置表单
 */

import { ConfiguratorProps, TextareaComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const textareaData = formData as TextareaComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={textareaData.placeholder || ''}
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
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">行数</label>
                    <input
                        type="number"
                        value={textareaData.rows || 3}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                rows: parseInt(e.target.value) || 3,
                            }))
                        }
                        min={1}
                        max={20}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">最大长度</label>
                    <input
                        type="number"
                        value={textareaData.maxLength || ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                            }))
                        }
                        min={1}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="不限"
                    />
                </div>
            </div>
        </div>
    );
}

export default Configurator;

