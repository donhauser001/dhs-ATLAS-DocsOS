/**
 * ObjectField - 嵌套对象控件
 * 
 * 将嵌套对象展开为可编辑的子字段
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SemanticFieldProps, FieldConfig } from '../types';
import { FieldRow } from '../FieldRenderer';
import { generateFieldConfig } from '../type-inference';

export const ObjectField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // 确保 value 是对象
  const objValue = useMemo(() => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }, [value]);

  // 为子字段生成配置
  const childConfigs = useMemo(() => {
    const configs: Record<string, FieldConfig> = {};
    for (const [key, val] of Object.entries(objValue)) {
      configs[key] = generateFieldConfig(key, val);
    }
    return configs;
  }, [objValue]);

  // 处理子字段变更
  const handleChildChange = useCallback((childKey: string, newValue: unknown) => {
    onChange({
      ...objValue,
      [childKey]: newValue,
    });
  }, [objValue, onChange]);

  // 如果是空对象，显示提示
  if (Object.keys(objValue).length === 0) {
    return (
      <div className="text-sm text-slate-400 italic">（空对象）</div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* 折叠头部 */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center gap-2 bg-slate-50 hover:bg-slate-100 
                   transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
        <span className="text-sm font-medium text-slate-600">
          {config.label}
        </span>
        <span className="text-xs text-slate-400">
          · {Object.keys(objValue).length} 个字段
        </span>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="p-3 space-y-2 bg-white">
          {Object.entries(objValue).map(([childKey, childValue]) => {
            const childConfig = childConfigs[childKey];
            
            // 如果子字段也是嵌套对象，递归渲染
            if (childConfig.type === 'object' && typeof childValue === 'object' && childValue !== null && !Array.isArray(childValue)) {
              return (
                <div key={childKey} className="pl-2 border-l-2 border-slate-100">
                  <ObjectField
                    fieldKey={`${fieldKey}.${childKey}`}
                    value={childValue}
                    config={childConfig}
                    onChange={(newVal) => handleChildChange(childKey, newVal)}
                    disabled={disabled}
                  />
                </div>
              );
            }

            return (
              <FieldRow
                key={childKey}
                fieldKey={`${fieldKey}.${childKey}`}
                value={childValue}
                config={childConfig}
                onChange={(newVal) => handleChildChange(childKey, newVal)}
                disabled={disabled}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

