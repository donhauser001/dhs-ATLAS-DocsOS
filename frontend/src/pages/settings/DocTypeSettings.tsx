/**
 * DocTypeSettings - 文档类型管理页面
 * 
 * 查看和编辑文档的本质类型定义：
 * - 系统类型：用户、配置、模板
 * - 业务类型：客户、联系人、项目、任务
 * - 内容类型：文章、笔记、相册
 * 
 * 注意：类型本身需要开发实现，此页面只允许编辑显示配置
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
    Settings,
    Building,
    FileText,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import { FunctionTypeSelector } from '@/components/ui/function-type-selector';
import { DisplayModeSelector } from '@/components/ui/display-mode-selector';
import {
    fetchDocTypeConfig,
    updateDocType,
    type DocTypeConfig,
    type DocTypeGroup,
    type DocTypeItem,
    type DocTypeCategory,
} from '@/api/doc-types';

// ============================================================
// 分类图标映射
// ============================================================

const CATEGORY_ICONS: Record<DocTypeCategory, React.ReactNode> = {
    system: <Settings className="h-4 w-4" />,
    business: <Building className="h-4 w-4" />,
    content: <FileText className="h-4 w-4" />,
};

// ============================================================
// 类型卡片
// ============================================================

function TypeCard({
    item,
    onEdit,
}: {
    item: DocTypeItem;
    onEdit: () => void;
}) {
    const Icon = item.icon
        ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
            item.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        ]
        : null;

    return (
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded group border border-transparent hover:border-slate-200 transition-colors">
            {/* 图标 */}
            <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">
                {Icon ? <Icon className="h-3.5 w-3.5 text-slate-500" /> : <span className="text-slate-300 text-xs">-</span>}
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <code className="text-[10px] text-slate-400 truncate block">{item.id}</code>
            </div>

            {/* 操作 */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={onEdit}
                    title="编辑显示配置"
                >
                    <Edit2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

// ============================================================
// 分组折叠面板
// ============================================================

function GroupPanel({
    group,
    onTypeSave,
}: {
    group: DocTypeGroup;
    onTypeSave: (id: string, updates: Partial<DocTypeItem>) => Promise<void>;
}) {
    const [expanded, setExpanded] = useState(true);
    const [editingItem, setEditingItem] = useState<DocTypeItem | null>(null);

    // 编辑状态
    const [editLabel, setEditLabel] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [editDefaultFunction, setEditDefaultFunction] = useState('');
    const [editDefaultDisplay, setEditDefaultDisplay] = useState('');
    const [saving, setSaving] = useState(false);

    function openEdit(item: DocTypeItem) {
        setEditingItem(item);
        setEditLabel(item.label);
        setEditDescription(item.description || '');
        setEditIcon(item.icon || '');
        setEditDefaultFunction(item.defaultFunction || '');
        setEditDefaultDisplay(item.defaultDisplay || '');
    }

    async function handleSaveEdit() {
        if (!editingItem) return;
        setSaving(true);
        try {
            await onTypeSave(editingItem.id, {
                label: editLabel,
                description: editDescription || undefined,
                icon: editIcon || undefined,
                defaultFunction: editDefaultFunction || undefined,
                defaultDisplay: editDefaultDisplay || undefined,
            });
            setEditingItem(null);
        } catch (e) {
            alert(e instanceof Error ? e.message : '保存失败');
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
                    {CATEGORY_ICONS[group.id]}
                    <span className="font-medium text-sm">{group.label}</span>
                    <span className="text-xs text-slate-500">({group.items.length})</span>
                </div>
            </div>

            {/* Items */}
            {expanded && (
                <div className="p-2">
                    <div className="grid grid-cols-3 gap-1">
                        {group.items.map((item) => (
                            <TypeCard
                                key={item.id}
                                item={item}
                                onEdit={() => openEdit(item)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 编辑弹窗 */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑文档类型</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium text-slate-500">类型 ID（不可修改）</label>
                                <code className="block mt-1 px-3 py-2 bg-slate-100 rounded text-sm">
                                    {editingItem.id}
                                </code>
                            </div>
                            <div>
                                <label className="text-sm font-medium">显示名称</label>
                                <Input
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    className="mt-1"
                                    placeholder="如：客户"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">描述</label>
                                <Input
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="mt-1"
                                    placeholder="类型描述"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">图标</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <IconPicker value={editIcon} onChange={setEditIcon} />
                                    <span className="text-sm text-slate-500">{editIcon || '未设置'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">默认功能</label>
                                <FunctionTypeSelector
                                    value={editDefaultFunction}
                                    onChange={setEditDefaultFunction}
                                    className="mt-1"
                                    placeholder="选择默认功能类型"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">默认显现模式</label>
                                <DisplayModeSelector
                                    value={editDefaultDisplay}
                                    onChange={setEditDefaultDisplay}
                                    className="mt-1"
                                    placeholder="选择默认显现模式"
                                />
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
        </div>
    );
}

// ============================================================
// 主组件
// ============================================================

export function DocTypeSettings() {
    const [config, setConfig] = useState<DocTypeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    // 加载配置
    async function loadConfig() {
        try {
            setLoading(true);
            const data = await fetchDocTypeConfig();
            setConfig(data);
        } catch (e) {
            console.error('Failed to load doc type config:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadConfig();
    }, []);

    // 保存类型
    async function handleTypeSave(id: string, updates: Partial<DocTypeItem>) {
        await updateDocType(id, updates);
        loadConfig();
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
                    <h2 className="text-lg font-semibold">文档类型</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        定义文档的本质分类。类型需要开发实现，此处仅配置显示信息。
                    </p>
                </div>
            </div>

            {/* Groups */}
            <ScrollArea className="h-[calc(100vh-180px)]">
                {config.groups.map((group) => (
                    <GroupPanel
                        key={group.id}
                        group={group}
                        onTypeSave={handleTypeSave}
                    />
                ))}
            </ScrollArea>
        </div>
    );
}

export default DocTypeSettings;
