/**
 * TextField - 文本输入控件
 */

import React from 'react';
import type { SemanticFieldProps } from '../types';

export const TextField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const stringValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <input
      type="text"
      id={fieldKey}
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || config.readonly}
      placeholder={config.placeholder}
      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                 transition-colors"
    />
  );
};

