import React, { useState, useMemo, useCallback } from 'react';
import type { DisplayRendererProps } from '../types';
import { parseAtlasDataBlocks } from '../list/parseAtlasData';
import { parseTreeData, getNodeColor, getStatusBadge, type TreeNode } from './types';
import { ChevronRight, ChevronDown, Box, Zap, File, Component, Circle, User, CheckCircle2 } from 'lucide-react';

// 图标映射
const ICON_MAP: Record<string, React.ElementType> = {
    box: Box,
    zap: Zap,
    file: File,
    component: Component,
};

interface TreeNodeItemProps {
    node: TreeNode;
    onToggle: (id: string) => void;
    expandedIds: Set<string>;
}

function TreeNodeItem({ node, onToggle, expandedIds }: TreeNodeItemProps) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const colors = getNodeColor(node.typeOption?.color);
    const Icon = node.typeOption?.icon ? ICON_MAP[node.typeOption.icon] : Circle;
    
    return (
        <div className="select-none">
            {/* 节点行 */}
            <div 
                className={`
                    flex items-center gap-2 py-2 px-3 rounded-lg
                    hover:bg-slate-50 transition-colors cursor-pointer
                    ${!hasChildren ? 'pl-8' : ''}
                `}
                onClick={() => hasChildren && onToggle(node.id)}
            >
                {/* 展开/折叠按钮 */}
                {hasChildren && (
                    <button 
                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggle(node.id);
                        }}
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </button>
                )}
                
                {/* 图标 */}
                <div className={`w-6 h-6 rounded flex items-center justify-center ${colors.bg} ${colors.border} border`}>
                    <Icon className={`w-3.5 h-3.5 ${colors.text}`} />
                </div>
                
                {/* 名称 */}
                <span className="font-medium text-slate-800 flex-1">{node.name}</span>
                
                {/* 状态标签 */}
                {node.statusOption && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(node.statusOption.color)}`}>
                        {node.statusOption.label}
                    </span>
                )}
                
                {/* 负责人 */}
                {node.owner && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        {node.owner}
                    </span>
                )}
                
                {/* 类型标签 */}
                {node.typeOption && (
                    <span className={`text-xs px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                        {node.typeOption.label}
                    </span>
                )}
            </div>
            
            {/* 子节点 */}
            {hasChildren && isExpanded && (
                <div className="ml-5 border-l border-slate-200 pl-2">
                    {node.children!.map(child => (
                        <TreeNodeItem 
                            key={child.id} 
                            node={child} 
                            onToggle={onToggle} 
                            expandedIds={expandedIds}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export const TreeOutlineRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    // 解析 atlas-data
    const dataBlocks = useMemo(() => parseAtlasDataBlocks(bodyContent || ''), [bodyContent]);
    const treeDataBlock = dataBlocks.find(block => block.type === 'tree');
    
    // 解析树数据
    const treeData = useMemo(() => {
        if (!treeDataBlock) return [];
        return parseTreeData(treeDataBlock);
    }, [treeDataBlock]);
    
    // 管理展开状态
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
        // 默认展开前两层
        const ids = new Set<string>();
        function addExpanded(nodes: TreeNode[], maxLevel: number = 2) {
            nodes.forEach(node => {
                if ((node.level ?? 0) < maxLevel) {
                    ids.add(node.id);
                }
                if (node.children) {
                    addExpanded(node.children, maxLevel);
                }
            });
        }
        addExpanded(treeData);
        return ids;
    });
    
    const handleToggle = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);
    
    // 统计
    const stats = useMemo(() => {
        let total = 0;
        let completed = 0;
        let inProgress = 0;
        let planned = 0;
        
        function count(nodes: TreeNode[]) {
            nodes.forEach(node => {
                total++;
                if (node.status === 'done') completed++;
                else if (node.status === 'in_progress') inProgress++;
                else if (node.status === 'planned') planned++;
                if (node.children) count(node.children);
            });
        }
        count(treeData);
        return { total, completed, inProgress, planned };
    }, [treeData]);
    
    // 展开全部/折叠全部
    const handleExpandAll = useCallback(() => {
        const ids = new Set<string>();
        function addAll(nodes: TreeNode[]) {
            nodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    ids.add(node.id);
                    addAll(node.children);
                }
            });
        }
        addAll(treeData);
        setExpandedIds(ids);
    }, [treeData]);
    
    const handleCollapseAll = useCallback(() => {
        setExpandedIds(new Set());
    }, []);
    
    if (!treeDataBlock) {
        return (
            <div className="max-w-[1200px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    没有找到树形数据
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-[1200px] mx-auto px-8 py-6">
            {/* 标题和统计 */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-semibold text-slate-800">大纲视图</h2>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-slate-500">共 <span className="font-medium text-slate-700">{stats.total}</span> 项</span>
                        <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            {stats.completed} 已完成
                        </span>
                        <span className="text-blue-600">{stats.inProgress} 开发中</span>
                        <span className="text-slate-400">{stats.planned} 规划中</span>
                    </div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                    <button 
                        className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        onClick={handleExpandAll}
                    >
                        展开全部
                    </button>
                    <button 
                        className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                        onClick={handleCollapseAll}
                    >
                        折叠全部
                    </button>
                </div>
            </div>
            
            {/* 树形列表 */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="p-4">
                    {treeData.map(node => (
                        <TreeNodeItem 
                            key={node.id}
                            node={node}
                            onToggle={handleToggle}
                            expandedIds={expandedIds}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

