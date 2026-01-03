/**
 * FunctionTypeSettings - 功能类型管理页面
 * 
 * 查看和编辑功能类型的显示配置
 * 注意：功能本身需要开发实现，此页面只允许编辑显示配置
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
    List,
    FileText,
    BookOpen,
    Calendar,
    LayoutDashboard,
    GitBranch,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconPicker } from '@/components/ui/icon-picker';
import {
    fetchFunctionTypeConfig,
    updateFunctionType,
    type FunctionTypeConfig,
    type FunctionTypeGroup,
    type FunctionTypeItem,
    type FunctionCategory,
} from '@/api/function-types';

const CATEGORY_ICONS: Record<FunctionCategory, React.ReactNode> = {
    list: <List className="h-4 w-4" />,
    detail: <FileText className="h-4 w-4" />,
    content: <BookOpen className="h-4 w-4" />,
    planning: <Calendar className="h-4 w-4" />,
    display: <LayoutDashboard className="h-4 w-4" />,
    structure: <GitBranch className="h-4 w-4" />,
};

function TypeCard({ item, onEdit }: { item: FunctionTypeItem; onEdit: () => void }) {
    const Icon = item.icon
        ? (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[
            item.icon.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        ]
        : null;

    return (
        <div className="flex items-center gap-2 py-1.5 px-2 hover:bg-slate-50 rounded group border border-transparent hover:border-slate-200 transition-colors">
            <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded">
                {Icon ? <Icon className="h-3.5 w-3.5 text-slate-500" /> : <span className="text-slate-300 text-xs">-</span>}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <code className="text-[10px] text-slate-400 truncate block">{item.id}</code>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={onEdit} title="编辑显示配置">
                    <Edit2 className="h-3 w-3" />
                </Button>
            </div>
        </div>
    );
}

function GroupPanel({
    group,
    onTypeSave,
}: {
    group: FunctionTypeGroup;
    onTypeSave: (id: string, updates: Partial<FunctionTypeItem>) => Promise<void>;
}) {
    const [expanded, setExpanded] = useState(true);
    const [editingItem, setEditingItem] = useState<FunctionTypeItem | null>(null);

    const [editLabel, setEditLabel] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editIcon, setEditIcon] = useState('');
    const [saving, setSaving] = useState(false);

    function openEdit(item: FunctionTypeItem) {
        setEditingItem(item);
        setEditLabel(item.label);
        setEditDescription(item.description || '');
        setEditIcon(item.icon || '');
    }

    async function handleSaveEdit() {
        if (!editingItem) return;
        setSaving(true);
        try {
            await onTypeSave(editingItem.id, {
                label: editLabel,
                description: editDescription || undefined,
                icon: editIcon || undefined,
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

            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>编辑功能类型</DialogTitle>
                    </DialogHeader>
                    {editingItem && (
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium text-slate-500">类型 ID（不可修改）</label>
                                <code className="block mt-1 px-3 py-2 bg-slate-100 rounded text-sm">{editingItem.id}</code>
                            </div>
                            <div>
                                <label className="text-sm font-medium">显示名称</label>
                                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">描述</label>
                                <Input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1" />
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
                        <Button variant="outline" onClick={() => setEditingItem(null)} disabled={saving}>取消</Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>{saving ? '保存中...' : '保存'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function FunctionTypeSettings() {
    const [config, setConfig] = useState<FunctionTypeConfig | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadConfig() {
        try {
            setLoading(true);
            const data = await fetchFunctionTypeConfig();
            setConfig(data);
        } catch (e) {
            console.error('Failed to load config:', e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadConfig(); }, []);

    async function handleTypeSave(id: string, updates: Partial<FunctionTypeItem>) {
        await updateFunctionType(id, updates);
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
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold">功能类型</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">定义文档的交互行为。功能需要开发实现，此处仅配置显示信息。</p>
                </div>
            </div>
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

export default FunctionTypeSettings;
