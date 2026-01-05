/**
 * Barcode 组件 - 配置表单
 */

import { ConfiguratorProps, BarcodeComponentDefinition } from '../../types';

const FORMAT_OPTIONS = [
    { value: 'CODE128', label: 'CODE128', description: '通用格式，支持所有ASCII字符' },
    { value: 'EAN13', label: 'EAN-13', description: '商品条码，13位数字' },
    { value: 'UPC', label: 'UPC-A', description: '美国商品码，12位数字' },
    { value: 'CODE39', label: 'CODE39', description: '工业码，支持字母数字' },
    { value: 'ITF14', label: 'ITF-14', description: '物流码，14位数字' },
];

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const barcodeData = formData as BarcodeComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    条形码格式
                </label>
                <div className="space-y-2">
                    {FORMAT_OPTIONS.map((format) => (
                        <label
                            key={format.value}
                            className="flex items-start gap-2 p-2 rounded-lg border border-slate-200 hover:border-purple-200 cursor-pointer"
                        >
                            <input
                                type="radio"
                                name="barcodeFormat"
                                value={format.value}
                                checked={barcodeData.barcodeFormat === format.value}
                                onChange={() =>
                                    onUpdateFormData((prev) => ({
                                        ...prev,
                                        barcodeFormat: format.value as BarcodeComponentDefinition['barcodeFormat'],
                                    }))
                                }
                                className="mt-0.5 text-purple-500"
                            />
                            <div>
                                <div className="text-sm font-medium text-slate-700">{format.label}</div>
                                <div className="text-xs text-slate-400">{format.description}</div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        线条宽度
                    </label>
                    <input
                        type="number"
                        value={barcodeData.width || 2}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                width: parseInt(e.target.value) || 2,
                            }))
                        }
                        min={1}
                        max={4}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        高度 (px)
                    </label>
                    <input
                        type="number"
                        value={barcodeData.height || 100}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                height: parseInt(e.target.value) || 100,
                            }))
                        }
                        min={50}
                        max={200}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={barcodeData.displayValue !== false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                displayValue: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">显示数值文字</span>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={barcodeData.allowDownload !== false}
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

