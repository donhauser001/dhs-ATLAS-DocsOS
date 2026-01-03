/**
 * DataTemplateSettings - 数据模板管理页面
 * 
 * 提供数据模板的管理功能：
 * - 分类管理（添加/编辑/删除）
 * - 模板管理（查看/删除）
 * - 模板预览
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Trash2,
    Edit2,
    ChevronDown,
    ChevronRight,
    Database,
    Save,
    Lock,
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
// 模板卡片（紧凑样式，与 LabelSettings 一致）
// ============================================================

function TemplateCard({
    template,
    onPreview,
    onDelete,
}: {
    template: DataTemplate;
    onPreview: () => void;
    onDelete?: () => void;
}) {
    return (
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded group border border-transparent hover:border-slate-200 transition-colors">
            {/* 图标 */}
            <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">
                <Database className="h-3.5 w-3.5 text-slate-500" />
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{template.name}</div>
                <code className="text-[10px] text-slate-400 truncate block">
                    {template.fields.length} 个字段
                </code>
            </div>

            {/* 操作 */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                {template.isSystem && (
                    <Lock className="h-3 w-3 text-slate-300 mr-1" title="系统模板" />
                )}
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={onPreview}
                    title="预览模板"
                >
                    <Eye className="h-3 w-3" />
                </Button>
                {!template.isSystem && onDelete && (
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={onDelete}
                        title="删除模板"
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
    onCategoryEdit,
    onCategoryDelete,
    onTemplatePreview,
    onTemplateDelete,
}: {
    category: TemplateCategory;
    onCategoryEdit: () => void;
    onCategoryDelete: () => void;
    onTemplatePreview: (template: DataTemplate) => void;
    onTemplateDelete: (id: string) => void;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="border rounded-lg mb-3 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-slate-50 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Database className="h-4 w-4 text-slate-500" />
                    <span className="font-medium text-sm">{category.name}</span>
                    <span className="text-xs text-slate-500">({category.templates.length})</span>
                    {category.isSystem && (
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">系统</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {!category.isSystem && (
                        <>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCategoryEdit();
                                }}
                                title="编辑分类"
                            >
                                <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-red-500"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCategoryDelete();
                                }}
                                title="删除分类"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Templates - 多列网格 */}
            {expanded && (
                <div className="p-2">
                    {category.templates.length > 0 ? (
                        <div className="grid grid-cols-3 gap-1">
                            {category.templates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onPreview={() => onTemplatePreview(template)}
                                    onDelete={template.isSystem ? undefined : () => onTemplateDelete(template.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-sm text-slate-400">
                            该分类下暂无模板
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================
// 模板预览对话框
// ============================================================

interface TemplatePreviewDialogProps {
    template: DataTemplate | null;
    open: boolean;
    onClose: () => void;
}

function TemplatePreviewDialog({ template, open, onClose }: TemplatePreviewDialogProps) {
    const { getLabel } = useLabels();

    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database size={18} className="text-slate-500" />
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
// 添加/编辑分类对话框
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{category ? '编辑分类' : '添加分类'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                    <Button variant="outline" onClick={onClose} disabled={saving}>取消</Button>
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
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConfig();
    }, []);

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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
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

    if (!config) {
        return <div className="text-red-500 p-4">加载配置失败</div>;
    }

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold">数据模板</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        管理数据块的预设模板，在编辑器中选择"存为模板"来创建新模板。
                    </p>
                </div>
                <Button size="sm" onClick={() => {
                    setEditingCategory(undefined);
                    setCategoryDialogOpen(true);
                }}>
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
                        onCategoryEdit={() => {
                            setEditingCategory(category);
                            setCategoryDialogOpen(true);
                        }}
                        onCategoryDelete={() => handleDeleteCategory(category.id)}
                        onTemplatePreview={setPreviewTemplate}
                        onTemplateDelete={handleDeleteTemplate}
                    />
                ))}
            </ScrollArea>

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
