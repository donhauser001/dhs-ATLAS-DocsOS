/**
 * Timestamp 组件 - 配置表单
 */

import { ConfiguratorProps, TimestampComponentDefinition } from '../../types';

const TYPE_OPTIONS = [
    { value: 'created', label: '创建时间', description: '首次设置后不变' },
    { value: 'updated', label: '更新时间', description: '每次保存时自动更新' },
    { value: 'custom', label: '自定义时间', description: '手动触发更新' },
];

const FORMAT_OPTIONS = [
    { value: 'YYYY-MM-DD HH:mm:ss', label: '完整格式', example: '2026-01-05 14:32:15' },
    { value: 'YYYY-MM-DD HH:mm', label: '无秒', example: '2026-01-05 14:32' },
    { value: 'YYYY-MM-DD', label: '仅日期', example: '2026-01-05' },
    { value: 'MM-DD HH:mm', label: '月日时分', example: '01-05 14:32' },
    { value: 'HH:mm:ss', label: '仅时间', example: '14:32:15' },
];

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const tsData = formData as TimestampComponentDefinition;

    return (
        <div className="space-y-4">
            {/* 时间戳类型 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    时间戳类型
                </label>
                <div className="space-y-2">
                    {TYPE_OPTIONS.map((option) => (
                        <label
                            key={option.value}
                            className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:border-purple-200 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="timestampType"
                                value={option.value}
                                checked={tsData.timestampType === option.value}
                                onChange={() =>
                                    onUpdateFormData((prev) => ({
                                        ...prev,
                                        timestampType: option.value as TimestampComponentDefinition['timestampType'],
                                    }))
                                }
                                className="mt-1 text-purple-500"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-700">{option.label}</div>
                                <div className="text-xs text-slate-400">{option.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* 显示格式 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    显示格式
                </label>
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
                                checked={tsData.format === option.value}
                                onChange={() =>
                                    onUpdateFormData((prev) => ({
                                        ...prev,
                                        format: option.value,
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

            {/* 显示选项 */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    显示选项
                </label>
                <div className="space-y-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={tsData.showRelative === true}
                            onChange={(e) =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    showRelative: e.target.checked,
                                }))
                            }
                            className="w-4 h-4 text-purple-500 rounded border-slate-300"
                        />
                        <span className="text-sm text-slate-700">显示相对时间（如"3天前"）</span>
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;

