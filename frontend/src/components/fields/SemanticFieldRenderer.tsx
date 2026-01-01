/**
 * SemanticFieldRenderer - 语义字段渲染器
 * 
 * Phase 3.0: UI 内功
 * 
 * 基于字段的语义类型渲染，而非简单的 typeof 推断。
 * 
 * 渲染逻辑：
 * fieldRenderer(fieldName, schema, value) → UI Component
 * 
 * 而非：
 * if (typeof value === 'string') renderInput()
 */

import { useCallback } from 'react';
import { ChevronDown, Calendar, Hash, Type, ToggleLeft, List, FileText, Link } from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

/**
 * 字段 Schema 定义
 */
export interface FieldSchema {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'ref' | 'token' | 'object' | 'array';
  /** 是否必填 */
  required?: boolean;
  /** 是否只读 */
  readonly?: boolean;
  /** 枚举选项（type='enum' 时使用） */
  options?: string[];
  /** 字段描述 */
  description?: string;
  /** 显示标签 */
  label?: string;
  /** 嵌套字段（type='object' 时使用） */
  fields?: FieldSchema[];
}

interface SemanticFieldRendererProps {
  /** 字段 Schema */
  schema: FieldSchema;
  /** 当前值 */
  value: unknown;
  /** 值变更回调 */
  onChange?: (value: unknown) => void;
  /** 是否有未保存的变更 */
  hasChange?: boolean;
  /** 是否处于编辑模式 */
  editMode?: boolean;
}

// ============================================================
// 主渲染器
// ============================================================

export function SemanticFieldRenderer({
  schema,
  value,
  onChange,
  hasChange = false,
  editMode = false,
}: SemanticFieldRendererProps) {
  const { type, readonly, description } = schema;
  
  // 只读模式或非编辑模式
  if (readonly || !editMode) {
    return (
      <ReadOnlyField
        schema={schema}
        value={value}
        hasChange={hasChange}
      />
    );
  }
  
  // 根据类型渲染编辑器
  return (
    <div className="field-container">
      <FieldLabel schema={schema} hasChange={hasChange} />
      
      <div className="field-input-wrapper">
        {type === 'string' && (
          <StringInput value={value as string} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'number' && (
          <NumberInput value={value as number} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'boolean' && (
          <BooleanInput value={value as boolean} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'enum' && (
          <EnumInput
            value={value as string}
            options={schema.options || []}
            onChange={onChange}
            hasChange={hasChange}
          />
        )}
        
        {type === 'date' && (
          <DateInput value={value as string} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'ref' && (
          <RefInput value={value} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'token' && (
          <TokenInput value={value} onChange={onChange} hasChange={hasChange} />
        )}
        
        {type === 'object' && (
          <ObjectInput
            schema={schema}
            value={value as Record<string, unknown>}
            onChange={onChange}
            hasChange={hasChange}
          />
        )}
        
        {type === 'array' && (
          <ArrayDisplay value={value as unknown[]} />
        )}
      </div>
      
      {description && (
        <p className="field-description">{description}</p>
      )}
    </div>
  );
}

// ============================================================
// 字段标签
// ============================================================

function FieldLabel({ schema, hasChange }: { schema: FieldSchema; hasChange: boolean }) {
  const { name, label, required, readonly } = schema;
  const Icon = getFieldIcon(schema.type);
  
  return (
    <label
      className="field-label"
      style={{
        color: `var(--ui-field-label-color)`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '4px',
        fontSize: '14px',
      }}
    >
      <Icon size={14} />
      <span>{label || name}</span>
      {required && <span className="text-red-500">*</span>}
      {readonly && <span className="text-slate-400">(只读)</span>}
      {hasChange && (
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: `var(--ui-field-changed-bg)`,
            color: `var(--color-status-draft-text)`,
          }}
        >
          已修改
        </span>
      )}
    </label>
  );
}

// ============================================================
// 只读字段
// ============================================================

function ReadOnlyField({
  schema,
  value,
  hasChange,
}: {
  schema: FieldSchema;
  value: unknown;
  hasChange: boolean;
}) {
  const displayValue = formatValue(value, schema.type);
  
  return (
    <div className="field-readonly">
      <FieldLabel schema={{ ...schema, readonly: true }} hasChange={hasChange} />
      <div
        className="field-value"
        style={{
          color: `var(--ui-field-value-color)`,
          backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-readonly-bg)`,
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      >
        {displayValue}
      </div>
    </div>
  );
}

// ============================================================
// 输入组件
// ============================================================

const inputBaseStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

function StringInput({
  value,
  onChange,
  hasChange,
}: {
  value: string;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  return (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        ...inputBaseStyle,
        backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
        border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
        color: `var(--ui-field-value-color)`,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = `var(--ui-field-input-focus-border)`;
        e.target.style.boxShadow = `0 0 0 3px rgba(139, 92, 246, 0.1)`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = hasChange
          ? `var(--ui-field-changed-border)`
          : `var(--ui-field-input-border)`;
        e.target.style.boxShadow = 'none';
      }}
    />
  );
}

function NumberInput({
  value,
  onChange,
  hasChange,
}: {
  value: number;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange?.(Number(e.target.value))}
      style={{
        ...inputBaseStyle,
        backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
        border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
        color: `var(--ui-field-value-color)`,
      }}
    />
  );
}

function BooleanInput({
  value,
  onChange,
  hasChange,
}: {
  value: boolean;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  return (
    <label
      className="flex items-center gap-2 cursor-pointer"
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : 'transparent',
      }}
    >
      <input
        type="checkbox"
        checked={value ?? false}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded"
        style={{
          accentColor: `var(--color-brand-primary)`,
        }}
      />
      <span style={{ color: `var(--ui-field-value-color)` }}>
        {value ? '是' : '否'}
      </span>
    </label>
  );
}

function EnumInput({
  value,
  options,
  onChange,
  hasChange,
}: {
  value: string;
  options: string[];
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          ...inputBaseStyle,
          backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
          border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
          color: `var(--ui-field-value-color)`,
          appearance: 'none',
          paddingRight: '32px',
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: `var(--ui-field-label-color)` }}
      />
    </div>
  );
}

function DateInput({
  value,
  onChange,
  hasChange,
}: {
  value: string;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  return (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        ...inputBaseStyle,
        backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
        border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
        color: `var(--ui-field-value-color)`,
      }}
    />
  );
}

function RefInput({
  value,
  onChange,
  hasChange,
}: {
  value: unknown;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  // 提取引用值
  const refValue = typeof value === 'object' && value !== null && 'ref' in value
    ? (value as { ref: string }).ref
    : String(value || '');
  
  return (
    <div className="relative">
      <input
        type="text"
        value={refValue}
        onChange={(e) => onChange?.({ ref: e.target.value })}
        placeholder="#anchor-name"
        style={{
          ...inputBaseStyle,
          backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
          border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
          color: `var(--ui-field-value-color)`,
          paddingLeft: '32px',
        }}
      />
      <Link
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: `var(--ui-field-label-color)` }}
      />
    </div>
  );
}

function TokenInput({
  value,
  onChange,
  hasChange,
}: {
  value: unknown;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  // 提取 token 值
  const tokenValue = typeof value === 'object' && value !== null && 'token' in value
    ? (value as { token: string }).token
    : String(value || '');
  
  return (
    <input
      type="text"
      value={tokenValue}
      onChange={(e) => onChange?.({ token: e.target.value })}
      placeholder="color.brand.primary"
      style={{
        ...inputBaseStyle,
        backgroundColor: hasChange ? `var(--ui-field-changed-bg)` : `var(--ui-field-input-bg)`,
        border: `1px solid ${hasChange ? `var(--ui-field-changed-border)` : `var(--ui-field-input-border)`}`,
        color: `var(--ui-field-value-color)`,
        fontFamily: 'monospace',
      }}
    />
  );
}

function ObjectInput({
  schema,
  value,
  onChange,
  hasChange,
}: {
  schema: FieldSchema;
  value: Record<string, unknown>;
  onChange?: (value: unknown) => void;
  hasChange: boolean;
}) {
  const handleFieldChange = useCallback((fieldName: string, fieldValue: unknown) => {
    onChange?.({
      ...value,
      [fieldName]: fieldValue,
    });
  }, [value, onChange]);
  
  // 如果有子字段定义，递归渲染
  if (schema.fields) {
    return (
      <div
        className="space-y-3 p-3 rounded-lg"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          border: `1px solid var(--ui-block-header-border)`,
        }}
      >
        {schema.fields.map((field) => (
          <SemanticFieldRenderer
            key={field.name}
            schema={field}
            value={value?.[field.name]}
            onChange={(v) => handleFieldChange(field.name, v)}
            hasChange={hasChange}
            editMode={true}
          />
        ))}
      </div>
    );
  }
  
  // 否则显示 JSON
  return (
    <div
      className="p-3 rounded-lg text-sm font-mono"
      style={{
        backgroundColor: `var(--ui-field-readonly-bg)`,
        color: `var(--ui-field-value-color)`,
      }}
    >
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function ArrayDisplay({ value }: { value: unknown[] }) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{
        backgroundColor: `var(--ui-field-readonly-bg)`,
        color: `var(--ui-field-value-color)`,
      }}
    >
      <div className="text-sm mb-2">共 {value?.length || 0} 项</div>
      <pre className="text-xs font-mono whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function getFieldIcon(type: string) {
  switch (type) {
    case 'string':
      return Type;
    case 'number':
      return Hash;
    case 'boolean':
      return ToggleLeft;
    case 'date':
      return Calendar;
    case 'ref':
      return Link;
    case 'array':
      return List;
    case 'object':
      return FileText;
    default:
      return Type;
  }
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (type === 'boolean') {
    return value ? '是' : '否';
  }
  
  if (type === 'ref') {
    if (typeof value === 'object' && 'ref' in value) {
      return (value as { ref: string }).ref;
    }
    return String(value);
  }
  
  if (type === 'token') {
    if (typeof value === 'object' && 'token' in value) {
      return `${(value as { token: string }).token}`;
    }
    return String(value);
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  
  return String(value);
}

export default SemanticFieldRenderer;

