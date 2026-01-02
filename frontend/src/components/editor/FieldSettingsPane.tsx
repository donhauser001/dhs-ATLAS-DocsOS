/**
 * FieldSettingsPane - 字段设置面板
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 功能：
 * - 显示和编辑文档字段
 * - 分区显示（结构字段/业务字段/元数据）
 * - 与 MD 编辑器双向同步
 */

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  Lock,
  FileText,
  Zap,
  Settings,
  Plus,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Block } from '@/api/adl';

interface FieldSettingsPaneProps {
  /** Block 数据 */
  block?: Block;
  /** Frontmatter 数据 */
  frontmatter?: Record<string, unknown>;
  /** 字段变更回调 */
  onFieldChange?: (path: string, value: unknown, source: 'block' | 'frontmatter') => void;
  /** 是否只读 */
  readOnly?: boolean;
}

/**
 * 字段类型
 */
type FieldType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';

/**
 * 字段配置
 */
interface FieldConfig {
  key: string;
  label: string;
  value: unknown;
  type: FieldType;
  source: 'block' | 'frontmatter';
  readOnly?: boolean;
  options?: string[]; // for enum
}

/**
 * 结构字段配置
 */
const STRUCTURAL_FIELDS = ['type', 'id', 'status'];

/**
 * 元数据字段配置
 */
const METADATA_FIELDS = ['version', 'document_type', 'created', 'updated', 'author'];

export function FieldSettingsPane({
  block,
  frontmatter = {},
  onFieldChange,
  readOnly = false,
}: FieldSettingsPaneProps) {
  const { resolveLabel } = useLabels();
  const [expandedSections, setExpandedSections] = useState({
    structural: true,
    business: true,
    metadata: false,
    function: false,
  });
  
  // 分类字段
  const categorizedFields = useMemo(() => {
    const structural: FieldConfig[] = [];
    const business: FieldConfig[] = [];
    const metadata: FieldConfig[] = [];
    const functionFields: FieldConfig[] = [];
    
    // 从 Block 提取字段
    if (block?.machine) {
      for (const [key, value] of Object.entries(block.machine)) {
        if (key.startsWith('$') || key.startsWith('_')) continue;
        
        const fieldType = inferFieldType(value);
        const config: FieldConfig = {
          key,
          label: resolveLabel(key).label,
          value,
          type: fieldType,
          source: 'block',
        };
        
        if (STRUCTURAL_FIELDS.includes(key)) {
          config.readOnly = key === 'type'; // type 只读
          if (key === 'status') {
            config.type = 'enum';
            config.options = ['active', 'draft', 'archived'];
          }
          structural.push(config);
        } else {
          business.push(config);
        }
      }
    }
    
    // 从 Frontmatter 提取元数据字段
    for (const key of METADATA_FIELDS) {
      if (frontmatter[key] !== undefined) {
        metadata.push({
          key,
          label: resolveLabel(key).label,
          value: frontmatter[key],
          type: inferFieldType(frontmatter[key]),
          source: 'frontmatter',
          readOnly: key === 'created', // created 只读
        });
      }
    }
    
    // 提取功能字段
    const atlas = frontmatter.atlas as Record<string, unknown> | undefined;
    if (atlas) {
      for (const key of ['function', 'entity_type', 'capabilities']) {
        if (atlas[key] !== undefined) {
          functionFields.push({
            key: `atlas.${key}`,
            label: resolveLabel(`atlas.${key}`).label,
            value: atlas[key],
            type: key === 'capabilities' ? 'array' : 'enum',
            source: 'frontmatter',
            options: key === 'function' 
              ? ['principal', 'client', 'project', 'entity_list', 'config', 'registry']
              : undefined,
          });
        }
      }
    }
    
    return { structural, business, metadata, function: functionFields };
  }, [block, frontmatter, resolveLabel]);
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  return (
    <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200">
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          字段设置
        </h3>
      </div>
      
      {/* 内容区 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* 结构字段（必填） */}
        <FieldSection
          title="结构字段"
          icon={<Lock className="w-4 h-4" />}
          fields={categorizedFields.structural}
          expanded={expandedSections.structural}
          onToggle={() => toggleSection('structural')}
          onFieldChange={onFieldChange}
          readOnly={readOnly}
        />
        
        {/* 业务字段 */}
        <FieldSection
          title="业务字段"
          icon={<FileText className="w-4 h-4" />}
          fields={categorizedFields.business}
          expanded={expandedSections.business}
          onToggle={() => toggleSection('business')}
          onFieldChange={onFieldChange}
          readOnly={readOnly}
        />
        
        {/* 文档元数据 */}
        <FieldSection
          title="文档元数据"
          icon={<FileText className="w-4 h-4" />}
          fields={categorizedFields.metadata}
          expanded={expandedSections.metadata}
          onToggle={() => toggleSection('metadata')}
          onFieldChange={onFieldChange}
          readOnly={readOnly}
          collapsedSummary={getMetadataSummary(categorizedFields.metadata)}
        />
        
        {/* 功能声明 */}
        {categorizedFields.function.length > 0 && (
          <FieldSection
            title="功能声明"
            icon={<Zap className="w-4 h-4" />}
            fields={categorizedFields.function}
            expanded={expandedSections.function}
            onToggle={() => toggleSection('function')}
            onFieldChange={onFieldChange}
            readOnly={readOnly}
          />
        )}
      </div>
    </div>
  );
}

/**
 * 字段分区组件
 */
interface FieldSectionProps {
  title: string;
  icon: React.ReactNode;
  fields: FieldConfig[];
  expanded: boolean;
  onToggle: () => void;
  onFieldChange?: (path: string, value: unknown, source: 'block' | 'frontmatter') => void;
  readOnly?: boolean;
  collapsedSummary?: string;
}

function FieldSection({
  title,
  icon,
  fields,
  expanded,
  onToggle,
  onFieldChange,
  readOnly,
  collapsedSummary,
}: FieldSectionProps) {
  if (fields.length === 0) return null;
  
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {icon}
          {title}
          <span className="text-xs text-slate-400">({fields.length})</span>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      
      {!expanded && collapsedSummary && (
        <div className="px-2 py-1 text-xs text-slate-400">
          {collapsedSummary}
        </div>
      )}
      
      <CollapsibleContent>
        <div className="space-y-3 mt-2">
          {fields.map(field => (
            <FieldInput
              key={field.key}
              config={field}
              onChange={(value) => onFieldChange?.(field.key, value, field.source)}
              readOnly={readOnly || field.readOnly}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * 字段输入组件
 */
interface FieldInputProps {
  config: FieldConfig;
  onChange?: (value: unknown) => void;
  readOnly?: boolean;
}

function FieldInput({ config, onChange, readOnly }: FieldInputProps) {
  const { label, value, type, options } = config;
  
  const handleChange = (newValue: unknown) => {
    if (!readOnly) {
      onChange?.(newValue);
    }
  };
  
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-500 flex items-center gap-1">
        {label}
        {config.readOnly && <Lock className="w-3 h-3" />}
      </label>
      
      {type === 'enum' && options ? (
        <select
          value={String(value)}
          onChange={(e) => handleChange(e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
        >
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === 'boolean' ? (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleChange(e.target.checked)}
            disabled={readOnly}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700">
            {value ? '是' : '否'}
          </span>
        </label>
      ) : type === 'number' ? (
        <input
          type="number"
          value={value as number}
          onChange={(e) => handleChange(Number(e.target.value))}
          disabled={readOnly}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
        />
      ) : type === 'array' ? (
        <ArrayFieldInput
          value={value as unknown[]}
          onChange={handleChange}
          readOnly={readOnly}
        />
      ) : type === 'object' ? (
        <div className="text-xs text-slate-400 bg-slate-100 p-2 rounded font-mono">
          {JSON.stringify(value, null, 2)}
        </div>
      ) : (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => handleChange(e.target.value)}
          disabled={readOnly}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
        />
      )}
    </div>
  );
}

/**
 * 数组字段输入组件
 */
function ArrayFieldInput({
  value,
  onChange,
  readOnly,
}: {
  value: unknown[];
  onChange?: (value: unknown[]) => void;
  readOnly?: boolean;
}) {
  const items = Array.isArray(value) ? value : [];
  
  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange?.(newItems);
  };
  
  const handleAddItem = () => {
    onChange?.([...items, '']);
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange?.(newItems);
  };
  
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={String(item)}
            onChange={(e) => handleItemChange(index, e.target.value)}
            disabled={readOnly}
            className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          {!readOnly && (
            <button
              onClick={() => handleRemoveItem(index)}
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button
          onClick={handleAddItem}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-3 h-3" />
          添加项目
        </button>
      )}
    </div>
  );
}

/**
 * 推断字段类型
 */
function inferFieldType(value: unknown): FieldType {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string';
}

/**
 * 获取元数据摘要
 */
function getMetadataSummary(fields: FieldConfig[]): string {
  const created = fields.find(f => f.key === 'created');
  const author = fields.find(f => f.key === 'author');
  
  const parts: string[] = [];
  if (created) {
    parts.push(`创建: ${formatDate(created.value as string)}`);
  }
  if (author) {
    parts.push(`作者: ${author.value}`);
  }
  
  return parts.join(' · ');
}

/**
 * 格式化日期
 */
function formatDate(isoString: string): string {
  try {
    return new Date(isoString).toLocaleDateString('zh-CN');
  } catch {
    return isoString;
  }
}

export default FieldSettingsPane;

