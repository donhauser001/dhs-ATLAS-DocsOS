/**
 * NewDocumentDialog - 新建文档对话框
 * 
 * 基于类型包的新建文档流程
 * Phase 4.1: 从后端读取真实的类型包数据
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
    FilePlus,
    ChevronLeft,
    User,
    Building,
    Folder,
    CheckSquare,
    FileText,
    StickyNote,
    Check,
    Sparkles,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import {
    getTypePackagesByCategory,
    createDocument,
    type TypePackageInfo,
    type TypePackagesByCategory,
} from '@/api/type-packages';
import { FolderPicker } from '@/components/visual-editor/ComponentRegistry/shared/FolderPicker';

// 图标映射
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'user': User,
    'building': Building,
    'folder': Folder,
    'check-square': CheckSquare,
    'file-text': FileText,
    'sticky-note': StickyNote,
};

interface NewDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function NewDocumentDialog({ open, onOpenChange }: NewDocumentDialogProps) {
    const navigate = useNavigate();
    const [step, setStep] = useState<'select' | 'configure'>('select');
    const [selectedPackage, setSelectedPackage] = useState<TypePackageInfo | null>(null);
    const [title, setTitle] = useState('');
    const [savePath, setSavePath] = useState<string | undefined>(undefined);
    const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // 从 API 加载类型包
    const [categories, setCategories] = useState<TypePackagesByCategory | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 打开对话框时加载数据
    useEffect(() => {
        if (open && !categories) {
            loadTypePackages();
        }
    }, [open]);

    async function loadTypePackages() {
        setLoading(true);
        setError(null);
        try {
            const data = await getTypePackagesByCategory();
            setCategories(data);
        } catch (err) {
            console.error('Failed to load type packages:', err);
            setError(err instanceof Error ? err.message : '加载类型包失败');
        } finally {
            setLoading(false);
        }
    }

    // 选择类型包
    const handleSelectPackage = (pkg: TypePackageInfo) => {
        setSelectedPackage(pkg);
        // 默认选中 enabled 为 true 的数据块
        setSelectedBlocks(pkg.blocks.filter(b => b.enabled !== false).map(b => b.id));
        setStep('configure');
    };

    // 切换数据块选择
    const handleToggleBlock = (blockId: string) => {
        setSelectedBlocks(prev =>
            prev.includes(blockId)
                ? prev.filter(id => id !== blockId)
                : [...prev, blockId]
        );
    };

    // 创建文档
    const handleCreate = async () => {
        if (!selectedPackage || !title.trim()) return;

        setIsCreating(true);
        try {
            // 调用后端 API 创建文档
            const result = await createDocument({
                typePackageId: selectedPackage.id,
                title: title.trim(),
                path: savePath,
                blocks: selectedBlocks,
            });

            console.log('Document created:', result);

            // 关闭对话框
            onOpenChange(false);
            
            // 重置状态
            setStep('select');
            setSelectedPackage(null);
            setTitle('');
            setSavePath(undefined);
            setSelectedBlocks([]);

            // 跳转到新创建的文档编辑器
            navigate(`/workspace/${encodeURIComponent(result.path)}`);
        } catch (error) {
            console.error('Failed to create document:', error);
            // 可以添加 toast 通知
            alert(error instanceof Error ? error.message : '创建文档失败');
        } finally {
            setIsCreating(false);
        }
    };

    // 返回选择页
    const handleBack = () => {
        setStep('select');
        setSelectedPackage(null);
        setTitle('');
        setSavePath(undefined);
    };

    // 关闭对话框时重置
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setStep('select');
            setSelectedPackage(null);
            setTitle('');
            setSavePath(undefined);
            setSelectedBlocks([]);
        }
        onOpenChange(open);
    };

    // 检查是否有可用的类型包
    const hasPackages = categories && Object.values(categories).some(cat => cat.packages.length > 0);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent 
                className="max-w-2xl max-h-[85vh] flex flex-col p-0"
                onPointerDownOutside={(e) => {
                    // 配置步骤时禁用外部点击关闭（因为需要使用 FolderPicker）
                    if (step === 'configure') {
                        e.preventDefault();
                    }
                }}
                onInteractOutside={(e) => {
                    // 配置步骤时禁用外部交互关闭
                    if (step === 'configure') {
                        e.preventDefault();
                    }
                }}
            >
                <DialogHeader className="p-6 pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <FilePlus className="h-5 w-5" />
                        {step === 'select' ? '新建文档' : `新建${selectedPackage?.name}文档`}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {step === 'select' 
                            ? '选择文档类型以创建新文档' 
                            : `配置${selectedPackage?.name}文档的属性`}
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' ? (
                    // Step 1: 选择文档类型
                    <ScrollArea className="flex-1 p-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                                <p>加载类型包...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-destructive">
                                <AlertCircle className="h-8 w-8 mb-3" />
                                <p className="font-medium mb-2">加载失败</p>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button variant="outline" onClick={loadTypePackages}>
                                    重试
                                </Button>
                            </div>
                        ) : !hasPackages ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <FileText className="h-8 w-8 mb-3" />
                                <p className="font-medium mb-1">暂无可用类型包</p>
                                <p className="text-sm">请先在插件市场安装类型包</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(categories!).map(([key, { label, packages }]) => (
                                    packages.length > 0 && (
                                        <div key={key}>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-3">
                                                {label}
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {packages.map(pkg => {
                                                    const Icon = ICON_MAP[pkg.icon] || FileText;
                                                    return (
                                                        <button
                                                            key={pkg.id}
                                                            onClick={() => handleSelectPackage(pkg)}
                                                            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all group"
                                                        >
                                                            <div
                                                                className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                                                                style={{ backgroundColor: `${pkg.color}15` }}
                                                            >
                                                                <Icon
                                                                    className="h-6 w-6"
                                                                    style={{ color: pkg.color }}
                                                                />
                                                            </div>
                                                            <div className="text-center">
                                                                <div className="font-medium text-sm">{pkg.name}</div>
                                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                                    {pkg.description}
                                                                </div>
                                                            </div>
                                                            {pkg.isOfficial && (
                                                                <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded">
                                                                    官方
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                ) : (
                    // Step 2: 配置文档
                    <>
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {/* 文档名称 */}
                                <div className="space-y-2">
                                    <Label htmlFor="title">文档名称</Label>
                                    <Input
                                        id="title"
                                        placeholder={`输入${selectedPackage?.name}名称...`}
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {/* 保存位置 */}
                                <div className="space-y-2">
                                    <Label>保存位置</Label>
                                    <FolderPicker
                                        value={savePath}
                                        onChange={setSavePath}
                                        placeholder="选择保存目录（默认根目录）"
                                    />
                                </div>

                                {/* 预置数据块 */}
                                <div className="space-y-3">
                                    <Label>预置数据块</Label>
                                    <div className="space-y-2">
                                        {selectedPackage?.blocks
                                            .filter(block => block.enabled !== false)  // 只显示启用的数据块
                                            .map(block => (
                                            <div
                                                key={block.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                                    selectedBlocks.includes(block.id)
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                                onClick={() => handleToggleBlock(block.id)}
                                            >
                                                <Checkbox
                                                    id={block.id}
                                                    checked={selectedBlocks.includes(block.id)}
                                                    onCheckedChange={() => handleToggleBlock(block.id)}
                                                />
                                                <div className="flex-1">
                                                    <label
                                                        htmlFor={block.id}
                                                        className="font-medium text-sm cursor-pointer"
                                                    >
                                                        {block.name}
                                                    </label>
                                                    <p className="text-xs text-muted-foreground">
                                                        {block.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-muted-foreground space-y-1">
                                        <p className="flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            可在创建后随时添加更多数据块
                                        </p>
                                        <p className="text-slate-400 pl-4">
                                            如需修改模板字段，可在「设置 → 插件市场 → {selectedPackage?.name}」中配置
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        {/* 操作按钮 */}
                        <div className="p-4 border-t flex items-center justify-between">
                            <Button variant="ghost" onClick={handleBack}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                返回选择
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={!title.trim() || isCreating}
                            >
                                {isCreating ? (
                                    '创建中...'
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-1.5" />
                                        创建文档
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default NewDocumentDialog;
