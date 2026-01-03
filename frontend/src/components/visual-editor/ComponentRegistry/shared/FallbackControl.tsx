/**
 * FallbackControl - 降级控件
 * 当组件未找到时显示的降级 UI
 */

import { AlertTriangle } from 'lucide-react';
import { FallbackControlProps } from '../types';

export function FallbackControl({ componentId, value, onChange }: FallbackControlProps) {
    return (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">组件未找到</span>
            </div>
            <p className="text-xs text-amber-600">
                组件 <code className="bg-amber-100 px-1 rounded">{componentId}</code> 未在当前文档中定义
            </p>
            <div className="pt-2 border-t border-amber-200">
                <label className="block text-xs text-amber-700 mb-1">原始数据：</label>
                <input
                    type="text"
                    value={typeof value === 'string' ? value : JSON.stringify(value) || ''}
                    onChange={(e) => onChange(e.target.value || null)}
                    className="w-full px-2 py-1 text-sm border border-amber-300 rounded bg-white
                        focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    placeholder="手动输入值"
                />
            </div>
        </div>
    );
}

export default FallbackControl;

