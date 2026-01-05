/**
 * Formula 组件 - 数据块控件
 */

import { Sigma } from 'lucide-react';
import { ControlProps, FormulaComponentDefinition } from '../../types';

export function Control({ component, value }: ControlProps) {
    const formulaDef = component as FormulaComponentDefinition;

    const displayValue = value !== null && value !== undefined
        ? String(value)
        : formulaDef.errorValue || 'N/A';

    return (
        <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
            <div className="flex items-center justify-center w-8 h-8 bg-indigo-200 rounded-full">
                <Sigma className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1">
                <div className="text-xs text-indigo-500 mb-0.5">公式结果</div>
                <div className="text-lg font-medium text-slate-800">
                    {displayValue}
                </div>
            </div>
            {formulaDef.formula && (
                <div className="text-xs text-indigo-400 font-mono max-w-xs truncate" title={formulaDef.formula}>
                    {formulaDef.formula}
                </div>
            )}
        </div>
    );
}

export default Control;


