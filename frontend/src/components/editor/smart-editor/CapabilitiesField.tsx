/**
 * 能力字段组件
 * 根据功能自动填充默认能力，使用标签系统进行映射
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, Plus, Zap, RotateCcw, ChevronDown, Check, Shield, Key, 
  List, Search, Edit, Trash2, Settings, Database, Eye, Filter,
  GitBranch, Compass
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLabels } from '@/providers/LabelProvider';
import { getDefaultCapabilities, TYPE_FUNCTION_MAP } from './FunctionSelector';

// 图标渲染
function CapabilityIcon({ icon, className }: { icon: string; className?: string }) {
  const iconClass = cn('w-3.5 h-3.5', className);
  switch (icon) {
    case 'key': return <Key className={iconClass} />;
    case 'shield': return <Shield className={iconClass} />;
    case 'list': return <List className={iconClass} />;
    case 'search': return <Search className={iconClass} />;
    case 'edit': return <Edit className={iconClass} />;
    case 'trash': return <Trash2 className={iconClass} />;
    case 'settings': return <Settings className={iconClass} />;
    case 'database': return <Database className={iconClass} />;
    case 'eye': return <Eye className={iconClass} />;
    case 'filter': return <Filter className={iconClass} />;
    case 'git-branch': return <GitBranch className={iconClass} />;
    case 'compass': return <Compass className={iconClass} />;
    default: return <Zap className={iconClass} />;
  }
}

// 颜色样式映射
const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
};

interface CapabilitiesFieldProps {
  value: string;
  functionKey: string;
  documentType: string;
  onChange: (value: string) => void;
}

export function CapabilitiesField({ value, functionKey, documentType, onChange }: CapabilitiesFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { config, getLabel, getIcon, getColor } = useLabels();

  // 从标签配置中获取能力列表
  const capabilitiesFromConfig = useMemo(() => {
    const capCategory = config?.categories?.find(c => c.id === 'capabilities');
    return capCategory?.items || [];
  }, [config]);

  // 按分类分组
  const capabilitiesByCategory = useMemo(() => {
    const grouped: Record<string, typeof capabilitiesFromConfig> = {};
    for (const cap of capabilitiesFromConfig) {
      const category = (cap as { category?: string }).category || '其他';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(cap);
    }
    return grouped;
  }, [capabilitiesFromConfig]);

  // 解析当前能力列表
  const capabilities = useMemo(() => {
    if (!value) return [];
    // 处理数组格式
    if (Array.isArray(value)) {
      return value.map(s => String(s).trim()).filter(Boolean);
    }
    // 处理字符串格式
    if (typeof value === 'string') {
      return value.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  // 获取默认能力
  const defaultCapabilities = getDefaultCapabilities(functionKey);

  // 检查是否需要能力（笔记类型不需要）
  const allowedFunctions = TYPE_FUNCTION_MAP[documentType];
  const needsCapabilities = allowedFunctions === undefined || allowedFunctions.length > 0;

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 获取能力信息
  const getCapabilityInfo = (key: string) => {
    return capabilitiesFromConfig.find(c => c.key === key);
  };

  // 获取能力标签
  const getCapabilityLabel = (key: string) => {
    return getCapabilityInfo(key)?.label || key;
  };

  // 不需要能力时显示禁用状态
  if (!needsCapabilities) {
    return (
      <div className="px-2 py-1.5 text-xs bg-slate-100 text-slate-400 rounded border border-slate-200 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5" />
        <span>此类型无需指定能力</span>
      </div>
    );
  }

  // 添加能力
  const addCapability = (cap: string) => {
    if (!capabilities.includes(cap)) {
      onChange([...capabilities, cap].join(', '));
    }
  };

  // 删除能力
  const removeCapability = (cap: string) => {
    onChange(capabilities.filter(c => c !== cap).join(', '));
  };

  // 重置为默认能力
  const resetToDefault = () => {
    onChange(defaultCapabilities.join(', '));
  };

  // 切换能力
  const toggleCapability = (cap: string) => {
    if (capabilities.includes(cap)) {
      removeCapability(cap);
    } else {
      addCapability(cap);
    }
  };

  // 检查是否与默认能力相同
  const isDefault = capabilities.length === defaultCapabilities.length &&
    capabilities.every(c => defaultCapabilities.includes(c)) &&
    defaultCapabilities.every(c => capabilities.includes(c));

  return (
    <div className="space-y-1.5">
      {/* 能力标签列表 */}
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {capabilities.length === 0 ? (
          <span className="text-xs text-slate-400 py-1">未设置能力</span>
        ) : (
          capabilities.map(cap => {
            const capInfo = getCapabilityInfo(cap) as { icon?: string; color?: string } | undefined;
            const isDefaultCap = defaultCapabilities.includes(cap);
            const colorClass = capInfo?.color ? COLOR_CLASSES[capInfo.color] : COLOR_CLASSES.slate;
            
            return (
              <span
                key={cap}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border",
                  isDefaultCap ? colorClass.bg : 'bg-amber-50',
                  isDefaultCap ? colorClass.text : 'text-amber-700',
                  isDefaultCap ? colorClass.border : 'border-amber-200'
                )}
                title={isDefaultCap ? '默认能力' : '自定义能力'}
              >
                {capInfo?.icon && <CapabilityIcon icon={capInfo.icon} />}
                {getCapabilityLabel(cap)}
                <button
                  type="button"
                  onClick={() => removeCapability(cap)}
                  className="hover:bg-black/10 rounded p-0.5 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })
        )}

        {/* 添加按钮 */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
          >
            <Plus className="w-3 h-3" />
            添加
            <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
          </button>

          {/* 下拉菜单 */}
          {isOpen && (
            <div className="absolute z-50 mt-1 left-0 w-64 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto py-1">
                {Object.entries(capabilitiesByCategory).map(([category, caps]) => (
                  <div key={category}>
                    <div className="px-3 py-1.5 text-[10px] font-medium text-slate-400 bg-slate-50 sticky top-0">
                      {category}
                    </div>
                    {caps.map(cap => {
                      const isSelected = capabilities.includes(cap.key);
                      const isDefaultCap = defaultCapabilities.includes(cap.key);
                      const capWithColor = cap as { color?: string; icon?: string };
                      const colorClass = capWithColor.color ? COLOR_CLASSES[capWithColor.color] : COLOR_CLASSES.slate;
                      
                      return (
                        <button
                          key={cap.key}
                          type="button"
                          onClick={() => toggleCapability(cap.key)}
                          className={cn(
                            "w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-50",
                            isSelected && "bg-blue-50"
                          )}
                        >
                          <span className={cn(
                            "w-5 h-5 rounded flex items-center justify-center",
                            colorClass.bg, colorClass.text
                          )}>
                            {capWithColor.icon && <CapabilityIcon icon={capWithColor.icon} />}
                          </span>
                          <span className="flex-1">
                            <span className={cn("font-medium", isSelected && "text-blue-600")}>
                              {cap.label}
                            </span>
                            <span className="text-slate-400 ml-1.5 text-[10px]">{cap.key}</span>
                            {isDefaultCap && (
                              <span className="ml-1.5 text-[10px] text-blue-500">默认</span>
                            )}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
                {Object.keys(capabilitiesByCategory).length === 0 && (
                  <div className="px-3 py-4 text-xs text-slate-400 text-center">
                    加载能力配置中...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部提示和重置按钮 */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-400">
          {defaultCapabilities.length > 0 && (
            <>
              <span className="text-blue-500">彩色</span>=默认 &nbsp;
              <span className="text-amber-500">橙色</span>=自定义
            </>
          )}
        </span>
        {!isDefault && defaultCapabilities.length > 0 && (
          <button
            type="button"
            onClick={resetToDefault}
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600"
          >
            <RotateCcw className="w-3 h-3" />
            恢复默认
          </button>
        )}
      </div>
    </div>
  );
}

export default CapabilitiesField;
