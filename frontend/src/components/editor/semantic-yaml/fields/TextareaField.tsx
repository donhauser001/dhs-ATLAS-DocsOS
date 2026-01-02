/**
 * TextareaField - 多行文本控件
 */

import React from 'react';
import type { SemanticFieldProps } from '../types';

export const TextareaField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const stringValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <textarea
      id={fieldKey}
      value={stringValue}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || config.readonly}
      placeholder={config.placeholder}
      rows={4}
      className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                 focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                 transition-colors resize-none"
    />
  );
};

