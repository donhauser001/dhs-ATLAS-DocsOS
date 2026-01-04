/**
 * Email 组件 - 配置表单
 */

import { ConfiguratorProps, EmailComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const emailData = formData as EmailComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">占位文本</label>
                <input
                    type="text"
                    value={emailData.placeholder || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            placeholder: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="请输入邮箱地址"
                />
            </div>
        </div>
    );
}

export default Configurator;

