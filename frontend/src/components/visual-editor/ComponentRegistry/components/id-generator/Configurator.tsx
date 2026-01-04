/**
 * IdGenerator 组件 - 配置表单
 */

import { ConfiguratorProps, IdGeneratorComponentDefinition } from '../../types';

const FORMAT_OPTIONS = [
    { value: 'numeric', label: '纯数字', example: '12345678' },
    { value: 'alpha', label: '纯字母', example: 'abcdefgh' },
    { value: 'alphanumeric', label: '字母数字混合', example: 'a1b2c3d4' },
    { value: 'uuid', label: 'UUID', example: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx' },
    { value: 'timestamp', label: '时间戳', example: '20260105123456xx' },
];

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const idData = formData as IdGeneratorComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">ID格式</label>
                <div className="space-y-2">
                    {FORMAT_OPTIONS.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:border-purple-200 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="format"
                                value={option.value}
                                checked={idData.format === option.value}
                                onChange={() =>
                                    onUpdateFormData((prev) => ({
                                        ...prev,
                                        format: option.value as IdGeneratorComponentDefinition['format'],
                                    }))
                                }
                                className="mt-1 text-purple-500"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-700">{option.label}</div>
                                <div className="text-xs text-slate-400 font-mono">{option.example}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {idData.format !== 'uuid' && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID长度</label>
                    <input
                        type="number"
                        value={idData.length || 8}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                length: parseInt(e.target.value) || 8,
                            }))
                        }
                        min={4}
                        max={32}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                    <p className="mt-1 text-xs text-slate-500">不含前缀后缀，建议 6-16 位</p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">前缀</label>
                    <input
                        type="text"
                        value={idData.prefix || ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                prefix: e.target.value || undefined,
                            }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="如: ORD-"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">后缀</label>
                    <input
                        type="text"
                        value={idData.suffix || ''}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                suffix: e.target.value || undefined,
                            }))
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                        placeholder="如: -CN"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">选项</label>
                
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="autoGenerate"
                        checked={idData.autoGenerate !== false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                autoGenerate: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <label htmlFor="autoGenerate" className="text-sm text-slate-700">
                        创建时自动生成
                    </label>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="editable"
                        checked={idData.editable === true}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                editable: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <label htmlFor="editable" className="text-sm text-slate-700">
                        允许手动编辑
                    </label>
                </div>

                {idData.format !== 'uuid' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="uppercase"
                            checked={idData.uppercase !== false}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    uppercase: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <label htmlFor="uppercase" className="text-sm text-slate-700">
                            大写字母
                        </label>
                    </div>
                )}
            </div>

            {/* 预览 */}
            <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-xs text-slate-500 mb-1">预览</div>
                <div className="font-mono text-sm text-slate-700">
                    {idData.prefix || ''}
                    <span className="text-purple-500">
                        {idData.format === 'uuid' 
                            ? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
                            : (idData.uppercase ? 'X' : 'x').repeat(idData.length || 8)
                        }
                    </span>
                    {idData.suffix || ''}
                </div>
            </div>
        </div>
    );
}

export default Configurator;

