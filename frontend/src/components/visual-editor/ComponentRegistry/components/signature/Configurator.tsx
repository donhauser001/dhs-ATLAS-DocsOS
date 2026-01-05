/**
 * Signature 组件 - 配置表单
 */

import { ConfiguratorProps, SignatureComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const signatureData = formData as SignatureComponentDefinition;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        宽度 (px)
                    </label>
                    <input
                        type="number"
                        value={signatureData.canvasWidth || 400}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                canvasWidth: parseInt(e.target.value) || 400,
                            }))
                        }
                        min={200}
                        max={800}
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
                        value={signatureData.canvasHeight || 200}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                canvasHeight: parseInt(e.target.value) || 200,
                            }))
                        }
                        min={100}
                        max={400}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        笔触颜色
                    </label>
                    <input
                        type="color"
                        value={signatureData.strokeColor || '#000000'}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                strokeColor: e.target.value,
                            }))
                        }
                        className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        笔触粗细
                    </label>
                    <input
                        type="number"
                        value={signatureData.strokeWidth || 2}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                strokeWidth: parseInt(e.target.value) || 2,
                            }))
                        }
                        min={1}
                        max={10}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                            focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    背景色
                </label>
                <input
                    type="color"
                    value={signatureData.backgroundColor || '#ffffff'}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({
                            ...prev,
                            backgroundColor: e.target.value,
                        }))
                    }
                    className="w-full h-10 rounded-lg border border-slate-200 cursor-pointer"
                />
            </div>
        </div>
    );
}

export default Configurator;


