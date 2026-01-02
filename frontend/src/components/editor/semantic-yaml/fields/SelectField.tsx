/**
 * SelectField - 下拉选择控件
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const SelectField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const stringValue = value !== undefined && value !== null ? String(value) : '';

  return (
    <div className="relative">
      <select
        id={fieldKey}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || config.readonly}
        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                   bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                   focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                   appearance-none cursor-pointer transition-colors pr-10"
      >
        <option value="">选择...</option>
        {config.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown 
        size={16} 
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
};

