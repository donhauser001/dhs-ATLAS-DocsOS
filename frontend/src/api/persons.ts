/**
 * Person API - 前端 API 封装
 * 
 * Phase 4.2: 封装 Person 相关的所有 API 调用
 */

const API_BASE = '/api/person';

// ============================================================
// 类型定义
// ============================================================

/** Person 索引记录 */
export interface PersonRecord {
    person_id: string;
    source_doc: string;
    status: 'staging' | 'verified';
    confidence: number;
    missing_fields: string[];
    issues: string[];
    
    // 核心字段
    display_name: string;
    email?: string;
    phone?: string;
    avatar?: string;
    title?: string;
    company?: string;
    department?: string;
    tags?: string[];
    
    // 访问控制
    access: {
        status: 'none' | 'eligible' | 'invited' | 'active' | 'suspended';
        enabled: boolean;
        contact_verified: boolean;
        invited_at?: string;
        claimed_at?: string;
        last_login?: string;
    };
    
    // 审计追踪
    audit_trail: {
        created_at: string;
        created_by?: string;
        promoted_at?: string;
        promoted_by?: string;
    };
}

/** 审计记录 */
export interface AuditRecord {
    id: string;
    person_id: string;
    action: string;
    operator: string;
    operator_name?: string;
    timestamp: string;
    from_state?: {
        index_status?: string;
        access_status?: string;
    };
    to_state?: {
        index_status?: string;
        access_status?: string;
    };
    field_changes?: Array<{
        field: string;
        old_value?: unknown;
        new_value?: unknown;
    }>;
    reason?: string;
}

/** 可用动作 */
export interface AvailableAction {
    action: string;
    label: string;
    endpoint: string;
    method: string;
    targetStatus: string;
    requiresPermission?: string;
}

/** 索引统计 */
export interface PersonIndexStats {
    staging: number;
    verified: number;
    total: number;
    byAccessStatus: Record<string, number>;
    lastUpdated: string | null;
}

/** 隔离区统计 */
export interface QuarantineStats {
    total: number;
    'no-type': number;
    'unknown-type': number;
    byDeclaredType: Record<string, number>;
}

// ============================================================
// API 函数
// ============================================================

/**
 * 获取待审核列表
 */
export async function fetchStagingPersons(): Promise<PersonRecord[]> {
    const response = await fetch(`${API_BASE}/staging`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch staging persons');
    }
    
    return data.data.persons;
}

/**
 * 获取已验证列表
 */
export async function fetchVerifiedPersons(): Promise<PersonRecord[]> {
    const response = await fetch(`${API_BASE}/verified`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch verified persons');
    }
    
    return data.data.persons;
}

/**
 * 获取 Person 详情
 */
export async function fetchPerson(id: string): Promise<{
    person: PersonRecord;
    audit_trail: AuditRecord[];
}> {
    const response = await fetch(`${API_BASE}/${id}`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch person');
    }
    
    return data.data;
}

/**
 * 搜索 Person
 */
export async function searchPersons(query: string): Promise<PersonRecord[]> {
    const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to search persons');
    }
    
    return data.data.results;
}

/**
 * 获取统计信息
 */
export async function fetchPersonStats(): Promise<{
    index: PersonIndexStats;
    quarantine: QuarantineStats;
}> {
    const response = await fetch(`${API_BASE}/stats`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
    }
    
    return data.data;
}

/**
 * 重建索引
 */
export async function rebuildPersonIndex(): Promise<{
    stats: {
        totalDocuments: number;
        personDocuments: number;
        stagingCount: number;
        verifiedCount: number;
        rebuildTime: number;
    };
    quarantine: {
        'no-type': number;
        'unknown-type': number;
    };
}> {
    const response = await fetch(`${API_BASE}/rebuild-index`, {
        method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to rebuild index');
    }
    
    return data.data;
}

// ============================================================
// 审核相关 API
// ============================================================

/**
 * 验证并升级 Person
 */
export async function verifyPerson(id: string, reason?: string): Promise<PersonRecord> {
    const response = await fetch(`${API_BASE}/staging/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to verify person');
    }
    
    return data.data.person;
}

/**
 * 补全字段并升级
 */
export async function completePerson(
    id: string,
    fields: Partial<{
        display_name: string;
        email: string;
        phone: string;
        title: string;
        company: string;
        department: string;
    }>,
    reason?: string
): Promise<{ person: PersonRecord; promoted: boolean }> {
    const response = await fetch(`${API_BASE}/staging/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields, reason }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to complete person');
    }
    
    return data.data;
}

/**
 * 拒绝 Person
 */
export async function rejectPerson(id: string, reason: string): Promise<void> {
    const response = await fetch(`${API_BASE}/staging/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to reject person');
    }
}

/**
 * 降级 Person
 */
export async function demotePerson(id: string, reason?: string): Promise<PersonRecord> {
    const response = await fetch(`${API_BASE}/verified/${id}/demote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to demote person');
    }
    
    return data.data.person;
}

// ============================================================
// 邀请相关 API
// ============================================================

/**
 * 发送邀请
 */
export async function sendInvite(
    id: string,
    options?: { method?: 'email' | 'sms'; type?: 'magic_link' | 'otp' }
): Promise<{
    method: 'email' | 'sms';
    target: string;
    expiresAt: string;
    magicLink?: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to send invite');
    }
    
    return data.data;
}

/**
 * 重发邀请
 */
export async function resendInvite(id: string): Promise<{
    method: 'email' | 'sms';
    target: string;
    expiresAt: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/resend-invite`, {
        method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to resend invite');
    }
    
    return data.data;
}

/**
 * 取消邀请
 */
export async function cancelInvite(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}/cancel-invite`, {
        method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to cancel invite');
    }
}

/**
 * 获取待使用邀请信息
 */
export async function getPendingInvite(id: string): Promise<{
    hasPending: boolean;
    method?: 'email' | 'sms';
    target?: string;
    createdAt?: string;
    expiresAt?: string;
} | null> {
    const response = await fetch(`${API_BASE}/${id}/pending-invite`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get pending invite');
    }
    
    return data.data;
}

/**
 * 验证邀请 Token
 */
export async function validateToken(token: string): Promise<{
    valid: boolean;
    person_id?: string;
    display_name?: string;
    email?: string;
    error?: string;
}> {
    const response = await fetch(`${API_BASE}/validate-token/${token}`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to validate token');
    }
    
    return data.data;
}

/**
 * 认领账户
 */
export async function claimAccount(token: string, password: string): Promise<{
    person_id: string;
    display_name?: string;
}> {
    const response = await fetch(`${API_BASE}/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to claim account');
    }
    
    return data.data;
}

// ============================================================
// 登录状态管理 API
// ============================================================

/**
 * 直接启用登录
 */
export async function enableLogin(id: string): Promise<{
    fromStatus: string;
    toStatus: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/enable`, {
        method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to enable login');
    }
    
    return data.data;
}

/**
 * 禁用登录
 */
export async function suspendLogin(id: string, reason?: string): Promise<{
    fromStatus: string;
    toStatus: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to suspend login');
    }
    
    return data.data;
}

/**
 * 恢复登录
 */
export async function reactivateLogin(id: string): Promise<{
    fromStatus: string;
    toStatus: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/reactivate`, {
        method: 'POST',
    });
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to reactivate login');
    }
    
    return data.data;
}

/**
 * 获取登录状态
 */
export async function getAccessStatus(id: string): Promise<{
    status: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    enabled: boolean;
    contactVerified: boolean;
    invitedAt?: string;
    claimedAt?: string;
    lastLogin?: string;
}> {
    const response = await fetch(`${API_BASE}/${id}/access-status`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get access status');
    }
    
    return data.data;
}

/**
 * 获取可用动作
 */
export async function getAvailableActions(id: string): Promise<{
    currentStatus: string;
    actions: AvailableAction[];
}> {
    const response = await fetch(`${API_BASE}/${id}/available-actions`);
    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.error || 'Failed to get available actions');
    }
    
    return data.data;
}

