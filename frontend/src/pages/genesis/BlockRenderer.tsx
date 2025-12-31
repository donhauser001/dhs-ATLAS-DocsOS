/**
 * Block Renderer - ADL Block 渲染器
 * 
 * 根据 ViewMode 渲染 Block 的阅读态或编辑态
 */

import { type Block, type UpdateYamlOp } from '@/api/adl';
import { FieldRenderer } from './FieldRenderer';
import ReactMarkdown from 'react-markdown';

interface BlockRendererProps {
  block: Block;
  viewMode: 'read' | 'edit';
  onFieldChange: (anchor: string, path: string, value: unknown, oldValue: unknown) => void;
  pendingChanges: UpdateYamlOp[];
}

// 根据 type 获取状态颜色
function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-amber-100 text-amber-800';
    case 'archived':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

// 根据 type 获取类型标签颜色
function getTypeColor(type: string): string {
  switch (type) {
    case 'service':
      return 'bg-blue-100 text-blue-800';
    case 'category':
      return 'bg-purple-100 text-purple-800';
    case 'event':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export function BlockRenderer({ block, viewMode, onFieldChange, pendingChanges }: BlockRendererProps) {
  const { machine, body, anchor, heading } = block;
  
  // 检查字段是否有 pending change
  function getPendingValue(path: string): unknown | undefined {
    const change = pendingChanges.find(c => c.path === path);
    return change?.value;
  }
  
  // 获取字段当前显示值（pending 优先）
  function getDisplayValue(path: string, originalValue: unknown): unknown {
    const pending = getPendingValue(path);
    return pending !== undefined ? pending : originalValue;
  }
  
  // 处理字段变更
  function handleChange(path: string, value: unknown) {
    const originalValue = getNestedValue(machine, path);
    onFieldChange(anchor, path, value, originalValue);
  }
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Type Badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeColor(machine.type)}`}>
              {machine.type}
            </span>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-900">
              {machine.title || heading}
            </h3>
            
            {/* Status Badge */}
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(machine.status)}`}>
              {machine.status}
            </span>
          </div>
          
          {/* Anchor */}
          <code className="text-xs text-slate-400 font-mono">
            #{anchor}
          </code>
        </div>
        
        {/* ID */}
        <div className="mt-1 text-sm text-slate-500">
          ID: {machine.id}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {viewMode === 'read' ? (
          // Read View
          <div>
            {/* Machine fields as read-only display */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {Object.entries(machine)
                .filter(([key]) => !['type', 'id', 'status', 'title'].includes(key))
                .map(([key, value]) => (
                  <div key={key}>
                    <div className="text-sm text-slate-500 mb-1">{key}</div>
                    <div className="text-slate-900">
                      {typeof value === 'object' 
                        ? JSON.stringify(value, null, 2)
                        : String(value)
                      }
                    </div>
                  </div>
                ))
              }
            </div>
            
            {/* Body as Markdown */}
            {body && (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{body}</ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          // Edit View
          <div>
            {/* Editable fields */}
            <div className="space-y-4">
              {/* Status field */}
              <FieldRenderer
                label="状态"
                path="status"
                value={getDisplayValue('status', machine.status)}
                type="enum"
                options={['active', 'draft', 'archived']}
                onChange={(value) => handleChange('status', value)}
                hasChange={getPendingValue('status') !== undefined}
              />
              
              {/* Title field */}
              <FieldRenderer
                label="标题"
                path="title"
                value={getDisplayValue('title', machine.title)}
                type="string"
                onChange={(value) => handleChange('title', value)}
                hasChange={getPendingValue('title') !== undefined}
              />
              
              {/* Other fields based on machine block */}
              {Object.entries(machine)
                .filter(([key]) => !['type', 'id', 'status', 'title'].includes(key))
                .map(([key, value]) => {
                  const fieldType = inferFieldType(value);
                  const displayValue = getDisplayValue(key, value);
                  
                  // 处理嵌套对象（如 price）
                  if (fieldType === 'object' && typeof value === 'object' && value !== null) {
                    return (
                      <div key={key} className="border border-slate-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-slate-700 mb-3">{key}</div>
                        <div className="space-y-3">
                          {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => {
                            const path = `${key}.${subKey}`;
                            const subType = inferFieldType(subValue);
                            return (
                              <FieldRenderer
                                key={path}
                                label={subKey}
                                path={path}
                                value={getDisplayValue(path, subValue)}
                                type={subType}
                                onChange={(v) => handleChange(path, v)}
                                hasChange={getPendingValue(path) !== undefined}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <FieldRenderer
                      key={key}
                      label={key}
                      path={key}
                      value={displayValue}
                      type={fieldType}
                      onChange={(v) => handleChange(key, v)}
                      hasChange={getPendingValue(key) !== undefined}
                    />
                  );
                })
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 推断字段类型
function inferFieldType(value: unknown): 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array' {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

// 获取嵌套对象的值
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  
  return current;
}

export default BlockRenderer;

