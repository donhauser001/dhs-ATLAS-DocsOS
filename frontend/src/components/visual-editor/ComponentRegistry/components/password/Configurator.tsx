/**
 * Password 组件 - 配置表单
 */

import { ConfiguratorProps, PasswordComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const pwdData = formData as PasswordComponentDefinition;

    return (
        <div className="space-y-4">
            {/* 最小长度 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    最小长度
                </label>
                <input
                    type="number"
                    value={pwdData.minLength || 8}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            minLength: parseInt(e.target.value) || 8,
                        }))
                    }
                    min={6}
                    max={32}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
                <p className="mt-1 text-xs text-slate-500">建议至少 8 个字符</p>
            </div>

            {/* 密码要求 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    密码要求
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.requireUppercase !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireUppercase: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">要求大写字母 (A-Z)</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.requireLowercase !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireLowercase: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">要求小写字母 (a-z)</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.requireNumber !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireNumber: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">要求数字 (0-9)</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.requireSpecial === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    requireSpecial: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">要求特殊字符 (!@#$%...)</span>
                    </label>
                </div>
            </div>

            {/* 功能选项 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    功能选项
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.showStrengthMeter !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showStrengthMeter: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示密码强度指示器</span>
                    </label>

                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={pwdData.allowGenerate !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    allowGenerate: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">允许自动生成密码</span>
                    </label>
                </div>
            </div>

            {/* 生成密码长度 */}
            {pwdData.allowGenerate !== false && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        生成密码长度
                    </label>
                    <input
                        type="number"
                        value={pwdData.generatedLength || 16}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                generatedLength: parseInt(e.target.value) || 16,
                            }))
                        }
                        min={8}
                        max={64}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            )}
        </div>
    );
}

export default Configurator;

