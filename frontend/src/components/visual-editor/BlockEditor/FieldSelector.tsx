/**
 * FieldSelector - 字段选择器
 * 
 * 从标签管理系统中选择字段，分门别类展示
 * 所有字段必须经过系统映射
 */

import { useState, useMemo } from 'react';
import { Search, ChevronRight, Plus, Settings, Tag, RefreshCw } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useLabels } from '@/providers/LabelProvider';
import { FIXED_FIELD_KEYS } from './types';

/**
 * 动态获取 Lucide 图标组件
 */
function getLucideIcon(name: string | undefined): React.ComponentType<{ className?: string; size?: number }> | null {
  if (!name) return null;

  // 将 kebab-case 转换为 PascalCase
  const pascalCase = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  // @ts-expect-error - 动态访问
  const Icon = LucideIcons[pascalCase];
  return Icon || null;
}

interface FieldSelectorProps {
  /** 已存在的字段 key 列表 */
  existingKeys: string[];
  /** 选择字段回调 */
  onSelect: (key: string) => void;
  /** 关闭回调 */
  onClose: () => void;
}

export function FieldSelector({ existingKeys, onSelect, onClose }: FieldSelectorProps) {
  const { config, loading, refresh } = useLabels();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // 刷新字段列表
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  // 过滤已存在的字段、固定字段，并按搜索词筛选
  const filteredCategories = useMemo(() => {
    if (!config) return [];

    const existingSet = new Set(existingKeys);

    return config.categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          // 排除已存在的字段
          if (existingSet.has(item.key)) return false;
          // 排除固定字段（它们会自动包含在数据块中）
          if (FIXED_FIELD_KEYS.has(item.key)) return false;
          // 搜索过滤
          if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
              item.key.toLowerCase().includes(term) ||
              item.label.toLowerCase().includes(term)
            );
          }
          return true;
        }),
      }))
      .filter((category) => category.items.length > 0);
  }, [config, existingKeys, searchTerm]);

  // 统计可用字段数
  const totalAvailable = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.items.length, 0);
  }, [filteredCategories]);

  if (loading && !config) {
    return (
      <div className="w-[320px] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 text-center text-slate-400 text-sm">
        加载字段...
      </div>
    );
  }

  return (
    <div className="w-[320px] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Tag size={14} className="text-purple-500" />
            选择字段
          </h3>
          <div className="flex items-center gap-1">
            {/* 刷新按钮 */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-purple-500 
                transition-colors disabled:opacity-50"
              title="刷新字段列表"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 
                text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索字段..."
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400"
            autoFocus
          />
        </div>
      </div>

      {/* 字段列表 */}
      <div className="max-h-[300px] overflow-y-auto">
        {refreshing ? (
          <div className="px-4 py-8 text-center">
            <RefreshCw size={20} className="animate-spin mx-auto text-purple-400 mb-2" />
            <div className="text-slate-400 text-sm">刷新中...</div>
          </div>
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((category) => (
            <div key={category.name} className="border-b border-slate-50 last:border-0">
              {/* 分类标题 */}
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.name ? null : category.name
                )}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors"
              >
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {category.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {category.items.length}
                  </span>
                  <ChevronRight 
                    size={14} 
                    className={`text-slate-400 transition-transform ${
                      expandedCategory === category.name ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </button>

              {/* 字段项 */}
              {(expandedCategory === category.name || searchTerm) && (
                <div className="pb-1">
                  {category.items.map((item) => {
                    const ItemIcon = getLucideIcon(item.icon);
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          onSelect(item.key);
                          onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-purple-50 
                          transition-colors group"
                      >
                        <Plus size={14} className="text-slate-300 group-hover:text-purple-500 flex-shrink-0" />
                        {/* 字段图标 */}
                        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {ItemIcon ? (
                            <ItemIcon size={16} className="text-slate-400 group-hover:text-purple-500" />
                          ) : (
                            <Tag size={14} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm text-slate-700 group-hover:text-purple-700">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            {item.key}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-slate-400 text-sm mb-1">
              {searchTerm ? '没有匹配的字段' : '没有可用字段'}
            </div>
            <div className="text-slate-300 text-xs">
              所有字段都已添加
            </div>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {totalAvailable} 个可用字段
          </span>
          <a
            href="/settings"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-purple-500 hover:text-purple-600"
          >
            <Settings size={12} />
            <span>管理字段</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default FieldSelector;
