/**
 * 固定键字段组件
 * 根据字段类型渲染不同的编辑器
 */

import { Lock } from 'lucide-react';
import type { FixedKeyItem } from './types';
import { VersionSelector } from './VersionSelector';
import { DocumentTypeSelector } from './DocumentTypeSelector';
import { FunctionSelector } from './FunctionSelector';
import { CapabilitiesField } from './CapabilitiesField';

interface FixedKeyFieldProps {
  item: FixedKeyItem;
  onChange: (key: string, value: unknown) => void;
  getLabel: (key: string) => string;
  documentType: string;
  functionKey: string;
}

export function FixedKeyField({ item, onChange, getLabel, documentType, functionKey }: FixedKeyFieldProps) {
  const { key, label, value, originalValue, icon, editable, inputType, options } = item;

  // 只读字段
  if (!editable) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-slate-400 flex items-center gap-1">
          {icon}
          {label}
          <Lock className="w-2.5 h-2.5 text-slate-300" />
        </label>
        <div className="px-2 py-1.5 text-xs bg-slate-100 text-slate-500 rounded border border-slate-200">
          {String(value || '-')}
        </div>
      </div>
    );
  }

  // 可编辑字段
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-slate-500 flex items-center gap-1">
        {icon}
        {label}
      </label>

      {inputType === 'version' ? (
        <VersionSelector
          value={String(value || '1.0')}
          originalValue={String(originalValue || '1.0')}
          onChange={(v) => onChange(key, v)}
        />
      ) : inputType === 'document_type' ? (
        <DocumentTypeSelector
          value={String(value || 'facts')}
          onChange={(v) => onChange(key, v)}
        />
      ) : inputType === 'function' ? (
        <FunctionSelector
          value={String(value || '')}
          documentType={documentType}
          onChange={(v) => onChange(key, v)}
        />
      ) : inputType === 'capabilities' ? (
        <CapabilitiesField
          value={String(value || '')}
          functionKey={functionKey}
          documentType={documentType}
          onChange={(v) => onChange(key, v)}
        />
      ) : inputType === 'select' && options ? (
        <select
          value={String(value || '')}
          onChange={(e) => onChange(key, e.target.value)}
          className="px-2 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        >
          <option value="">选择...</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{getLabel(opt)}</option>
          ))}
        </select>
      ) : inputType === 'tags' ? (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(key, e.target.value)}
          placeholder="用逗号分隔多个值"
          className="px-2 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      ) : (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(key, e.target.value)}
          className="px-2 py-1.5 text-xs bg-white text-slate-700 rounded border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );
}

export default FixedKeyField;
