/**
 * FieldItem - 字段项组件
 * 
 * 左侧大图标 + 右侧标签值布局
 */

import React from 'react';
import { FieldValueDisplay } from './FieldValueDisplay';

export interface FieldItemProps {
    fieldKey: string;
    type: string;
    value: unknown;
    displayValue: string;
    displayLabel: string;
    option?: { color?: string; label?: string };
    resolveIcon: (key: string) => React.ReactNode;
}

export const FieldItem: React.FC<FieldItemProps> = ({
    fieldKey,
    type,
    value,
    displayValue,
    displayLabel,
    option,
    resolveIcon,
}) => {
    return (
        <div className="flex items-stretch gap-3">
            {/* 左侧图标区域 - 浅灰背景 */}
            <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg flex-shrink-0">
                <span className="text-slate-500 [&>svg]:w-5 [&>svg]:h-5">
                    {resolveIcon(fieldKey)}
                </span>
            </div>
            {/* 右侧标签 + 值 */}
            <div className="flex flex-col justify-center min-w-0 flex-1">
                <dt className="text-xs text-slate-400 mb-0.5">{displayLabel}</dt>
                <dd className="text-sm text-slate-800">
                    <FieldValueDisplay
                        type={type}
                        value={value}
                        displayValue={displayValue}
                        option={option}
                    />
                </dd>
            </div>
        </div>
    );
};
