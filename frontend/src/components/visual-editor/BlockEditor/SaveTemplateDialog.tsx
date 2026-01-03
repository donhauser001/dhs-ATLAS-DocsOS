/**
 * SaveTemplateDialog - 保存数据块为模板的对话框
 */

import { useState, useEffect } from 'react';
import { Database, Save, FolderPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    fetchTemplateConfig,
    createTemplateFromData,
    addCategory,
    type TemplateCategory,
    type TemplateComponent,
    type TemplateStatusOption,
    type TemplateIdConfig,
} from '@/api/data-templates';

interface SaveTemplateDialogProps {
    /** 是否打开 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** 数据类型 */
    dataType: string;
    /** 字段 key 列表 */
    fieldKeys: string[];
    /** 字段-组件绑定 */
    bindings?: Record<string, string>;
    /** 文档中的组件定义 */
    documentComponents?: Record<string, TemplateComponent>;
    /** 状态选项配置 */
    statusOptions?: TemplateStatusOption[];
    /** 编号配置 */
    idConfig?: TemplateIdConfig;
}

export function SaveTemplateDialog({
    open,
    onClose,
    dataType,
    fieldKeys,
    bindings = {},
    documentComponents = {},
    statusOptions,
    idConfig,
}: SaveTemplateDialogProps) {
    const [categories, setCategories] = useState<TemplateCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // 表单状态
    const [categoryId, setCategoryId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [templateName, setTemplateName] = useState('');
    const [description, setDescription] = useState('');

    // 新建分类状态
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryId, setNewCategoryId] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');

    // 加载分类列表
    useEffect(() => {
        if (open) {
            loadCategories();
            // 设置默认值
            setTemplateId(`${dataType}-${Date.now().toString(36).slice(-4)}`);
            setTemplateName(`${dataType} 模板`);
            setDescription('');
            setError('');
        }
    }, [open, dataType]);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const config = await fetchTemplateConfig();
            setCategories(config.categories);
            // 默认选择第一个非系统分类，或者第一个分类
            const defaultCategory = config.categories.find(c => !c.isSystem) || config.categories[0];
            if (defaultCategory) {
                setCategoryId(defaultCategory.id);
            }
        } catch (err) {
            setError('加载分类失败');
        } finally {
            setLoading(false);
        }
    };

    // 创建新分类
    const handleCreateCategory = async () => {
        if (!newCategoryId.trim() || !newCategoryName.trim()) {
            setError('请填写分类 ID 和名称');
            return;
        }

        try {
            await addCategory(newCategoryId.trim(), newCategoryName.trim());
            await loadCategories();
            setCategoryId(newCategoryId.trim());
            setShowNewCategory(false);
            setNewCategoryId('');
            setNewCategoryName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : '创建分类失败');
        }
    };

    // 保存模板
    const handleSave = async () => {
        if (!categoryId) {
            setError('请选择一个分类');
            return;
        }
        if (!templateId.trim() || !templateName.trim()) {
            setError('请填写模板 ID 和名称');
            return;
        }

        setSaving(true);
        setError('');
        try {
            // 只保存被绑定使用的组件
            const usedComponentIds = new Set(Object.values(bindings));
            const relevantComponents: Record<string, TemplateComponent> = {};
            for (const [compId, comp] of Object.entries(documentComponents)) {
                if (usedComponentIds.has(compId)) {
                    relevantComponents[compId] = comp;
                }
            }

            await createTemplateFromData({
                categoryId,
                templateId: templateId.trim(),
                name: templateName.trim(),
                description: description.trim(),
                dataType,
                fieldKeys,
                bindings: Object.keys(bindings).length > 0 ? bindings : undefined,
                components: Object.keys(relevantComponents).length > 0 ? relevantComponents : undefined,
                statusOptions: statusOptions && statusOptions.length > 0 ? statusOptions : undefined,
                idConfig,
            });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Database size={18} className="text-purple-500" />
                        保存为数据模板
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* 分类选择 */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">选择分类</label>
                        <div className="flex gap-2 mt-1">
                            <div className="relative flex-1">
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    disabled={loading}
                                    className="w-full h-10 px-3 pr-8 text-sm bg-white border border-slate-200 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400
                    disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                                >
                                    <option value="">选择分类</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} {cat.isSystem ? '(系统)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setShowNewCategory(!showNewCategory)}
                                title="新建分类"
                            >
                                <FolderPlus size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* 新建分类表单 */}
                    {showNewCategory && (
                        <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                            <div className="text-sm font-medium text-slate-600">新建分类</div>
                            <div className="flex gap-2">
                                <Input
                                    value={newCategoryId}
                                    onChange={(e) => setNewCategoryId(e.target.value)}
                                    placeholder="分类 ID"
                                    className="flex-1"
                                />
                                <Input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="分类名称"
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setShowNewCategory(false)}>
                                    取消
                                </Button>
                                <Button size="sm" onClick={handleCreateCategory}>
                                    创建
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 模板 ID */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">模板 ID</label>
                        <Input
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            placeholder="唯一标识符，如 my-template"
                            className="mt-1"
                        />
                    </div>

                    {/* 模板名称 */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">模板名称</label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="显示名称"
                            className="mt-1"
                        />
                    </div>

                    {/* 描述 */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">描述（可选）</label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="模板用途说明"
                            className="mt-1"
                        />
                    </div>

                    {/* 字段预览 */}
                    <div>
                        <label className="text-sm font-medium text-slate-700">包含字段</label>
                        <div className="mt-1 p-2 bg-slate-50 rounded-lg">
                            <div className="flex flex-wrap gap-1">
                                {fieldKeys.map((key) => {
                                    const boundComponentId = bindings[key];
                                    const boundComponent = boundComponentId ? documentComponents[boundComponentId] : null;
                                    return (
                                        <span
                                            key={key}
                                            className={`text-xs px-2 py-0.5 rounded ${boundComponent
                                                    ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                                    : 'bg-white border border-slate-200'
                                                }`}
                                            title={boundComponent ? `绑定组件: ${boundComponent.label}` : undefined}
                                        >
                                            {key}
                                            {boundComponent && (
                                                <span className="ml-1 text-purple-400">⚡</span>
                                            )}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* 关联组件预览 */}
                    {Object.keys(bindings).length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-slate-700">关联组件</label>
                            <div className="mt-1 p-2 bg-purple-50 rounded-lg">
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(bindings).map(([, compId]) => {
                                        const comp = documentComponents[compId];
                                        if (!comp) return null;
                                        return (
                                            <span
                                                key={compId}
                                                className="text-xs px-2 py-0.5 bg-white border border-purple-200 rounded text-purple-700"
                                            >
                                                {comp.label} ({comp.type})
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-purple-600 mt-1">
                                    这些组件将随模板一起保存
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 错误信息 */}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        <Save size={16} className="mr-1" />
                        {saving ? '保存中...' : '保存模板'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default SaveTemplateDialog;

