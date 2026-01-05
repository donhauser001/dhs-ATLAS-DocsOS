/**
 * LoginStats 组件 - 配置表单
 */

import { ConfiguratorProps, LoginStatsComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const statsData = formData as LoginStatsComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    关联用户ID字段
                </label>
                <input
                    type="text"
                    value={statsData.userIdField || ''}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            userIdField: e.target.value || undefined,
                        }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="user_id"
                />
                <p className="mt-1 text-xs text-slate-500">
                    指定关联的用户ID字段名称
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    显示内容
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={statsData.showLastLogin !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showLastLogin: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">最后登录时间</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={statsData.showLoginCount === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showLoginCount: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">登录次数</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={statsData.showDevice === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showDevice: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">设备信息</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={statsData.showIp === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showIp: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">IP地址</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;

