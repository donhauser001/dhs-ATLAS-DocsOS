/**
 * SlashCommands - Slash 命令菜单
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 功能：
 * - 输入 / 触发命令菜单
 * - 快速插入 Block 模板
 * - 智能引用补全
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  User,
  Building2,
  FolderKanban,
  Settings,
  Database,
  List,
  Hash,
  Link,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 命令定义
 */
interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'block' | 'ref' | 'other';
  template?: string;
}

/**
 * 预定义命令列表
 */
const COMMANDS: SlashCommand[] = [
  {
    id: 'principal',
    label: 'Principal',
    description: '创建用户/联系人 Block',
    icon: User,
    category: 'block',
    template: `## 新用户 {#u-new}

\`\`\`yaml
type: principal
id: u-new
status: active
display_name: 新用户
identity:
  emails: []
\`\`\`

添加描述...`,
  },
  {
    id: 'client',
    label: 'Client',
    description: '创建客户 Block',
    icon: Building2,
    category: 'block',
    template: `## 新客户 {#c-new}

\`\`\`yaml
type: client
id: c-new
status: active
display_name: 新客户
contacts: []
\`\`\`

添加客户描述...`,
  },
  {
    id: 'project',
    label: 'Project',
    description: '创建项目 Block',
    icon: FolderKanban,
    category: 'block',
    template: `## 新项目 {#proj-new}

\`\`\`yaml
type: project
id: proj-new
status: active
title: 新项目
client: null
budget: null
\`\`\`

项目描述...`,
  },
  {
    id: 'service',
    label: 'Service',
    description: '创建服务 Block',
    icon: Settings,
    category: 'block',
    template: `## 新服务 {#svc-new}

\`\`\`yaml
type: service
id: svc-new
status: active
title: 新服务
price:
  base: 0
  unit: 小时
  currency: CNY
\`\`\`

服务描述...`,
  },
  {
    id: 'category',
    label: 'Category',
    description: '创建分类 Block',
    icon: Database,
    category: 'block',
    template: `## 新分类 {#cat-new}

\`\`\`yaml
type: category
id: cat-new
status: active
title: 新分类
\`\`\`

分类描述...`,
  },
  {
    id: 'entity_index',
    label: 'Entity Index',
    description: '创建实体索引 Block',
    icon: List,
    category: 'block',
    template: `## 实体索引 {#idx-new}

\`\`\`yaml
type: entity_index
id: idx-new
status: active
title: 实体索引
entities: []
\`\`\``,
  },
  {
    id: 'ref',
    label: '引用',
    description: '插入文档/Block 引用',
    icon: Link,
    category: 'ref',
    template: '[→ 引用名称](#anchor)',
  },
  {
    id: 'anchor',
    label: '锚点',
    description: '插入锚点标记',
    icon: Hash,
    category: 'other',
    template: '{#anchor}',
  },
];

interface SlashCommandsProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 搜索关键词 */
  searchTerm: string;
  /** 选择命令回调 */
  onSelect: (command: SlashCommand) => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 位置 */
  position?: { x: number; y: number };
}

export function SlashCommands({
  isOpen,
  searchTerm,
  onSelect,
  onClose,
  position,
}: SlashCommandsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 过滤命令
  const filteredCommands = COMMANDS.filter(cmd => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      cmd.id.toLowerCase().includes(term) ||
      cmd.label.toLowerCase().includes(term) ||
      cmd.description.toLowerCase().includes(term)
    );
  });
  
  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);
  
  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onSelect, onClose]);
  
  // 注册键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  if (!isOpen || filteredCommands.length === 0) {
    return null;
  }
  
  // 按类别分组
  const blockCommands = filteredCommands.filter(c => c.category === 'block');
  const refCommands = filteredCommands.filter(c => c.category === 'ref');
  const otherCommands = filteredCommands.filter(c => c.category === 'other');
  
  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
    >
      {/* 搜索提示 */}
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Search className="w-4 h-4" />
          <span>
            {searchTerm ? `搜索: ${searchTerm}` : '输入命令或搜索...'}
          </span>
        </div>
      </div>
      
      {/* 命令列表 */}
      <div className="max-h-64 overflow-y-auto">
        {blockCommands.length > 0 && (
          <CommandGroup
            title="Block 模板"
            commands={blockCommands}
            selectedIndex={selectedIndex}
            onSelect={onSelect}
          />
        )}
        
        {refCommands.length > 0 && (
          <CommandGroup
            title="引用"
            commands={refCommands}
            selectedIndex={selectedIndex - blockCommands.length}
            onSelect={onSelect}
          />
        )}
        
        {otherCommands.length > 0 && (
          <CommandGroup
            title="其他"
            commands={otherCommands}
            selectedIndex={selectedIndex - blockCommands.length - refCommands.length}
            onSelect={onSelect}
          />
        )}
      </div>
      
      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
        ↑↓ 导航 · Enter 选择 · Esc 关闭
      </div>
    </div>
  );
}

/**
 * 命令分组组件
 */
interface CommandGroupProps {
  title: string;
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (command: SlashCommand) => void;
}

function CommandGroup({ title, commands, selectedIndex, onSelect }: CommandGroupProps) {
  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50">
        {title}
      </div>
      {commands.map((cmd, index) => {
        const Icon = cmd.icon;
        return (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors',
              index === selectedIndex && 'bg-blue-50'
            )}
          >
            <Icon className="w-5 h-5 text-slate-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900">
                {cmd.label}
              </div>
              <div className="text-xs text-slate-500 truncate">
                {cmd.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * 智能引用搜索组件
 */
interface SmartRefsProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 搜索关键词 */
  searchTerm: string;
  /** 可用的锚点列表 */
  anchors: Array<{ id: string; title: string; type: string }>;
  /** 选择回调 */
  onSelect: (anchor: { id: string; title: string; type: string }) => void;
  /** 关闭回调 */
  onClose: () => void;
  /** 位置 */
  position?: { x: number; y: number };
}

export function SmartRefs({
  isOpen,
  searchTerm,
  anchors,
  onSelect,
  onClose,
  position,
}: SmartRefsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // 过滤锚点
  const filteredAnchors = anchors.filter(anchor => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      anchor.id.toLowerCase().includes(term) ||
      anchor.title.toLowerCase().includes(term) ||
      anchor.type.toLowerCase().includes(term)
    );
  });
  
  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);
  
  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredAnchors.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredAnchors[selectedIndex]) {
            onSelect(filteredAnchors[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredAnchors, selectedIndex, onSelect, onClose]);
  
  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  if (!isOpen || filteredAnchors.length === 0) {
    return null;
  }
  
  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
      }}
    >
      <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link className="w-4 h-4" />
          <span>选择引用目标</span>
        </div>
      </div>
      
      <div className="max-h-48 overflow-y-auto">
        {filteredAnchors.map((anchor, index) => (
          <button
            key={anchor.id}
            onClick={() => onSelect(anchor)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors',
              index === selectedIndex && 'bg-blue-50'
            )}
          >
            <Hash className="w-4 h-4 text-slate-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {anchor.title}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                #{anchor.id}
              </div>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {anchor.type}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default SlashCommands;

