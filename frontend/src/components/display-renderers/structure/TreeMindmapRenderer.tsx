import React, { useMemo, useCallback, useEffect } from 'react';
import {
    ReactFlow,
    Node,
    Edge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    BackgroundVariant,
    MarkerType,
    Position,
    Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import type { DisplayRendererProps } from '../types';
import { parseAtlasDataBlocks } from '../list/parseAtlasData';
import { parseTreeData, getNodeColor, type TreeNode } from './types';
import { Box, Zap, File, Component, Circle, CheckCircle2 } from 'lucide-react';

// 图标映射
const ICON_MAP: Record<string, React.ElementType> = {
    box: Box,
    zap: Zap,
    file: File,
    component: Component,
};

// 自定义节点组件
const MindmapNode = ({ data }: { data: any }) => {
    const colors = getNodeColor(data.typeColor);
    const Icon = data.icon ? ICON_MAP[data.icon] : Circle;
    const isRoot = data.level === 0;
    
    return (
        <div 
            className={`
                px-4 py-2 rounded-lg border-2 shadow-sm
                ${isRoot 
                    ? 'bg-slate-800 border-slate-700 text-white min-w-[160px]' 
                    : `${colors.bg} ${colors.border} border`
                }
                flex items-center gap-2 relative
            `}
        >
            {/* 左侧连接点 */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-400 !w-2 !h-2 !border-0"
            />
            
            <Icon className={`w-4 h-4 flex-shrink-0 ${isRoot ? 'text-white' : colors.text}`} />
            <span className={`text-sm font-medium ${isRoot ? 'text-white' : 'text-slate-700'}`}>
                {data.label}
            </span>
            {data.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 text-green-500 absolute -top-1 -right-1 bg-white rounded-full" />
            )}
            {data.status === 'in_progress' && (
                <div className="w-3 h-3 bg-blue-500 rounded-full absolute -top-1 -right-1 border-2 border-white" />
            )}
            
            {/* 右侧连接点 */}
            <Handle
                type="source"
                position={Position.Right}
                className="!bg-slate-400 !w-2 !h-2 !border-0"
            />
        </div>
    );
};

const nodeTypes = {
    mindmap: MindmapNode,
};

// 使用 dagre 进行布局
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 180;
    const nodeHeight = 50;
    
    dagreGraph.setGraph({ 
        rankdir: direction,
        nodesep: 50,
        ranksep: 100,
        marginx: 50,
        marginy: 50,
    });
    
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });
    
    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });
    
    dagre.layout(dagreGraph);
    
    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
            targetPosition: direction === 'LR' ? Position.Left : Position.Top,
            sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
        };
    });
    
    return { nodes: layoutedNodes, edges };
};

// 将树数据转换为 React Flow 节点和边
function treeToFlowElements(treeNodes: TreeNode[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    function traverse(node: TreeNode, parentId?: string) {
        const nodeId = node.id;
        
        nodes.push({
            id: nodeId,
            type: 'mindmap',
            position: { x: 0, y: 0 },
            data: {
                label: node.name,
                typeColor: node.typeOption?.color || 'gray',
                icon: node.typeOption?.icon,
                status: node.status,
                level: node.level,
            },
        });
        
        if (parentId) {
            edges.push({
                id: `${parentId}-${nodeId}`,
                source: parentId,
                target: nodeId,
                type: 'smoothstep',
                style: { stroke: '#94a3b8', strokeWidth: 2 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#94a3b8',
                    width: 15,
                    height: 15,
                },
            });
        }
        
        node.children?.forEach(child => traverse(child, nodeId));
    }
    
    treeNodes.forEach(node => traverse(node));
    
    return { nodes, edges };
}

export const TreeMindmapRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    // 解析数据
    const dataBlocks = useMemo(() => parseAtlasDataBlocks(bodyContent || ''), [bodyContent]);
    const treeDataBlock = dataBlocks.find(block => block.type === 'tree');
    
    const treeData = useMemo(() => {
        if (!treeDataBlock) return [];
        return parseTreeData(treeDataBlock);
    }, [treeDataBlock]);
    
    // 转换为 Flow 元素并布局
    const { initialNodes, initialEdges } = useMemo(() => {
        const { nodes, edges } = treeToFlowElements(treeData);
        const layouted = getLayoutedElements(nodes, edges, 'LR');
        return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
    }, [treeData]);
    
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    
    // 当初始数据变化时更新
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);
    
    // 切换布局方向
    const onLayout = useCallback((direction: string) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            nodes,
            edges,
            direction
        );
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [nodes, edges, setNodes, setEdges]);
    
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
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
                <h2 className="text-lg font-semibold text-slate-800">思维导图</h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => onLayout('LR')}
                        className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        水平布局
                    </button>
                    <button 
                        onClick={() => onLayout('TB')}
                        className="px-3 py-1.5 text-sm rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        垂直布局
                    </button>
                </div>
            </div>
            
            {/* React Flow 画布 */}
            <div className="flex-1 w-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.1}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
                </ReactFlow>
            </div>
            
            {/* 图例 */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center gap-6 text-sm">
                <span className="text-slate-500">状态：</span>
                <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    已完成
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    开发中
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-300" />
                    规划中
                </span>
            </div>
        </div>
    );
};
