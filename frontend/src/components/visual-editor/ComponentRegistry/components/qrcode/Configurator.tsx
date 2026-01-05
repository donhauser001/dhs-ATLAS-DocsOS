/**
 * QRCode 组件 - 配置表单
 */

import { ConfiguratorProps, QrcodeComponentDefinition } from '../../types';

const ERROR_LEVELS = [
    { value: 'L', label: '低 (7%)', description: '可恢复约7%数据' },
    { value: 'M', label: '中 (15%)', description: '可恢复约15%数据' },
    { value: 'Q', label: '较高 (25%)', description: '可恢复约25%数据' },
    { value: 'H', label: '高 (30%)', description: '可恢复约30%数据' },
];

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const qrData = formData as QrcodeComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    尺寸 (px)
                </label>
                <input
                    type="number"
                    value={qrData.size || 128}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            size: parseInt(e.target.value) || 128,
                        }))
                    }
                    min={64}
                    max={512}
                    step={32}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    容错级别
                </label>
                <div className="space-y-2">
                    {ERROR_LEVELS.map((level) => (
                        <label
                            key={level.value}
                            className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:border-purple-200 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="errorCorrectionLevel"
                                value={level.value}
                                checked={qrData.errorCorrectionLevel === level.value}
                                onChange={() =>
                                    onUpdateFormData((prev) => ({
                                        ...prev,
                                        errorCorrectionLevel: level.value as QrcodeComponentDefinition['errorCorrectionLevel'],
                                    }))
                                }
                                className="mt-0.5 text-purple-500"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-700">{level.label}</div>
                                <div className="text-xs text-slate-400">{level.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        前景色
                    </label>
                    <input
                        type="color"
                        value={qrData.fgColor || '#000000'}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                fgColor: e.target.value,
                            }))
                        }
                        className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        背景色
                    </label>
                    <input
                        type="color"
                        value={qrData.bgColor || '#ffffff'}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                bgColor: e.target.value,
                            }))
                        }
                        className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                </div>
            </div>

            <div>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={qrData.allowDownload !== false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                allowDownload: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">允许下载</span>
                </label>
            </div>
        </div>
    );
}

export default Configurator;


