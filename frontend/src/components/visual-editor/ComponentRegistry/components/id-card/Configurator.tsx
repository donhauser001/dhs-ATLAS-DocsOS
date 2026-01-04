/**
 * IdCard 组件 - 配置表单
 */

import { ConfiguratorProps, IdCardComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const idCardData = formData as IdCardComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={idCardData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="请输入身份证号"
                />
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="masked"
                    checked={idCardData.masked !== false}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            masked: e.target.checked,
                        }))
                    }
                    className="w-4 h-4 text-purple-500 rounded border-slate-300 
                        focus:ring-purple-400/50"
                />
                <label htmlFor="masked" className="text-sm text-slate-700">
                    隐私保护（遮罩中间数字）
                </label>
            </div>
        </div>
    );
}

export default Configurator;

