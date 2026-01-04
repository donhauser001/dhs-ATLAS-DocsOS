/**
 * FileList 组件 - 配置表单
 */

import { ConfiguratorProps, FileListComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const fileListData = formData as FileListComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">显示模式</label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="displayMode"
                            value="list"
                            checked={fileListData.displayMode !== 'grid'}
                            onChange={() =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    displayMode: 'list',
                                }))
                            }
                            className="text-purple-500"
                        />
                        <span className="text-sm">列表</span>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="radio"
                            name="displayMode"
                            value="grid"
                            checked={fileListData.displayMode === 'grid'}
                            onChange={() =>
                                onUpdateFormData((prev) => ({
                                    ...prev,
                                    displayMode: 'grid',
                                }))
                            }
                            className="text-purple-500"
                        />
                        <span className="text-sm">网格</span>
                    </label>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">功能开关</label>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="allowDownload"
                        checked={fileListData.allowDownload !== false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                allowDownload: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <label htmlFor="allowDownload" className="text-sm text-slate-700">
                        允许下载
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="allowDelete"
                        checked={fileListData.allowDelete === true}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({
                                ...prev,
                                allowDelete: e.target.checked,
                            }))
                        }
                        className="w-4 h-4 text-purple-500 rounded border-slate-300"
                    />
                    <label htmlFor="allowDelete" className="text-sm text-slate-700">
                        允许删除
                    </label>
                </div>
            </div>
        </div>
    );
}

export default Configurator;

