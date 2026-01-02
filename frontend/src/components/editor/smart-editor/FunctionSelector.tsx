/**
 * ATLAS 功能选择器组件
 * 根据文档类型过滤可选功能
 */

import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Check, Shield, UserCircle, Building, List,
  FileText, FolderKanban, Server, FolderTree, Settings, Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FunctionTypeItem } from './types';

// 功能类型定义
export const ATLAS_FUNCTIONS: FunctionTypeItem[] = [
  {
    key: 'principal',
    label: '登录主体',
    description: '代表可登录系统的用户实体，具有身份认证能力',
    icon: 'user-circle',
    color: 'blue',
    examples: '用户账号、管理员、访客',
  },
  {
    key: 'client',
    label: '客户',
    description: '业务客户实体，通常关联多个联系人和项目',
    icon: 'building',
    color: 'emerald',
    examples: '企业客户、合作伙伴、供应商',
  },
  {
    key: 'entity_list',
    label: '实体列表',
    description: '存储同类型实体的集合，支持分页和筛选',
    icon: 'list',
    color: 'violet',
    examples: '联系人列表、产品目录、订单记录',
  },
  {
    key: 'entity_detail',
    label: '实体详情',
    description: '单个实体的完整信息，包含所有字段和关联',
    icon: 'file-text',
    color: 'cyan',
    examples: '用户详情页、产品详情、订单详情',
  },
  {
    key: 'project',
    label: '项目',
    description: '项目管理实体，追踪任务和里程碑',
    icon: 'folder-kanban',
    color: 'green',
    examples: '开发项目、营销活动、实施计划',
  },
  {
    key: 'service',
    label: '服务',
    description: '提供的服务或产品定义',
    icon: 'server',
    color: 'orange',
    examples: '咨询服务、技术支持、培训课程',
  },
  {
    key: 'category',
    label: '分类',
    description: '用于组织和分组其他实体的分类节点',
    icon: 'folder-tree',
    color: 'amber',
    examples: '产品分类、部门分组、标签体系',
  },
  {
    key: 'config',
    label: '系统配置',
    description: '系统级配置文档，影响全局行为',
    icon: 'settings',
    color: 'slate',
    examples: '显示配置、权限设置、集成配置',
  },
  {
    key: 'registry',
    label: '注册表',
    description: '类型定义和元数据注册中心',
    icon: 'database',
    color: 'purple',
    examples: '标签注册表、类型定义、Schema',
  },
];

// 文档类型与功能的映射关系
export const TYPE_FUNCTION_MAP: Record<string, string[]> = {
  facts: ['principal', 'client', 'entity_list', 'entity_detail', 'service', 'category'],
  project: ['project', 'category'],
  note: [],
  system: ['config', 'registry'],
  navigation: ['category'],
  config: ['config'],
};

// 功能 → 默认能力的映射关系
export const FUNCTION_CAPABILITIES_MAP: Record<string, string[]> = {
  principal: ['auth.login', 'auth.session'],
  client: ['crud.read', 'crud.update'],
  entity_list: ['crud.list', 'crud.filter', 'crud.search'],
  entity_detail: ['crud.read', 'crud.update', 'crud.delete'],
  project: ['crud.read', 'crud.update', 'workflow.status'],
  service: ['crud.read'],
  category: ['crud.read', 'nav.group'],
  config: ['system.config'],
  registry: ['system.registry'],
};

/**
 * 获取功能的默认能力
 */
export function getDefaultCapabilities(functionKey: string): string[] {
  return FUNCTION_CAPABILITIES_MAP[functionKey] || [];
}

// 颜色样式映射
const COLOR_CLASSES: Record<string, { bg: string; hover: string; icon: string }> = {
  blue: { bg: 'bg-blue-50', hover: 'hover:bg-blue-50', icon: 'bg-blue-100 text-blue-600' },
  emerald: { bg: 'bg-emerald-50', hover: 'hover:bg-emerald-50', icon: 'bg-emerald-100 text-emerald-600' },
  violet: { bg: 'bg-violet-50', hover: 'hover:bg-violet-50', icon: 'bg-violet-100 text-violet-600' },
  cyan: { bg: 'bg-cyan-50', hover: 'hover:bg-cyan-50', icon: 'bg-cyan-100 text-cyan-600' },
  green: { bg: 'bg-green-50', hover: 'hover:bg-green-50', icon: 'bg-green-100 text-green-600' },
  orange: { bg: 'bg-orange-50', hover: 'hover:bg-orange-50', icon: 'bg-orange-100 text-orange-600' },
  amber: { bg: 'bg-amber-50', hover: 'hover:bg-amber-50', icon: 'bg-amber-100 text-amber-600' },
  slate: { bg: 'bg-slate-100', hover: 'hover:bg-slate-100', icon: 'bg-slate-200 text-slate-600' },
  purple: { bg: 'bg-purple-50', hover: 'hover:bg-purple-50', icon: 'bg-purple-100 text-purple-600' },
};

// 图标映射
function getFunctionIcon(iconName: string) {
  switch (iconName) {
    case 'user-circle': return <UserCircle className="w-3.5 h-3.5" />;
    case 'building': return <Building className="w-3.5 h-3.5" />;
    case 'list': return <List className="w-3.5 h-3.5" />;
    case 'file-text': return <FileText className="w-3.5 h-3.5" />;
    case 'folder-kanban': return <FolderKanban className="w-3.5 h-3.5" />;
    case 'server': return <Server className="w-3.5 h-3.5" />;
    case 'folder-tree': return <FolderTree className="w-3.5 h-3.5" />;
    case 'settings': return <Settings className="w-3.5 h-3.5" />;
    case 'database': return <Database className="w-3.5 h-3.5" />;
    default: return <Shield className="w-3.5 h-3.5" />;
  }
}

interface FunctionSelectorProps {
  value: string;
  documentType: string;
  onChange: (value: string) => void;
}

export function FunctionSelector({ value, documentType, onChange }: FunctionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 根据文档类型过滤可用功能
  // 注意：空数组 [] 表示该类型不需要功能，undefined 表示显示所有功能
  const allowedFunctions = TYPE_FUNCTION_MAP[documentType];
  const availableFunctions = allowedFunctions === undefined
    ? ATLAS_FUNCTIONS  // 未定义时显示所有功能（向后兼容）
    : ATLAS_FUNCTIONS.filter(f => allowedFunctions.includes(f.key));

  // 当无可用功能时，不显示任何选中值
  const currentFunction = availableFunctions.length > 0
    ? (availableFunctions.find(f => f.key === value) || availableFunctions[0])
    : null;

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

  const handleSelect = (funcKey: string) => {
    onChange(funcKey);
    setIsOpen(false);
  };

  const getColorClass = (color: string, isSelected: boolean) => {
    const c = COLOR_CLASSES[color] || COLOR_CLASSES.blue;
    return isSelected ? c.bg : c.hover;
  };

  const getIconColorClass = (color: string) => {
    return COLOR_CLASSES[color]?.icon || COLOR_CLASSES.blue.icon;
  };

  // 无可用功能时，显示禁用状态
  if (!currentFunction) {
    return (
      <div className="px-2 py-1.5 text-xs bg-slate-100 text-slate-400 rounded border border-slate-200 flex items-center gap-2">
        <span className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-slate-400" />
        </span>
        <span>此类型无需指定功能</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 功能显示按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-2 py-1.5 text-xs rounded border flex items-center justify-between gap-2',
          'bg-white text-slate-700 border-slate-200',
          'hover:border-blue-400 hover:bg-blue-50 transition-colors',
          isOpen && 'border-blue-500 ring-1 ring-blue-500'
        )}
      >
        <div className="flex items-center gap-2">
          <span className={cn('w-5 h-5 rounded flex items-center justify-center', getIconColorClass(currentFunction.color))}>
            {getFunctionIcon(currentFunction.icon)}
          </span>
          <span className="font-medium">{currentFunction.label}</span>
        </div>
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[320px] max-h-[400px] overflow-y-auto">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 sticky top-0">
            <p className="text-[10px] text-slate-500 font-medium">
              选择文档功能
              <span className="text-slate-400 ml-1">（{documentType} 类型可用 {availableFunctions.length} 项）</span>
            </p>
          </div>

          {availableFunctions.map((func, index) => {
            const isSelected = func.key === value;
            return (
              <button
                key={func.key}
                type="button"
                onClick={() => handleSelect(func.key)}
                className={cn(
                  "w-full px-3 py-2.5 text-left text-xs flex items-start gap-3 transition-colors",
                  index < availableFunctions.length - 1 && "border-b border-slate-100",
                  getColorClass(func.color, isSelected)
                )}
              >
                <span className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5', getIconColorClass(func.color))}>
                  {getFunctionIcon(func.icon)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">{func.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      {func.key}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{func.description}</p>
                  <p className="text-slate-400 mt-1 text-[10px]">
                    <span className="text-slate-500">示例：</span>{func.examples}
                  </p>
                </div>
                {isSelected && <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FunctionSelector;

