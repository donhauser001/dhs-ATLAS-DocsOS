/**
 * User Auth 组件 - 配置表单
 * 
 * Phase 4.2: 用户认证字段组配置
 */

import { ConfiguratorProps, UserAuthComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const authData = formData as UserAuthComponentDefinition;

    return (
        <div className="space-y-4">
            {/* 说明文字 */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                    用户认证组件是一个字段组复合组件，包含用户登录所需的所有凭证信息。
                    该组件的数据块类型固定为 <code className="bg-blue-100 px-1 rounded">__atlas_user_auth__</code>。
                </p>
            </div>

            {/* 必填字段配置 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    必填字段
                </label>
                <p className="text-xs text-slate-500 mb-2">用户ID和密码固定为必填</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={authData.requireUsername !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireUsername: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">用户名必填</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={authData.requireEmail === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireEmail: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">邮箱必填</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={authData.requirePhone === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requirePhone: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">手机号必填</span>
                    </label>
                </div>
            </div>

            {/* 账户设置 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    账户设置
                </label>
                <div className="space-y-3">
                    {/* 默认状态 */}
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">新用户默认状态</label>
                        <select
                            value={authData.defaultStatus || 'pending'}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    defaultStatus: e.target.value as 'pending' | 'active',
                                }))
                            }
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                                focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        >
                            <option value="pending">待激活</option>
                            <option value="active">正常</option>
                        </select>
                        <p className="mt-1 text-xs text-slate-500">
                            设置为"待激活"需要用户完成激活流程后才能登录
                        </p>
                    </div>

                    {/* 过期时间 */}
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={authData.enableExpiration === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    enableExpiration: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">启用账户过期时间</span>
                    </label>
                    {authData.enableExpiration && (
                        <p className="text-xs text-slate-500 ml-6">
                            启用后可为用户设置账户过期时间，过期后状态自动变为"已过期"
                        </p>
                    )}
                </div>
            </div>

            {/* 技术信息 */}
            <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                    数据块类型: <code className="bg-slate-100 px-1 rounded">__atlas_user_auth__</code>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    该标识符用于索引服务识别用户认证数据
                </p>
            </div>
        </div>
    );
}

export default Configurator;

