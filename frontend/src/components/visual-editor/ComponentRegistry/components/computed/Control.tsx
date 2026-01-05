/**
 * Computed 组件 - 数据块控件
 * 
 * 显示计算结果（只读）
 */

import { Calculator } from 'lucide-react';
import { ControlProps, ComputedComponentDefinition } from '../../types';

export function Control({ component, value }: ControlProps) {
    const computedDef = component as ComputedComponentDefinition;

    const displayValue = value !== null && value !== undefined
        ? typeof value === 'number'
            ? value.toFixed(computedDef.decimals || 2)
            : String(value)
        : '-';

    return (
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-slate-200 rounded-full">
                <Calculator className="h-4 w-4 text-slate-600" />
            </div>
            <div className="flex-1">
                <div className="text-xs text-slate-500 mb-0.5">计算结果</div>
                <div className="text-lg font-medium text-slate-800">
                    {displayValue}
                </div>
            </div>
            {computedDef.expression && (
                <div className="text-xs text-slate-400 font-mono">
                    {computedDef.expression}
                </div>
            )}
        </div>
    );
}

export default Control;

