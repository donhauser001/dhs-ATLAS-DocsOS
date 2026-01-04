/**
 * PluginSettingsDialog - 插件设置对话框
 * 
 * 用于编辑类型包的数据块定义：
 * - 设置字段必填/选填
 * - 添加/删除字段
 * - 设置默认值
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Loader2,
    Settings,
    Plus,
    Trash2,
    GripVertical,
    ChevronDown,
    ChevronRight,
    Save,
    AlertCircle,
    RotateCcw,
    // 数据块图标
    Database,
    User,
    Phone,
    MapPin,
    Share2,
    Tag,
    Shield,
    Key,
    FileText,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Plugin, TypePackage } from '../types';
import {
    getTypePackageBlocks,
    updateDataBlock,
    resetAllDataBlocks,
    type DataBlockDefinition,
    type DataBlockField,
} from '@/api/plugins';

interface PluginSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plugin: Plugin | null;
}

export function PluginSettingsDialog({
    open,
    onOpenChange,
    plugin,
}: PluginSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blocks, setBlocks] = useState<DataBlockDefinition[]>([]);
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);

    // 加载数据块定义
    useEffect(() => {
        if (open && plugin && plugin.pluginType === 'type-package') {
            loadBlocks();
        }
        // 对话框关闭时重置状态
        if (!open) {
            setBlocks([]);
            setExpandedBlocks(new Set());
            setHasChanges(false);
            setError(null);
        }
    }, [open, plugin]);

    async function loadBlocks() {
        if (!plugin) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const data = await getTypePackageBlocks(plugin.id);
            setBlocks(data);
            // 默认展开第一个
            if (data.length > 0) {
                setExpandedBlocks(new Set([data[0].id]));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载失败');
        } finally {
            setLoading(false);
        }
    }

    // 切换数据块展开状态
    const toggleBlock = (blockId: string) => {
        const next = new Set(expandedBlocks);
        if (next.has(blockId)) {
            next.delete(blockId);
        } else {
            next.add(blockId);
        }
        setExpandedBlocks(next);
    };

    // 更新数据块字段
    const updateBlockField = (
        blockId: string,
        fieldIndex: number,
        updates: Partial<DataBlockField>
    ) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const newFields = [...block.fields];
            newFields[fieldIndex] = { ...newFields[fieldIndex], ...updates };
            return { ...block, fields: newFields };
        }));
        setHasChanges(true);
    };

    // 添加新字段
    const addField = (blockId: string) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const newKey = `field_${Date.now()}`;
            return {
                ...block,
                fields: [
                    ...block.fields,
                    {
                        key: newKey,
                        label: '新字段',
                        type: 'text',
                        required: false,
                        defaultValue: '',
                    },
                ],
            };
        }));
        setHasChanges(true);
    };

    // 删除字段
    const removeField = (blockId: string, fieldIndex: number) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const newFields = block.fields.filter((_, i) => i !== fieldIndex);
            return { ...block, fields: newFields };
        }));
        setHasChanges(true);
    };

    // 重排字段顺序
    const reorderFields = (blockId: string, oldIndex: number, newIndex: number) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            const newFields = arrayMove(block.fields, oldIndex, newIndex);
            return { ...block, fields: newFields };
        }));
        setHasChanges(true);
    };

    // 更新数据块属性
    const updateBlockProps = (blockId: string, updates: Partial<DataBlockDefinition>) => {
        setBlocks(prev => prev.map(block => {
            if (block.id !== blockId) return block;
            return { ...block, ...updates };
        }));
        setHasChanges(true);
    };

    // 保存所有更改
    const handleSave = async () => {
        if (!plugin) return;
        
        setSaving(true);
        setError(null);
        
        try {
            // 逐个保存更新的数据块
            for (const block of blocks) {
                await updateDataBlock(plugin.id, block.id, {
                    name: block.name,
                    description: block.description,
                    required: block.required,
                    enabled: block.enabled,
                    order: block.order,
                    display: block.display,
                    fields: block.fields,
                });
            }
            
            setHasChanges(false);
            onOpenChange(false);  // 保存成功后关闭对话框
        } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败');
        } finally {
            setSaving(false);
        }
    };

    // 恢复初始化
    const handleReset = async () => {
        if (!plugin) return;
        
        if (!confirm('确定要恢复所有数据块到初始状态吗？\n\n这将丢失所有自定义配置！')) {
            return;
        }
        
        setResetting(true);
        setError(null);
        
        try {
            const message = await resetAllDataBlocks(plugin.id);
            // 重新加载数据块
            await loadBlocks();
            setHasChanges(false);
            alert(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : '恢复失败');
        } finally {
            setResetting(false);
        }
    };

    if (!plugin || plugin.pluginType !== 'type-package') {
        return null;
    }

    const typePackage = plugin as TypePackage;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[85vh] flex flex-col overflow-hidden" aria-describedby={undefined}>
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        {typePackage.name} - 数据块设置
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">加载中...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-destructive">
                        <AlertCircle className="w-8 h-8 mb-2" />
                        <p>{error}</p>
                        <Button variant="link" onClick={loadBlocks} className="mt-2">
                            重试
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 min-h-0 overflow-hidden -mx-6 px-6">
                            <ScrollArea className="h-full">
                                <div className="space-y-4 pb-4 pr-4">
                                {blocks.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8">
                                        暂无数据块定义
                                    </div>
                                ) : (
                                    blocks.map((block) => (
                                        <DataBlockEditor
                                            key={block.id}
                                            block={block}
                                            expanded={expandedBlocks.has(block.id)}
                                            onToggle={() => toggleBlock(block.id)}
                                            onUpdateField={(idx, updates) => updateBlockField(block.id, idx, updates)}
                                            onAddField={() => addField(block.id)}
                                            onRemoveField={(idx) => removeField(block.id, idx)}
                                            onUpdateProps={(updates) => updateBlockProps(block.id, updates)}
                                            onReorderFields={(oldIdx, newIdx) => reorderFields(block.id, oldIdx, newIdx)}
                                        />
                                    ))
                                )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* 底部操作栏 */}
                        <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={handleReset} 
                                    disabled={resetting}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    {resetting ? (
                                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-4 h-4 mr-1.5" />
                                    )}
                                    恢复初始化
                                </Button>
                                {hasChanges && (
                                    <span className="text-sm text-amber-600">有未保存的更改</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    取消
                                </Button>
                                <Button onClick={handleSave} disabled={saving || !hasChanges}>
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    保存
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ============================================================
// 图标映射
// ============================================================

const BLOCK_ICON_MAP: Record<string, LucideIcon> = {
    database: Database,
    user: User,
    phone: Phone,
    'map-pin': MapPin,
    mappin: MapPin,
    share2: Share2,
    share: Share2,
    'share-2': Share2,
    tag: Tag,
    shield: Shield,
    key: Key,
    file: FileText,
    'file-text': FileText,
};

function getBlockIcon(iconName?: string): LucideIcon {
    if (!iconName) return Database;
    const normalized = iconName.toLowerCase().replace(/_/g, '-');
    return BLOCK_ICON_MAP[normalized] || Database;
}

// ============================================================
// 数据块编辑器子组件
// ============================================================

interface DataBlockEditorProps {
    block: DataBlockDefinition;
    expanded: boolean;
    onToggle: () => void;
    onUpdateField: (index: number, updates: Partial<DataBlockField>) => void;
    onAddField: () => void;
    onRemoveField: (index: number) => void;
    onUpdateProps: (updates: Partial<DataBlockDefinition>) => void;
    onReorderFields: (oldIndex: number, newIndex: number) => void;
}

function DataBlockEditor({
    block,
    expanded,
    onToggle,
    onUpdateField,
    onAddField,
    onRemoveField,
    onUpdateProps,
    onReorderFields,
}: DataBlockEditorProps) {
    // 拖拽传感器配置
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 拖拽结束处理
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            // 从 ID 中提取索引 (格式: block.id-field-index)
            const extractIndex = (id: string | number) => {
                const parts = String(id).split('-field-');
                return parts.length > 1 ? parseInt(parts[1], 10) : -1;
            };
            const oldIndex = extractIndex(active.id);
            const newIndex = extractIndex(over.id);
            if (oldIndex >= 0 && newIndex >= 0) {
                onReorderFields(oldIndex, newIndex);
            }
        }
    };

    const isEnabled = block.enabled !== false;
    
    return (
        <div className={cn(
            "border rounded-lg overflow-hidden transition-opacity",
            !isEnabled && "opacity-50"
        )}>
            {/* 数据块头部 */}
            <div
                className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors',
                    expanded && 'border-b bg-slate-50'
                )}
                onClick={onToggle}
            >
                {expanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                
                {(() => {
                    // 新格式：icon 直接在顶层；旧格式：icon 在 display 对象中
                    const iconName = block.icon || block.display?.icon;
                    const IconComponent = getBlockIcon(iconName);
                    const iconColor = block.display?.color || '#8B5CF6';
                    return (
                        <div
                            className="w-8 h-8 rounded flex items-center justify-center"
                            style={{ backgroundColor: `${iconColor}15` }}
                        >
                            <IconComponent className="w-4 h-4" style={{ color: iconColor }} />
                        </div>
                    );
                })()}
                
                <div className="flex-1">
                    <div className="font-medium text-sm">{block.name}</div>
                    <div className="text-xs text-slate-500">
                        {block.fields.length} 个字段
                        {!isEnabled && <span className="ml-2 text-amber-600">（已禁用）</span>}
                    </div>
                </div>
                
                {/* 启用/禁用开关 */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => onUpdateProps({ enabled: checked })}
                    />
                    <span className="text-[10px] text-slate-400 w-6">{isEnabled ? '启用' : '禁用'}</span>
                </div>
            </div>

            {/* 数据块内容 */}
            {expanded && (
                <div className="p-4 space-y-4">
                    {/* 数据块基本信息 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs">数据块名称</Label>
                            <Input
                                value={block.name}
                                onChange={(e) => onUpdateProps({ name: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">描述</Label>
                            <Input
                                value={block.description}
                                onChange={(e) => onUpdateProps({ description: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* 字段列表 - 可拖拽排序 */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">字段定义</Label>
                            <Button size="sm" variant="outline" onClick={onAddField}>
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                添加字段
                            </Button>
                        </div>
                        
                        <div className="border rounded-lg overflow-hidden">
                            {block.fields.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    暂无字段，点击上方按钮添加
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={block.fields.map((_, idx) => `${block.id}-field-${idx}`)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="divide-y">
                                            {block.fields.map((field, index) => (
                                                <SortableFieldEditor
                                                    key={`${block.id}-field-${index}`}
                                                    id={`${block.id}-field-${index}`}
                                                    field={field}
                                                    onUpdate={(updates) => onUpdateField(index, updates)}
                                                    onRemove={() => onRemoveField(index)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// 可排序字段编辑器子组件
// ============================================================

interface SortableFieldEditorProps {
    id: string;
    field: DataBlockField;
    onUpdate: (updates: Partial<DataBlockField>) => void;
    onRemove: () => void;
}

function SortableFieldEditor({ id, field, onUpdate, onRemove }: SortableFieldEditorProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "p-3 hover:bg-slate-50/50 bg-white",
                isDragging && "shadow-lg z-10"
            )}
        >
            <div className="flex items-start gap-3">
                {/* 拖拽手柄 */}
                <button
                    type="button"
                    className="mt-2 cursor-grab active:cursor-grabbing touch-none"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                </button>
                
                {/* 字段主要信息 */}
                <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                        <Label className="text-[10px] text-slate-400">字段键名</Label>
                        <Input
                            value={field.key}
                            onChange={(e) => onUpdate({ key: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="key"
                        />
                    </div>
                    <div>
                        <Label className="text-[10px] text-slate-400">显示标签</Label>
                        <Input
                            value={field.label}
                            onChange={(e) => onUpdate({ label: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="标签"
                        />
                    </div>
                    <div>
                        <Label className="text-[10px] text-slate-400">默认值</Label>
                        <Input
                            value={field.defaultValue ?? ''}
                            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="默认值"
                        />
                    </div>
                </div>

                {/* 必填开关和删除按钮 */}
                <div className="flex items-center gap-2 mt-5">
                    <div className="flex items-center gap-1">
                        <Switch
                            checked={field.required || false}
                            onCheckedChange={(checked) => onUpdate({ required: checked })}
                        />
                        <span className="text-[10px] text-slate-400">必填</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-slate-400 hover:text-destructive"
                        onClick={onRemove}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default PluginSettingsDialog;

