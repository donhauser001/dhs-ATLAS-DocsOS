/**
 * Date 组件 - 配置表单
 */

import { ConfiguratorProps, DateComponentDefinition } from '../../types';

export function Configurator({ formData, onUpdateFormData }: ConfiguratorProps) {
    const dateData = formData as DateComponentDefinition;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">日期格式</label>
                <select
                    value={dateData.format || 'YYYY-MM-DD'}
                    onChange={(e) =>
                        onUpdateFormData((prev) => ({ ...prev, format: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg 
                        focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                >
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
            </div>
            <div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={dateData.includeTime || false}
                        onChange={(e) =>
                            onUpdateFormData((prev) => ({ ...prev, includeTime: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    包含时间
                </label>
            </div>
        </div>
    );
}

export default Configurator;

