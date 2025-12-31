/**
 * Field Renderer - 字段渲染器
 * 
 * 根据字段类型渲染对应的表单控件
 */

interface FieldRendererProps {
  label: string;
  path: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
  options?: string[];
  onChange: (value: unknown) => void;
  hasChange?: boolean;
}

export function FieldRenderer({ 
  label, 
  path, 
  value, 
  type, 
  options,
  onChange,
  hasChange 
}: FieldRendererProps) {
  const inputClassName = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${
    hasChange 
      ? 'border-amber-400 bg-amber-50' 
      : 'border-slate-200 bg-white'
  }`;
  
  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-slate-600 mb-1">
        {label}
        {hasChange && (
          <span className="text-xs text-amber-600">已修改</span>
        )}
      </label>
      
      {type === 'string' && (
        <input
          type="text"
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        />
      )}
      
      {type === 'number' && (
        <input
          type="number"
          value={value as number || 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className={inputClassName}
        />
      )}
      
      {type === 'boolean' && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/10"
          />
          <span className="text-sm text-slate-600">{value ? '是' : '否'}</span>
        </label>
      )}
      
      {type === 'enum' && options && (
        <select
          value={String(value || '')}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
      
      {type === 'array' && (
        <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg">
          {JSON.stringify(value, null, 2)}
          <div className="text-xs text-slate-400 mt-1">数组类型暂不支持编辑</div>
        </div>
      )}
      
      {type === 'object' && (
        <div className="text-sm text-slate-500 p-3 bg-slate-50 rounded-lg">
          <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default FieldRenderer;

