/**
 * StatusField - 状态选择控件
 * 
 * 以徽章形式显示状态，点击展开选择
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import type { SemanticFieldProps } from '../types';
import { getStatusColor, getStatusLabel } from '../type-inference';

export const StatusField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentStatus = String(value || 'draft');
  const { bg, text } = getStatusColor(currentStatus);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && !config.readonly && setIsOpen(!isOpen)}
        disabled={disabled || config.readonly}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm 
                   font-medium transition-all cursor-pointer hover:opacity-80
                   disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: bg, color: text }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: text }} />
        {getStatusLabel(currentStatus)}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 py-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200">
          {config.options?.map((opt) => {
            const optColor = getStatusColor(opt.value);
            const isSelected = opt.value === currentStatus;
            
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: optColor.text }}
                />
                <span className="flex-1 text-left text-sm text-slate-700">
                  {opt.label}
                </span>
                {isSelected && <Check size={16} className="text-purple-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

