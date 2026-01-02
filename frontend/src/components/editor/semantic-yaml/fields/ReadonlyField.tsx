/**
 * ReadonlyField - 只读字段控件
 */

import React from 'react';
import { Lock } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const ReadonlyField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
}) => {
  const displayValue = value !== undefined && value !== null ? String(value) : '-';

  return (
    <div
      id={fieldKey}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md 
                 bg-slate-50 border border-slate-200 text-slate-600"
    >
      <Lock size={14} className="text-slate-400 flex-shrink-0" />
      <span className="truncate font-mono">{displayValue}</span>
    </div>
  );
};

