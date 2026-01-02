/**
 * FieldRenderer - 字段渲染分发器
 * 
 * 根据字段类型选择对应的控件进行渲染
 */

import React from 'react';
import type { FieldType, SemanticFieldProps, FieldConfig } from './types';
import {
  TextField,
  TextareaField,
  SelectField,
  StatusField,
  SwitchField,
  RatingField,
  DateField,
  TagsField,
  ReadonlyField,
  NumberField,
  ColorField,
} from './fields';

// 字段类型到组件的映射
const FIELD_COMPONENTS: Record<FieldType, React.ComponentType<SemanticFieldProps>> = {
  text: TextField,
  textarea: TextareaField,
  select: SelectField,
  status: StatusField,
  switch: SwitchField,
  rating: RatingField,
  date: DateField,
  tags: TagsField,
  readonly: ReadonlyField,
  number: NumberField,
  color: ColorField,
  ref: TextField, // 暂时用文本框
  object: TextField, // 暂时用文本框显示 JSON
  unknown: TextField,
};

interface FieldRendererProps {
  fieldKey: string;
  value: unknown;
  config: FieldConfig;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const Component = FIELD_COMPONENTS[config.type] || TextField;

  // 特殊处理 object 类型
  if (config.type === 'object' && typeof value === 'object' && value !== null) {
    return (
      <div className="text-sm text-slate-500 bg-slate-50 rounded-md p-3 font-mono">
        {JSON.stringify(value, null, 2)}
      </div>
    );
  }

  return (
    <Component
      fieldKey={fieldKey}
      value={value}
      config={config}
      onChange={onChange}
      disabled={disabled}
    />
  );
};

/**
 * 字段行组件 - 包含标签和控件
 */
interface FieldRowProps extends FieldRendererProps {
  showLabel?: boolean;
}

export const FieldRow: React.FC<FieldRowProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
  showLabel = true,
}) => {
  // Switch 和 Rating 使用行内布局
  const isInlineField = config.type === 'switch' || config.type === 'status';

  if (isInlineField) {
    return (
      <div className="flex items-center justify-between py-2">
        {showLabel && (
          <label 
            htmlFor={fieldKey}
            className="text-sm font-medium text-slate-700"
          >
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <FieldRenderer
          fieldKey={fieldKey}
          value={value}
          config={config}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 py-2">
      {showLabel && (
        <label 
          htmlFor={fieldKey}
          className="block text-sm font-medium text-slate-700"
        >
          {config.label}
          {config.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <FieldRenderer
        fieldKey={fieldKey}
        value={value}
        config={config}
        onChange={onChange}
        disabled={disabled}
      />
      {config.description && (
        <p className="text-xs text-slate-500">{config.description}</p>
      )}
    </div>
  );
};

