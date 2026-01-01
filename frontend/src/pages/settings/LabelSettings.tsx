/**
 * LabelSettings - 标签管理页面
 * 
 * 核心原则：
 * - 原始名（key）：写入文档的字段名
 * - 映射名（label）：界面显示的名称
 * 
 * 功能：
 * - 查看系统标签（只能修改映射名和图标）
 * - 添加自定义标签
 * - 添加自定义分类
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Plus,
  Trash2,
  Lock,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import {
  fetchLabelConfig,
  updateLabelItem,
  addLabelItem,
  deleteLabelItem,
  addCategory,
  deleteCategory,
  type LabelConfig,
  type LabelCategory,
  type LabelItem,
} from '@/api/labels';

// ============================================================
// 标签卡片（紧凑多列）
// ============================================================

function LabelCard({
  item,
  onEdit,
  onDelete,
}: {
  item: LabelItem;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  const Icon = item.icon ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
    item.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  ] : null;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded group border border-transparent hover:border-slate-200 transition-colors">
      {/* 图标 */}
      <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">
        {Icon ? <Icon className="h-3.5 w-3.5 text-slate-500" /> : <span className="text-slate-300 text-xs">-</span>}
      </div>
      
      {/* 内容 */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{item.label}</div>
        <code className="text-[10px] text-slate-400 truncate block">{item.key}</code>
      </div>
      
      {/* 操作 */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {item.isSystem && (
          <Lock className="h-3 w-3 text-slate-300 mr-1" title="系统标签" />
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onEdit}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        {!item.isSystem && onDelete && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 分类折叠面板
// ============================================================

function CategoryPanel({
  category,
  onLabelSave,
  onLabelDelete,
  onLabelAdd,
  onCategoryDelete,
}: {
  category: LabelCategory;
  onLabelSave: (key: string, updates: Partial<LabelItem>) => Promise<void>;
  onLabelDelete: (key: string) => Promise<void>;
  onLabelAdd: (item: Omit<LabelItem, 'isSystem'>) => Promise<void>;
  onCategoryDelete: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editingItem, setEditingItem] = useState<LabelItem | null>(null);
  const [addingLabel, setAddingLabel] = useState(false);
  
  // 编辑状态
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [saving, setSaving] = useState(false);
  
  // 新增状态
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('');

  function openEdit(item: LabelItem) {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditIcon(item.icon || '');
  }

  async function handleSaveEdit() {
    if (!editingItem) return;
    setSaving(true);
    try {
      await onLabelSave(editingItem.key, { label: editLabel, icon: editIcon || undefined });
      setEditingItem(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLabel() {
    if (!newKey || !newLabel) {
      alert('请填写原始名和映射名');
      return;
    }
    setSaving(true);
    try {
      await onLabelAdd({ key: newKey, label: newLabel, icon: newIcon || undefined });
      setNewKey('');
      setNewLabel('');
      setNewIcon('');
      setAddingLabel(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加失败');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-lg mb-3 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium text-sm">{category.name}</span>
          <span className="text-xs text-slate-500">({category.items.length})</span>
          {category.isSystem && (
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">系统</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setAddingLabel(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加
          </Button>
          {!category.isSystem && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('确定删除此分类？')) onCategoryDelete();
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Items - 多列网格 */}
      {expanded && (
        <div className="p-2">
          <div className="grid grid-cols-3 gap-1">
            {category.items.map((item) => (
              <LabelCard
                key={item.key}
                item={item}
                onEdit={() => openEdit(item)}
                onDelete={item.isSystem ? undefined : () => onLabelDelete(item.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 编辑弹窗 */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑标签</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-500">原始名（不可修改）</label>
                <code className="block mt-1 px-3 py-2 bg-slate-100 rounded text-sm">
                  {editingItem.key}
                </code>
              </div>
              <div>
                <label className="text-sm font-medium">映射名称</label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="mt-1"
                  placeholder="界面显示的名称"
                />
              </div>
              <div>
                <label className="text-sm font-medium">图标</label>
                <div className="mt-1 flex items-center gap-2">
                  <IconPicker value={editIcon} onChange={setEditIcon} />
                  <span className="text-sm text-slate-500">{editIcon || '未设置'}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加弹窗 */}
      <Dialog open={addingLabel} onOpenChange={setAddingLabel}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加标签到「{category.name}」</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">原始名（Key）</label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="mt-1"
                placeholder="英文，如 my_field"
              />
              <p className="text-xs text-slate-500 mt-1">只能使用字母、数字和下划线，必须以字母开头</p>
            </div>
            <div>
              <label className="text-sm font-medium">映射名称</label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="mt-1"
                placeholder="界面显示的名称"
              />
            </div>
            <div>
              <label className="text-sm font-medium">图标</label>
              <div className="mt-1 flex items-center gap-2">
                <IconPicker value={newIcon} onChange={setNewIcon} />
                <span className="text-sm text-slate-500">{newIcon || '未设置'}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddingLabel(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleAddLabel} disabled={saving}>
              {saving ? '添加中...' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export function LabelSettings() {
  const [config, setConfig] = useState<LabelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // 加载配置
  async function loadConfig() {
    try {
      setLoading(true);
      const data = await fetchLabelConfig();
      setConfig(data);
    } catch (e) {
      console.error('Failed to load label config:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadConfig();
  }, []);

  // 保存标签
  async function handleLabelSave(key: string, updates: Partial<LabelItem>) {
    await updateLabelItem(key, updates);
    loadConfig();
  }

  // 删除标签
  async function handleLabelDelete(key: string) {
    if (!confirm(`确定删除标签 "${key}"？`)) return;
    await deleteLabelItem(key);
    loadConfig();
  }

  // 添加标签
  async function handleLabelAdd(categoryId: string, item: Omit<LabelItem, 'isSystem'>) {
    await addLabelItem(categoryId, item);
    loadConfig();
  }

  // 删除分类
  async function handleCategoryDelete(id: string) {
    await deleteCategory(id);
    loadConfig();
  }

  // 添加分类
  async function handleAddCategory() {
    if (!newCategoryId || !newCategoryName) {
      alert('请填写分类 ID 和名称');
      return;
    }
    try {
      await addCategory(newCategoryId, newCategoryName);
      setNewCategoryId('');
      setNewCategoryName('');
      setAddCategoryOpen(false);
      loadConfig();
    } catch (e) {
      alert(e instanceof Error ? e.message : '添加失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!config) {
    return <div className="text-red-500 p-4">加载配置失败</div>;
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">标签管理</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            配置字段的显示名称和图标。原始名写入文档，映射名用于界面显示。
          </p>
        </div>
        <Button size="sm" onClick={() => setAddCategoryOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          添加分类
        </Button>
      </div>

      {/* Categories */}
      <ScrollArea className="h-[calc(100vh-180px)]">
        {config.categories.map((category) => (
          <CategoryPanel
            key={category.id}
            category={category}
            onLabelSave={handleLabelSave}
            onLabelDelete={handleLabelDelete}
            onLabelAdd={(item) => handleLabelAdd(category.id, item)}
            onCategoryDelete={() => handleCategoryDelete(category.id)}
          />
        ))}
      </ScrollArea>

      {/* Add Category Dialog */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加分类</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">分类 ID</label>
              <Input
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                placeholder="英文，如 my_custom"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">分类名称</label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="如：我的自定义标签"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddCategory}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default LabelSettings;
