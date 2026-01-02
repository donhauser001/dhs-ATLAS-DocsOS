/**
 * SemanticYamlEditor - YAML 语义化编辑器
 * 
 * 将 YAML 对象转换为可视化表单，让非技术用户也能轻松编辑
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, FileCode, Edit3 } from 'lucide-react';
import { FieldRow } from './FieldRenderer';
import { generateFieldConfig } from './type-inference';
import type { SemanticYamlEditorProps, FieldConfig } from './types';
import { useLabels } from '@/providers/LabelProvider';

// 图标映射
const ENTITY_ICONS: Record<string, React.ReactNode> = {
  client: '🏢',
  principal: '👤',
  profile: '📋',
  project: '📁',
  token: '🎨',
  config: '⚙️',
  default: '📄',
};

export const SemanticYamlEditor: React.FC<SemanticYamlEditorProps> = ({
  data,
  entityType,
  onChange,
  disabled = false,
  title,
  icon,
  collapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [viewMode, setViewMode] = useState<'form' | 'yaml'>('form');
  const { getLabel } = useLabels();

  // 检测实体类型
  const detectedType = useMemo(() => {
    return entityType || (data.type as string) || 'default';
  }, [entityType, data.type]);

  // 获取图标
  const displayIcon = icon || ENTITY_ICONS[detectedType] || ENTITY_ICONS.default;

  // 获取标题
  const displayTitle = useMemo(() => {
    if (title) return title;
    if (data.title) return String(data.title);
    if (data.display_name) return String(data.display_name);
    if (data.id) return String(data.id);
    const typeLabel = getLabel(detectedType);
    return typeLabel.label || '数据块';
  }, [title, data, detectedType, getLabel]);

  // 生成字段配置
  const fieldConfigs = useMemo(() => {
    const configs: Record<string, FieldConfig> = {};
    
    for (const [key, value] of Object.entries(data)) {
      configs[key] = generateFieldConfig(key, value);
      
      // 使用标签系统美化标签
      const labelInfo = getLabel(key);
      if (labelInfo.label !== key) {
        configs[key].label = labelInfo.label;
      }
    }
    
    return configs;
  }, [data, getLabel]);

  // 字段排序（只读字段在前，然后按字母排序）
  const sortedFields = useMemo(() => {
    return Object.keys(data).sort((a, b) => {
      const aConfig = fieldConfigs[a];
      const bConfig = fieldConfigs[b];
      
      // type 和 id 始终在最前面
      if (a === 'type') return -1;
      if (b === 'type') return 1;
      if (a === 'id') return -1;
      if (b === 'id') return 1;
      
      // 只读字段在前
      if (aConfig.readonly && !bConfig.readonly) return -1;
      if (!aConfig.readonly && bConfig.readonly) return 1;
      
      // 状态字段靠前
      if (a === 'status') return -1;
      if (b === 'status') return 1;
      
      return a.localeCompare(b);
    });
  }, [data, fieldConfigs]);

  // 处理字段变更
  const handleFieldChange = useCallback((key: string, value: unknown) => {
    onChange({
      ...data,
      [key]: value,
    });
  }, [data, onChange]);

  // YAML 视图
  const yamlString = useMemo(() => {
    return JSON.stringify(data, null, 2);
  }, [data]);

  return (
    <div className="semantic-yaml-editor rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* 头部 */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-white
                   border-b border-slate-100 cursor-pointer select-none"
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {collapsible && (
            <button className="p-0.5 text-slate-400">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
          
          <span className="text-xl">{displayIcon}</span>
          
          <div>
            <h3 className="font-semibold text-slate-800">{displayTitle}</h3>
            {detectedType !== 'default' && (
              <span className="text-xs text-slate-500">
                {getLabel(detectedType).label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {/* 视图切换 */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('form')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'form' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Edit3 size={14} className="inline mr-1" />
              表单
            </button>
            <button
              onClick={() => setViewMode('yaml')}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                viewMode === 'yaml' 
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileCode size={14} className="inline mr-1" />
              YAML
            </button>
          </div>
        </div>
      </div>

      {/* 内容 */}
      {isExpanded && (
        <div className="p-4">
          {viewMode === 'form' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
              {sortedFields.map((key) => (
                <FieldRow
                  key={key}
                  fieldKey={key}
                  value={data[key]}
                  config={fieldConfigs[key]}
                  onChange={(value) => handleFieldChange(key, value)}
                  disabled={disabled}
                />
              ))}
            </div>
          ) : (
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg text-sm font-mono overflow-auto">
              {yamlString}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default SemanticYamlEditor;

