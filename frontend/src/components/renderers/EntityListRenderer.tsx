/**
 * EntityListRenderer - 实体列表渲染器
 * 
 * Phase 3.3: 功能声明系统
 * 
 * 渲染 atlas.function: entity_list 的文档
 * 支持：
 * - 从 FunctionRegistry 自动发现数据
 * - 卡片/表格视图切换
 * - 搜索、分页
 * - Block 详情抽屉（支持单文档多实体和多文档单实体两种模式）
 */

import { useState, useEffect } from 'react';
import {
    LayoutGrid,
    Table as TableIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    User,
    Building,
    FileText,
    ExternalLink,
    Plus,
    Pencil,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ADLDocument, Block } from '@/types/adl';
import { BlockDetailDrawer } from '@/components/block-detail/BlockDetailDrawer';

// ============================================================
// 类型定义
// ============================================================

interface EntityListRendererProps {
    document: ADLDocument;
    selectedAnchor?: string;
    onBlockClick?: (block: Block) => void;
    /** 是否为编辑模式 */
    isEditing?: boolean;
}

interface FunctionEntry {
    path: string;
    id?: string;
    title?: string;
    capabilities: string[];
    indexed_fields: Record<string, unknown>;
    navigation?: {
        visible: boolean;
        icon?: string;
        label?: string;
        order?: number;
    };
    entity_type?: string;
}

type ViewMode = 'card' | 'table';

// ============================================================
// 主组件
// ============================================================

export function EntityListRenderer({
    document,
    isEditing,
}: EntityListRendererProps) {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [searchQuery, setSearchQuery] = useState('');
    const [entities, setEntities] = useState<FunctionEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 12;

    // Block 详情抽屉状态
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEntityRef, setSelectedEntityRef] = useState<string | null>(null);
    const [selectedEntityTitle, setSelectedEntityTitle] = useState<string | undefined>();

    // 从文档获取配置
    const atlasConfig = document.frontmatter?.atlas;
    const entityType = atlasConfig?.entity_type;

    // 从 directory_index block 获取 source 配置
    const directoryBlock = document.blocks.find(
        b => b.machine?.type === 'directory_index' || b.machine?.type === 'entity_index'
    );
    const sourceFunction = (directoryBlock?.machine?.source as { function?: string })?.function;
    const targetFunction = sourceFunction || entityType || 'principal';

    // 从文档 blocks 提取实体数据
    const extractEntitiesFromBlocks = (): FunctionEntry[] => {
        const blockEntities: FunctionEntry[] = [];

        for (const block of document.blocks) {
            // 跳过没有 machine 数据的 blocks
            if (!block.machine || typeof block.machine !== 'object') continue;

            // 跳过 directory_index 类型的 blocks
            if (block.machine.type === 'directory_index' || block.machine.type === 'entity_index') continue;

            // 检查是否有 type 字段
            const blockType = block.machine.type as string | undefined;
            if (!blockType) continue;

            // 构建实体数据
            const entity: FunctionEntry = {
                path: `${document.path}#${block.anchor}`,
                id: block.machine.id as string || block.anchor,
                title: block.machine.title as string || block.machine.display_name as string || block.heading || block.anchor,
                capabilities: [],
                indexed_fields: {
                    status: block.machine.status,
                    category: block.machine.category,
                    ...block.machine,
                },
                entity_type: blockType,
            };

            blockEntities.push(entity);
        }

        return blockEntities;
    };

    // 获取数据
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/functions/${targetFunction}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch entities');
                }
                const result = await response.json();
                if (result.success && result.data.documents && result.data.documents.length > 0) {
                    // API 有数据，使用 API 数据
                    setEntities(result.data.documents);
                } else {
                    // API 无数据，尝试从文档 blocks 提取
                    const blockEntities = extractEntitiesFromBlocks();
                    if (blockEntities.length > 0) {
                        setEntities(blockEntities);
                    } else {
                        setEntities([]);
                    }
                }
            } catch (err) {
                // API 失败，尝试从文档 blocks 提取
                const blockEntities = extractEntitiesFromBlocks();
                if (blockEntities.length > 0) {
                    setEntities(blockEntities);
                    setError(null);
                } else {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                }
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [targetFunction, document.blocks]);

    // 过滤和分页
    const filteredEntities = entities.filter(entity => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const title = (entity.title || '').toLowerCase();
        const id = (entity.id || '').toLowerCase();
        const emails = entity.indexed_fields['identity.emails'] as string[] | undefined;
        return (
            title.includes(query) ||
            id.includes(query) ||
            emails?.some(e => e.toLowerCase().includes(query))
        );
    });

    const totalPages = Math.ceil(filteredEntities.length / pageSize);
    const pagedEntities = filteredEntities.slice(
        (page - 1) * pageSize,
        page * pageSize
    );

    // 点击实体 - 打开详情抽屉
    const handleEntityClick = (entity: FunctionEntry) => {
        // 构建 blockRef，支持两种模式：
        // 1. 单文档多实体：path 包含 # (如 "客户管理.md#client-1")
        // 2. 多文档单实体：path 不包含 # (如 "联系人/principals/王强.md")
        let blockRef: string;
        if (entity.path.includes('#')) {
            blockRef = entity.path;
        } else if (entity.id) {
            blockRef = `${entity.path}#${entity.id}`;
        } else {
            blockRef = entity.path;
        }

        setSelectedEntityRef(blockRef);
        setSelectedEntityTitle(entity.title);
        setDrawerOpen(true);
    };

    // 关闭抽屉
    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setSelectedEntityRef(null);
        setSelectedEntityTitle(undefined);
    };

    // 数据更新后刷新列表
    const handleDataUpdate = () => {
        // 重新从 blocks 提取数据（如果是单文档多实体模式）
        const blockEntities = extractEntitiesFromBlocks();
        if (blockEntities.length > 0) {
            setEntities(blockEntities);
        }
    };

    return (
        <div className="entity-list-renderer p-6">
            {/* 头部 */}
            <div className="header mb-6">
                <h1
                    className="text-2xl font-bold mb-2"
                    style={{ color: 'var(--ui-field-value-color)' }}
                >
                    {document.frontmatter?.title || directoryBlock?.heading || '实体列表'}
                </h1>
                <p
                    className="text-sm"
                    style={{ color: 'var(--ui-field-label-color)' }}
                >
                    共 {filteredEntities.length} 个{getEntityLabel(targetFunction)}
                </p>
            </div>

            {/* 编辑模式提示 */}
            {isEditing && (
                <div className="mb-4 px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
                    <Pencil size={16} className="text-purple-600" />
                    <span className="text-sm text-purple-700">
                        编辑模式：点击卡片可编辑实体详情
                    </span>
                </div>
            )}

            {/* 工具栏 */}
            <div className="toolbar flex items-center justify-between mb-6">
                {/* 搜索 */}
                <div className="search relative">
                    <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    />
                    <input
                        type="text"
                        placeholder="搜索..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="pl-9 pr-4 py-2 rounded-lg text-sm"
                        style={{
                            backgroundColor: 'var(--ui-block-body-bg)',
                            border: '1px solid var(--ui-block-body-border)',
                            color: 'var(--ui-field-value-color)',
                            width: '240px',
                        }}
                    />
                </div>

                <div className="flex items-center gap-3">
                    {/* 添加实体按钮（编辑模式） */}
                    {isEditing && (
                        <button
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            style={{
                                backgroundColor: 'var(--color-brand-primary)',
                                color: 'white',
                            }}
                            onClick={() => {
                                // 打开空白的详情抽屉用于创建新实体
                                setSelectedEntityRef(`${document.path}#new-entity`);
                                setSelectedEntityTitle('新建实体');
                                setDrawerOpen(true);
                            }}
                        >
                            <Plus size={16} />
                            添加
                        </button>
                    )}

                    {/* 视图切换 */}
                    <div className="view-toggle flex items-center gap-1">
                        <button
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded ${viewMode === 'card' ? 'bg-purple-100' : ''}`}
                            style={{
                                color: viewMode === 'card' ? 'var(--color-brand-primary)' : 'var(--ui-field-label-color)',
                            }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded ${viewMode === 'table' ? 'bg-purple-100' : ''}`}
                            style={{
                                color: viewMode === 'table' ? 'var(--color-brand-primary)' : 'var(--ui-field-label-color)',
                            }}
                        >
                            <TableIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 加载状态 */}
            {loading && (
                <div
                    className="text-center py-12"
                    style={{ color: 'var(--ui-field-label-color)' }}
                >
                    加载中...
                </div>
            )}

            {/* 错误状态 */}
            {error && (
                <div className="text-center py-12 text-red-500">
                    {error}
                </div>
            )}

            {/* 空状态 */}
            {!loading && !error && filteredEntities.length === 0 && (
                <div
                    className="text-center py-12"
                    style={{ color: 'var(--ui-field-label-color)' }}
                >
                    <FileText size={48} className="mx-auto mb-4 opacity-50" />
                    <p>暂无数据</p>
                </div>
            )}

            {/* 卡片视图 */}
            {!loading && !error && viewMode === 'card' && (
                <div className="card-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pagedEntities.map((entity) => (
                        <EntityCard
                            key={entity.path}
                            entity={entity}
                            functionType={targetFunction}
                            onClick={() => handleEntityClick(entity)}
                        />
                    ))}
                </div>
            )}

            {/* 表格视图 */}
            {!loading && !error && viewMode === 'table' && (
                <EntityTable
                    entities={pagedEntities}
                    functionType={targetFunction}
                    onRowClick={handleEntityClick}
                />
            )}

            {/* 分页 */}
            {!loading && !error && totalPages > 1 && (
                <div className="pagination flex items-center justify-center gap-4 mt-6">
                    <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="p-2 rounded disabled:opacity-50"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ color: 'var(--ui-field-value-color)' }}>
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="p-2 rounded disabled:opacity-50"
                        style={{ color: 'var(--ui-field-label-color)' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Block 详情抽屉 */}
            <BlockDetailDrawer
                open={drawerOpen}
                onClose={handleDrawerClose}
                blockRef={selectedEntityRef || ''}
                title={selectedEntityTitle}
                onUpdate={handleDataUpdate}
            />
        </div>
    );
}

// ============================================================
// 实体卡片
// ============================================================

interface EntityCardProps {
    entity: FunctionEntry;
    functionType: string;
    onClick: () => void;
}

function EntityCard({ entity, functionType, onClick }: EntityCardProps) {
    const Icon = getEntityIcon(functionType);
    const emails = entity.indexed_fields['identity.emails'] as string[] | undefined;
    const status = entity.indexed_fields['status'] as string | undefined;

    return (
        <div
            className="entity-card p-4 rounded-lg cursor-pointer transition-all hover:shadow-md"
            style={{
                backgroundColor: 'var(--ui-block-body-bg)',
                border: '1px solid var(--ui-block-body-border)',
            }}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* 图标 */}
                <div
                    className="icon-wrapper p-2 rounded-lg"
                    style={{ backgroundColor: 'var(--color-brand-primary)20' }}
                >
                    <Icon size={24} style={{ color: 'var(--color-brand-primary)' }} />
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3
                            className="font-semibold truncate"
                            style={{ color: 'var(--ui-field-value-color)' }}
                        >
                            {entity.title || entity.id}
                        </h3>
                        <ExternalLink
                            size={14}
                            style={{ color: 'var(--ui-field-label-color)' }}
                        />
                    </div>

                    {emails && emails.length > 0 && (
                        <p
                            className="text-sm truncate mt-1"
                            style={{ color: 'var(--ui-field-label-color)' }}
                        >
                            {emails[0]}
                        </p>
                    )}

                    {status && (
                        <span
                            className="inline-block px-2 py-0.5 rounded text-xs mt-2"
                            style={{
                                backgroundColor: status === 'active' ? 'var(--color-status-active-bg)' : 'var(--color-status-draft-bg)',
                                color: status === 'active' ? 'var(--color-status-active)' : 'var(--color-status-draft)',
                            }}
                        >
                            {status === 'active' ? '激活' : status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// 实体表格
// ============================================================

interface EntityTableProps {
    entities: FunctionEntry[];
    functionType: string;
    onRowClick: (entity: FunctionEntry) => void;
}

function EntityTable({ entities, functionType, onRowClick }: EntityTableProps) {
    const columns = getTableColumns(functionType);

    return (
        <div
            className="entity-table rounded-lg overflow-hidden"
            style={{
                backgroundColor: 'var(--ui-block-body-bg)',
                border: '1px solid var(--ui-block-body-border)',
            }}
        >
            <table className="w-full">
                <thead>
                    <tr style={{ backgroundColor: 'var(--ui-block-header-bg)' }}>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                className="px-4 py-3 text-left text-sm font-medium"
                                style={{ color: 'var(--ui-field-label-color)' }}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {entities.map((entity) => (
                        <tr
                            key={entity.path}
                            className="cursor-pointer transition-colors"
                            style={{ borderTop: '1px solid var(--ui-block-body-border)' }}
                            onClick={() => onRowClick(entity)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--ui-block-header-bg)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="px-4 py-3 text-sm"
                                    style={{ color: 'var(--ui-field-value-color)' }}
                                >
                                    {col.render(entity)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================
// 辅助函数
// ============================================================

function getEntityIcon(functionType: string): typeof User {
    const icons: Record<string, typeof User> = {
        principal: User,
        client: Building,
    };
    return icons[functionType] || FileText;
}

function getEntityLabel(functionType: string): string {
    const labels: Record<string, string> = {
        principal: '用户',
        client: '客户',
    };
    return labels[functionType] || '实体';
}

interface TableColumn {
    key: string;
    label: string;
    render: (entity: FunctionEntry) => React.ReactNode;
}

function getTableColumns(functionType: string): TableColumn[] {
    if (functionType === 'principal') {
        return [
            {
                key: 'title',
                label: '姓名',
                render: (e) => e.title || e.id,
            },
            {
                key: 'email',
                label: '邮箱',
                render: (e) => {
                    const emails = e.indexed_fields['identity.emails'] as string[] | undefined;
                    return emails?.[0] || '-';
                },
            },
            {
                key: 'status',
                label: '状态',
                render: (e) => {
                    const status = e.indexed_fields['status'] as string;
                    return status === 'active' ? '激活' : status || '-';
                },
            },
        ];
    }

    // 默认列
    return [
        {
            key: 'title',
            label: '名称',
            render: (e) => e.title || e.id,
        },
        {
            key: 'path',
            label: '路径',
            render: (e) => e.path,
        },
    ];
}

export default EntityListRenderer;

