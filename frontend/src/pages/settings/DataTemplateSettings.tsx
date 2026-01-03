/**
 * DataTemplateSettings - 数据模板管理页面
 * 
 * 提供数据模板的管理功能：
 * - 分类管理（添加/编辑/删除）
 * - 模板管理（查看/编辑/删除）
 * - 模板预览
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  Database, 
  Layers,
  Save,
  X,
  Lock,
  RefreshCw,
  Eye,
} from 'lucide-react';
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
  fetchTemplateConfig,
  addCategory,
  updateCategory,
  deleteCategory,
  deleteTemplate,
  type DataTemplateConfig,
  type TemplateCategory,
  type DataTemplate,
} from '@/api/data-templates';
import { useLabels } from '@/providers/LabelProvider';

// ============================================================
// 子组件：分类列表项
// ============================================================

interface CategoryItemProps {
  category: TemplateCategory;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryItem({ category, isSelected, onSelect, onEdit, onDelete }: CategoryItemProps) {
  return (
    <div
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Layers size={16} className={isSelected ? 'text-purple-500' : 'text-slate-400'} />
        <span className="text-sm font-medium truncate">{category.name}</span>
        <span className="text-xs text-slate-400">({category.templates.length})</span>
        {category.isSystem && <Lock size={12} className="text-slate-300" />}
      </div>
      {!category.isSystem && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1 rounded hover:bg-slate-200"
          >
            <Edit2 size={12} className="text-slate-500" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1 rounded hover:bg-red-100"
          >
            <Trash2 size={12} className="text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 子组件：模板列表项
// ============================================================

interface TemplateItemProps {
  template: DataTemplate;
  onPreview: () => void;
  onDelete: () => void;
}

function TemplateItem({ template, onPreview, onDelete }: TemplateItemProps) {
  const { getLabel } = useLabels();

  return (
    <div className="group border border-slate-200 rounded-xl p-4 hover:border-purple-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-purple-500" />
            <span className="font-medium text-slate-800">{template.name}</span>
            {template.isSystem && <Lock size={12} className="text-slate-300" />}
          </div>
          {template.description && (
            <p className="text-xs text-slate-500 mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
          <button
            onClick={onPreview}
            className="p-1.5 rounded-lg hover:bg-purple-50"
            title="预览模板"
          >
            <Eye size={14} className="text-purple-500" />
          </button>
          {!template.isSystem && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50"
              title="删除模板"
            >
              <Trash2 size={14} className="text-red-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* 字段预览 */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">
          包含 {template.fields.length} 个字段
        </div>
        <div className="flex flex-wrap gap-1">
          {template.fields.slice(0, 8).map((field) => (
            <span
              key={field.key}
              className={`text-xs px-2 py-0.5 rounded-full ${
                field.required 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {getLabel(field.key)}
            </span>
          ))}
          {template.fields.length > 8 && (
            <span className="text-xs text-slate-400">+{template.fields.length - 8}</span>
          )}
        </div>
      </div>
      
      {/* 元信息 */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-400">
        <span>类型: {template.dataType}</span>
        <span>更新: {new Date(template.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：模板预览对话框
// ============================================================

interface TemplatePreviewDialogProps {
  template: DataTemplate | null;
  open: boolean;
  onClose: () => void;
}

function TemplatePreviewDialog({ template, open, onClose }: TemplatePreviewDialogProps) {
  const { getLabel, getIcon } = useLabels();

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={18} className="text-purple-500" />
            {template.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {template.description && (
            <p className="text-sm text-slate-500">{template.description}</p>
          )}
          
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">字段列表</h4>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {template.fields.map((field) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-700">{getLabel(field.key)}</span>
                    {field.required && (
                      <span className="text-[10px] text-red-500">*必填</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{field.key}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t">
            <span>数据类型: {template.dataType}</span>
            <span>创建: {new Date(template.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 子组件：添加/编辑分类对话框
// ============================================================

interface CategoryDialogProps {
  category?: TemplateCategory;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
}

function CategoryDialog({ category, open, onClose, onSave }: CategoryDialogProps) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setId(category.id);
      setName(category.name);
      setDescription(category.description || '');
    } else {
      setId('');
      setName('');
      setDescription('');
    }
    setError('');
  }, [category, open]);

  const handleSave = async () => {
    if (!id.trim() || !name.trim()) {
      setError('请填写分类 ID 和名称');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(id.trim(), name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? '编辑分类' : '添加分类'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">分类 ID</label>
            <Input
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="如: custom-templates"
              disabled={!!category}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">分类名称</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如: 自定义模板"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">描述（可选）</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="分类描述"
              className="mt-1"
            />
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 主组件
// ============================================================

export function DataTemplateSettings() {
  const [config, setConfig] = useState<DataTemplateConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // 对话框状态
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TemplateCategory | undefined>();
  const [previewTemplate, setPreviewTemplate] = useState<DataTemplate | null>(null);

  // 加载配置
  const loadConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTemplateConfig();
      setConfig(data);
      if (!selectedCategoryId && data.categories.length > 0) {
        setSelectedCategoryId(data.categories[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    loadConfig();
  }, []);

  // 获取当前选中的分类
  const selectedCategory = config?.categories.find(c => c.id === selectedCategoryId);

  // 添加分类
  const handleAddCategory = async (id: string, name: string, description: string) => {
    await addCategory(id, name, description);
    await loadConfig();
  };

  // 编辑分类
  const handleEditCategory = async (id: string, name: string, description: string) => {
    await updateCategory(id, name, description);
    await loadConfig();
  };

  // 删除分类
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('确定要删除这个分类吗？分类下的所有模板也会被删除。')) return;
    await deleteCategory(id);
    if (selectedCategoryId === id) {
      setSelectedCategoryId(config?.categories[0]?.id || null);
    }
    await loadConfig();
  };

  // 删除模板
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;
    await deleteTemplate(id);
    await loadConfig();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={loadConfig}>重试</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* 左侧：分类列表 */}
      <div className="w-64 border-r bg-slate-50/50 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium text-slate-700">模板分类</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingCategory(undefined);
              setCategoryDialogOpen(true);
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {config?.categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                isSelected={selectedCategoryId === category.id}
                onSelect={() => setSelectedCategoryId(category.id)}
                onEdit={() => {
                  setEditingCategory(category);
                  setCategoryDialogOpen(true);
                }}
                onDelete={() => handleDeleteCategory(category.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* 右侧：模板列表 */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-slate-800">
              {selectedCategory?.name || '选择一个分类'}
            </h2>
            {selectedCategory?.description && (
              <p className="text-sm text-slate-500">{selectedCategory.description}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={loadConfig}>
            <RefreshCw size={16} />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {selectedCategory ? (
            selectedCategory.templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCategory.templates.map((template) => (
                  <TemplateItem
                    key={template.id}
                    template={template}
                    onPreview={() => setPreviewTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500">该分类下暂无模板</p>
                <p className="text-sm text-slate-400 mt-1">
                  在编辑器中选择"存为模板"来创建新模板
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">请选择一个分类</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* 分类编辑对话框 */}
      <CategoryDialog
        category={editingCategory}
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSave={editingCategory ? handleEditCategory : handleAddCategory}
      />

      {/* 模板预览对话框 */}
      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
      />
    </div>
  );
}

export default DataTemplateSettings;

