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
import { parseTreeData, parseGraphData, flattenTree, getNodeColor, type GraphNode, type GraphEdge } from './types';
import { Box, Zap, File, Component, Circle, CheckCircle2, ArrowRight } from 'lucide-react';

// 图标映射
const ICON_MAP: Record<string, React.ElementType> = {
    box: Box,
    zap: Zap,
    file: File,
    component: Component,
};

// 自定义节点组件
const NetworkNode = ({ data }: { data: any }) => {
    const colors = getNodeColor(data.typeColor);
    const Icon = data.icon ? ICON_MAP[data.icon] : Circle;
    
    return (
        <div 
            className={`
                px-3 py-2 rounded-lg border-2 shadow-sm
                ${colors.bg} ${colors.border} border
                flex items-center gap-2 relative min-w-[100px]
                hover:shadow-md transition-shadow
            `}
        >
            {/* 左侧连接点 */}
            <Handle
                type="target"
                position={Position.Left}
                className="!bg-slate-400 !w-2 !h-2 !border-0"
            />
            
            <Icon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
            <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
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
    network: NetworkNode,
};

// 边的颜色映射
const EDGE_COLORS: Record<string, string> = {
    depends: '#ef4444',
    uses: '#3b82f6',
    extends: '#22c55e',
    default: '#94a3b8',
};

// 使用 dagre 进行布局
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const nodeWidth = 160;
    const nodeHeight = 50;
    
    dagreGraph.setGraph({ 
        rankdir: 'LR',
        nodesep: 80,
        ranksep: 150,
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
        if (!nodeWithPosition) {
            return {
                ...node,
                position: { x: Math.random() * 500, y: Math.random() * 500 },
            };
        }
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
            targetPosition: Position.Left,
            sourcePosition: Position.Right,
        };
    });
    
    return { nodes: layoutedNodes, edges };
};

// 将数据转换为 React Flow 节点和边
function dataToFlowElements(
    graphNodes: GraphNode[], 
    graphEdges: GraphEdge[]
): { nodes: Node[]; edges: Edge[] } {
    // 只保留有关系的节点
    const connectedNodeIds = new Set<string>();
    graphEdges.forEach(edge => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
    });
    
    const filteredNodes = graphNodes.filter(n => connectedNodeIds.has(n.id));
    
    const nodes: Node[] = filteredNodes.map(node => ({
        id: node.id,
        type: 'network',
        position: { x: 0, y: 0 },
        data: {
            label: node.name,
            typeColor: node.typeOption?.color || 'gray',
            icon: node.typeOption?.icon,
            status: node.status,
        },
    }));
    
    const edges: Edge[] = graphEdges.map((edge, index) => {
        const color = EDGE_COLORS[edge.relation || 'default'] || EDGE_COLORS.default;
        return {
            id: `${edge.source}-${edge.target}-${index}`,
            source: edge.source,
            target: edge.target,
            type: 'smoothstep',
            animated: edge.relation === 'depends',
            style: { 
                stroke: color, 
                strokeWidth: 2,
                strokeDasharray: edge.relation === 'depends' ? '5,5' : undefined,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: color,
                width: 20,
                height: 20,
            },
            label: edge.relationOption?.label,
            labelStyle: { 
                fill: color, 
                fontSize: 12, 
                fontWeight: 500,
            },
            labelBgStyle: { 
                fill: 'white', 
                fillOpacity: 0.9,
            },
            labelBgPadding: [4, 8] as [number, number],
            labelBgBorderRadius: 4,
        };
    });
    
    return { nodes, edges };
}

export const GraphNetworkRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    // 解析数据
    const dataBlocks = useMemo(() => parseAtlasDataBlocks(bodyContent || ''), [bodyContent]);
    const treeDataBlock = dataBlocks.find(block => block.type === 'tree');
    const graphDataBlock = dataBlocks.find(block => block.type === 'graph');
    
    // 解析树并扁平化为节点
    const treeData = useMemo(() => {
        if (!treeDataBlock) return [];
        return parseTreeData(treeDataBlock);
    }, [treeDataBlock]);
    
    const flatNodes = useMemo(() => flattenTree(treeData), [treeData]);
    
    // 解析边
    const graphEdges = useMemo(() => {
        if (!graphDataBlock) return [];
        return parseGraphData(graphDataBlock);
    }, [graphDataBlock]);
    
    // 转换为 Flow 元素并布局
    const { initialNodes, initialEdges } = useMemo(() => {
        const { nodes, edges } = dataToFlowElements(flatNodes, graphEdges);
        if (nodes.length === 0) {
            return { initialNodes: [], initialEdges: [] };
        }
        const layouted = getLayoutedElements(nodes, edges);
        return { initialNodes: layouted.nodes, initialEdges: layouted.edges };
    }, [flatNodes, graphEdges]);
    
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    
    // 当初始数据变化时更新
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);
    
    if (!treeDataBlock || initialNodes.length === 0) {
        return (
            <div className="max-w-[1200px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    {!treeDataBlock ? '没有找到结构数据' : '没有找到关系数据'}
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
            {/* 工具栏 */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">关系图谱</h2>
                    <span className="text-sm text-slate-500">
                        {nodes.length} 节点 · {edges.length} 关系
                    </span>
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
                    fitViewOptions={{ padding: 0.3 }}
                    minZoom={0.1}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                    nodesDraggable={true}
                    nodesConnectable={false}
                    elementsSelectable={true}
                >
                    <Controls />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
                </ReactFlow>
            </div>
            
            {/* 图例 */}
            <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center gap-6 text-sm">
                <span className="text-slate-500">关系类型：</span>
                <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">依赖</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-600">使用</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <ArrowRight className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">扩展</span>
                </span>
            </div>
        </div>
    );
};
