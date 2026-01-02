/**
 * NumberField - 数字输入控件
 */

import React from 'react';
import type { SemanticFieldProps } from '../types';

export const NumberField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const numValue = typeof value === 'number' ? value : (value ? Number(value) : '');

  return (
    <input
      type="number"
      id={fieldKey}
      value={numValue}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === '' ? null : Number(val));
      }}
      disabled={disabled || config.readonly}
      placeholder={config.placeholder}
      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                 transition-colors"
    />
  );
};

