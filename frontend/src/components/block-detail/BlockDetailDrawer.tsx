/**
 * BlockDetailDrawer - Block 详情抽屉
 * 
 * 通用的实体详情展示组件，支持：
 * 1. 单文档多实体模式：显示文档中某个 block 的详情
 * 2. 多文档单实体模式：显示独立文档的详情
 * 
 * 架构设计原则：
 * - 不改变页面路由，使用抽屉浮层展示
 * - 支持查看和编辑模式
 * - 可被任何列表渲染器复用
 */

import { useState, useEffect } from 'react';
import { X, Edit, Eye, Save, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Block, type ADLDocument } from '@/types/adl';
import { fetchDocument, updateBlock } from '@/api/adl';
import { BlockDetailView } from './BlockDetailView';
import { BlockEditForm } from './BlockEditForm';
import { useDisplayConfigs } from '@/hooks/useTokens';
import { useLabels } from '@/providers/LabelProvider';

// ============================================================
// 类型定义
// ============================================================

export interface BlockDetailDrawerProps {
    /** 是否显示 */
    open: boolean;
    /** 关闭回调 */
    onClose: () => void;
    /** Block 来源 - 可以是完整路径（含 anchor）或仅文档路径 */
    blockRef: string;
    /** 标题覆盖 */
    title?: string;
    /** 数据更新后的回调 */
    onUpdate?: () => void;
}

interface BlockData {
    block: Block;
    document: ADLDocument;
    docPath: string;
    anchor: string;
}

type DrawerMode = 'view' | 'edit';

// ============================================================
// 主组件
// ============================================================

export function BlockDetailDrawer({
    open,
    onClose,
    blockRef,
    title,
    onUpdate,
}: BlockDetailDrawerProps) {
    const navigate = useNavigate();
    const displayConfigs = useDisplayConfigs();
    const { resolveLabel } = useLabels();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockData, setBlockData] = useState<BlockData | null>(null);
    const [mode, setMode] = useState<DrawerMode>('view');
    const [saving, setSaving] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<Record<string, unknown>>({});

    // 解析 blockRef，支持多种格式：
    // - "客户管理.md#client-1" -> docPath: "客户管理.md", anchor: "client-1"
    // - "联系人/principals/王强.md" -> docPath: "联系人/principals/王强.md", anchor: undefined
    // - "联系人/principals/王强.md#u-contact-1" -> docPath: "联系人/principals/王强.md", anchor: "u-contact-1"
    const parseBlockRef = (ref: string): { docPath: string; anchor?: string } => {
        const hashIndex = ref.indexOf('#');
        if (hashIndex === -1) {
            return { docPath: ref };
        }
        return {
            docPath: ref.substring(0, hashIndex),
            anchor: ref.substring(hashIndex + 1),
        };
    };

    // 加载 block 数据
    useEffect(() => {
        if (!open || !blockRef) return;

        async function loadBlockData() {
            setLoading(true);
            setError(null);
            setPendingChanges({});
            setMode('view');

            try {
                const { docPath, anchor } = parseBlockRef(blockRef);

                // 获取完整文档
                const doc = await fetchDocument(docPath);

                // 查找目标 block
                let targetBlock: Block | undefined;
                if (anchor) {
                    targetBlock = doc.blocks.find(b => b.anchor === anchor);
                } else {
                    // 如果没有 anchor，使用第一个有 machine 的 block
                    targetBlock = doc.blocks.find(b => 
                        b.machine?.type && 
                        b.machine.type !== 'directory_index' && 
                        b.machine.type !== 'entity_index'
                    );
                }

                if (!targetBlock) {
                    throw new Error(`Block not found: ${blockRef}`);
                }

                setBlockData({
                    block: targetBlock,
                    document: doc,
                    docPath,
                    anchor: anchor || targetBlock.anchor,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load block');
            } finally {
                setLoading(false);
            }
        }

        loadBlockData();
    }, [open, blockRef]);

    // 处理字段变更
    const handleFieldChange = (anchor: string, field: string, value: unknown) => {
        setPendingChanges(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // 保存变更
    const handleSave = async () => {
        if (!blockData || Object.keys(pendingChanges).length === 0) return;

        setSaving(true);
        try {
            await updateBlock(blockData.docPath, blockData.anchor, pendingChanges);
            
            // 重新加载数据
            const doc = await fetchDocument(blockData.docPath);
            const targetBlock = doc.blocks.find(b => b.anchor === blockData.anchor);
            if (targetBlock) {
                setBlockData(prev => prev ? {
                    ...prev,
                    block: targetBlock,
                    document: doc,
                } : null);
            }

            setPendingChanges({});
            setMode('view');
            onUpdate?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    // 跳转到完整文档页
    const handleOpenFullPage = () => {
        if (!blockData) return;
        const url = blockData.anchor 
            ? `/workspace/${blockData.docPath}#${blockData.anchor}`
            : `/workspace/${blockData.docPath}`;
        navigate(url);
        onClose();
    };

    // 获取显示标题
    const getDisplayTitle = (): string => {
        if (title) return title;
        if (!blockData?.block) return '详情';
        const { machine, heading } = blockData.block;
        return machine?.title as string || 
               machine?.display_name as string || 
               heading?.replace(/^#+\s*/, '').replace(/\s*\{#.*\}$/, '') || 
               '详情';
    };

    // 渲染内容
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-brand-primary)' }} />
                    <span className="ml-2" style={{ color: 'var(--ui-field-label-color)' }}>加载中...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="p-6 text-center">
                    <div className="text-red-500 mb-2">{error}</div>
                    <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 rounded"
                        style={{ 
                            backgroundColor: 'var(--color-brand-primary)',
                            color: 'white',
                        }}
                    >
                        重试
                    </button>
                </div>
            );
        }

        if (!blockData) return null;

        // 编辑模式
        if (mode === 'edit') {
            // 从文档 frontmatter 获取字段配置
            const fieldConfig = blockData.document.frontmatter?.atlas?.field_config as Record<string, unknown> || {};
            
            return (
                <div className="p-6">
                    <BlockEditForm
                        block={blockData.block}
                        entityType={blockData.document.frontmatter?.atlas?.entity_type as string}
                        fieldConfig={fieldConfig}
                        onChange={setPendingChanges}
                        pendingChanges={pendingChanges}
                    />
                </div>
            );
        }

        // 查看模式
        return (
            <div className="p-6">
                <BlockDetailView
                    block={blockData.block}
                    entityType={blockData.document.frontmatter?.atlas?.entity_type as string}
                />
            </div>
        );
    };

    if (!open) return null;

    return (
        <>
            {/* 背景遮罩 */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* 抽屉面板 */}
            <div
                className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 shadow-2xl flex flex-col transition-transform"
                style={{
                    backgroundColor: 'var(--ui-page-bg, #ffffff)',
                    borderLeft: '1px solid var(--ui-block-body-border, #e2e8f0)',
                }}
            >
                {/* 头部 */}
                <div 
                    className="flex items-center justify-between px-6 py-4 border-b"
                    style={{ 
                        borderColor: 'var(--ui-block-body-border, #e2e8f0)',
                        backgroundColor: 'var(--ui-page-bg, #ffffff)',
                    }}
                >
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-slate-100 transition-colors"
                            style={{ color: 'var(--ui-field-label-color)' }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 
                                    className="text-lg font-semibold"
                                    style={{ color: 'var(--ui-field-value-color)' }}
                                >
                                    {getDisplayTitle()}
                                </h2>
                                {/* 状态徽章 */}
                                {blockData?.block.machine?.status && (() => {
                                    const status = blockData.block.machine.status as string;
                                    const statusConfigs = displayConfigs?.statuses || {};
                                    const statusConfig = statusConfigs[status];
                                    // 使用标签系统解析状态值
                                    const statusResolved = resolveLabel(status);
                                    return (
                                        <span 
                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                            style={{ 
                                                backgroundColor: statusConfig?.color 
                                                    ? `${statusConfig.color}15` 
                                                    : 'var(--ui-block-header-bg, #f1f5f9)',
                                                color: statusConfig?.color || 'var(--ui-field-value-color)',
                                            }}
                                        >
                                            <span 
                                                className="w-1.5 h-1.5 rounded-full" 
                                                style={{ backgroundColor: statusConfig?.color || 'var(--color-brand-primary)' }}
                                            />
                                            {statusResolved.label}
                                        </span>
                                    );
                                })()}
                            </div>
                            {blockData && (
                                <p 
                                    className="text-xs"
                                    style={{ color: 'var(--ui-field-label-color)' }}
                                >
                                    {blockData.docPath}
                                    {blockData.anchor && <span className="ml-1">#{blockData.anchor}</span>}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* 模式切换 */}
                        {mode === 'view' ? (
                            <button
                                onClick={() => setMode('edit')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
                                style={{ 
                                    color: 'var(--color-brand-primary)',
                                    backgroundColor: 'var(--color-brand-primary)10',
                                }}
                            >
                                <Edit className="w-4 h-4" />
                                编辑
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => {
                                        setMode('view');
                                        setPendingChanges({});
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
                                    style={{ color: 'var(--ui-field-label-color)' }}
                                >
                                    <Eye className="w-4 h-4" />
                                    取消
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || Object.keys(pendingChanges).length === 0}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                                    style={{ 
                                        backgroundColor: 'var(--color-brand-primary)',
                                        color: 'white',
                                    }}
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    保存
                                </button>
                            </>
                        )}

                        {/* 打开完整页面 */}
                        <button
                            onClick={handleOpenFullPage}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors"
                            style={{ color: 'var(--ui-field-label-color)' }}
                            title="在新页面打开"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* 内容区域 */}
                <div 
                    className="flex-1 overflow-y-auto"
                    style={{ backgroundColor: 'var(--ui-page-bg, #ffffff)' }}
                >
                    {renderContent()}
                </div>

                {/* 底部操作栏（编辑模式下显示未保存提示） */}
                {mode === 'edit' && Object.keys(pendingChanges).length > 0 && (
                    <div 
                        className="px-6 py-3 border-t flex items-center justify-between"
                        style={{ 
                            borderColor: 'var(--ui-block-body-border)',
                            backgroundColor: 'var(--color-status-warning-bg, #fef3c7)',
                        }}
                    >
                        <span className="text-sm" style={{ color: 'var(--color-status-warning, #d97706)' }}>
                            有 {Object.keys(pendingChanges).length} 项未保存的更改
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPendingChanges({})}
                                className="px-3 py-1 text-sm rounded"
                                style={{ color: 'var(--ui-field-label-color)' }}
                            >
                                放弃
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-1 text-sm rounded"
                                style={{ 
                                    backgroundColor: 'var(--color-brand-primary)',
                                    color: 'white',
                                }}
                            >
                                {saving ? '保存中...' : '保存'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

export default BlockDetailDrawer;

