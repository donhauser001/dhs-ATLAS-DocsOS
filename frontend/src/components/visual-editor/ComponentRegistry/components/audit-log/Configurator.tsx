/**
 * AuditLog 组件 - 配置表单
 */

import { ConfiguratorProps, AuditLogComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const auditData = formData as AuditLogComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    显示数量
                </label>
                <input
                    type="number"
                    value={auditData.limit || 10}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            limit: parseInt(e.target.value) || 10,
                        }))
                    }
                    min={1}
                    max={50}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    显示选项
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={auditData.showUser !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showUser: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示操作用户</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={auditData.showDiff === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showDiff: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示变更差异</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;


