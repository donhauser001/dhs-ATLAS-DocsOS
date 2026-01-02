/**
 * ColorField - 颜色选择控件
 */

import React from 'react';
import { Palette } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const ColorField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const colorValue = typeof value === 'string' ? value : '#8B5CF6';

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="color"
          id={fieldKey}
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || config.readonly}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>
      <div className="flex-1">
        <input
          type="text"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || config.readonly}
          placeholder="#000000"
          className="w-full px-3 py-2 text-sm rounded-md border border-slate-200 
                     bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                     focus:border-purple-500 disabled:bg-slate-50 disabled:text-slate-500
                     font-mono transition-colors"
        />
      </div>
      <div
        className="w-10 h-10 rounded-lg border border-slate-200"
        style={{ backgroundColor: colorValue }}
      />
    </div>
  );
};

