/**
 * 类型包 API 客户端
 * 
 * Phase 4.1: 从后端获取真实的类型包数据
 */

const API_BASE = 'http://localhost:3000/api';

export interface TypePackageBlock {
    id: string;
    name: string;
    description: string;
    required: boolean;
    enabled: boolean;  // 是否启用（在插件设置中控制）
    selected: boolean;
}

export interface TypePackageInfo {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    tags: string[];
    icon: string;
    color: string;
    isOfficial: boolean;
    blocks: TypePackageBlock[];
    defaultFunction?: string;
    defaultDisplay?: string;
}

export interface TypePackagesByCategory {
    [category: string]: {
        label: string;
        packages: TypePackageInfo[];
    };
}

/**
 * 获取所有类型包
 */
export async function getAllTypePackages(): Promise<TypePackageInfo[]> {
    const response = await fetch(`${API_BASE}/type-packages`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get type packages');
    }
    
    return data.data;
}

/**
 * 按分类获取类型包
 */
export async function getTypePackagesByCategory(): Promise<TypePackagesByCategory> {
    const response = await fetch(`${API_BASE}/type-packages/by-category`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get type packages');
    }
    
    return data.data;
}

/**
 * 获取单个类型包详情
 */
export async function getTypePackage(id: string): Promise<TypePackageInfo> {
    const response = await fetch(`${API_BASE}/type-packages/${encodeURIComponent(id)}`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get type package');
    }
    
    return data.data;
}

/**
 * 获取类型包的数据块定义
 */
export async function getTypePackageBlocks(id: string): Promise<TypePackageBlock[]> {
    const response = await fetch(`${API_BASE}/type-packages/${encodeURIComponent(id)}/blocks`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get blocks');
    }
    
    return data.data;
}

// ============================================================
// 文档创建
// ============================================================

export interface CreateDocumentRequest {
    typePackageId: string;
    title: string;
    path?: string;
    blocks?: string[];
}

export interface CreateDocumentResponse {
    path: string;
    absolutePath: string;
    title: string;
    typePackageId: string;
}

/**
 * 基于类型包创建文档
 */
export async function createDocument(req: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    const response = await fetch(`${API_BASE}/type-packages/create-document`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // 携带认证 cookie
        body: JSON.stringify(req),
    });
    
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || '创建文档失败');
    }
    
    return data.data;
}

