/**
 * DateField - 日期选择控件
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const DateField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  // 解析日期值
  let dateValue = '';
  if (value) {
    const str = String(value);
    // 提取日期部分 (YYYY-MM-DD)
    const match = str.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) {
      dateValue = match[0];
    }
  }

  return (
    <div className="relative">
      <input
        type="date"
        id={fieldKey}
        value={dateValue}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || config.readonly}
        className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                   bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                   focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                   transition-colors pl-10"
      />
      <Calendar 
        size={16} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" 
      />
    </div>
  );
};

