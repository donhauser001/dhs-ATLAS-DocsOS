import type { AtlasDataBlock } from '../list/types';

// 树节点
export interface TreeNode {
    id: string;
    name: string;
    type?: string;
    typeOption?: {
        label: string;
        color: string;
        icon?: string;
    };
    status?: string;
    statusOption?: {
        label: string;
        color: string;
    };
    owner?: string;
    description?: string;
    children?: TreeNode[];
    // 用于 UI 状态
    expanded?: boolean;
    level?: number;
}

// 关系边
export interface GraphEdge {
    source: string;
    target: string;
    relation?: string;
    relationOption?: {
        label: string;
        color: string;
    };
}

// 图节点（扁平化后的）
export interface GraphNode {
    id: string;
    name: string;
    type?: string;
    typeOption?: {
        label: string;
        color: string;
        icon?: string;
    };
    status?: string;
    statusOption?: {
        label: string;
        color: string;
    };
    x?: number;
    y?: number;
}

// 解析树形数据
export function parseTreeData(dataBlock: AtlasDataBlock): TreeNode[] {
    if (!dataBlock || !dataBlock.data || !Array.isArray(dataBlock.data)) {
        return [];
    }

    const { data, schema } = dataBlock;
    const typeSchema = schema?.find(s => s.key === 'type');
    const statusSchema = schema?.find(s => s.key === 'status');

    function parseNode(item: any, level: number = 0): TreeNode {
        const typeOption = typeSchema?.options?.find(opt => opt.value === item.type);
        const statusOption = statusSchema?.options?.find(opt => opt.value === item.status);

        return {
            id: item.id,
            name: item.name,
            type: item.type,
            typeOption: typeOption ? { label: typeOption.label, color: typeOption.color, icon: typeOption.icon } : undefined,
            status: item.status,
            statusOption: statusOption ? { label: statusOption.label, color: statusOption.color } : undefined,
            owner: item.owner,
            description: item.description,
            children: item.children?.map((child: any) => parseNode(child, level + 1)),
            expanded: level < 2, // 默认展开前两层
            level,
        };
    }

    return data.map(item => parseNode(item, 0));
}

// 将树扁平化为节点列表
export function flattenTree(nodes: TreeNode[]): GraphNode[] {
    const result: GraphNode[] = [];

    function traverse(node: TreeNode) {
        result.push({
            id: node.id,
            name: node.name,
            type: node.type,
            typeOption: node.typeOption,
            status: node.status,
            statusOption: node.statusOption,
        });
        node.children?.forEach(traverse);
    }

    nodes.forEach(traverse);
    return result;
}

// 解析关系数据
export function parseGraphData(dataBlock: AtlasDataBlock): GraphEdge[] {
    if (!dataBlock || !dataBlock.data || !Array.isArray(dataBlock.data)) {
        return [];
    }

    const { data, schema } = dataBlock;
    const relationSchema = schema?.find(s => s.key === 'relation');

    return data.map(item => {
        const relationOption = relationSchema?.options?.find(opt => opt.value === item.relation);
        return {
            source: item.source,
            target: item.target,
            relation: item.relation,
            relationOption: relationOption ? { label: relationOption.label, color: relationOption.color } : undefined,
        };
    });
}

// 颜色映射
export function getNodeColor(color: string = 'gray'): { bg: string; text: string; border: string } {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
        gray: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
        slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
    };
    return colorMap[color] || colorMap.gray;
}

export function getStatusBadge(color: string = 'gray'): string {
    const colorMap: Record<string, string> = {
        green: 'bg-green-100 text-green-700',
        blue: 'bg-blue-100 text-blue-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        red: 'bg-red-100 text-red-700',
        gray: 'bg-slate-100 text-slate-600',
    };
    return colorMap[color] || colorMap.gray;
}

