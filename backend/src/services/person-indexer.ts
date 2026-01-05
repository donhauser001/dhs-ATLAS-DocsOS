/**
 * Person Indexer - Person 索引服务
 * 
 * Phase 4.2: 实现 Person 类型的 staging/verified 双索引
 * 
 * 职责：
 * 1. 扫描并索引所有 doc-type: person 的文档
 * 2. 根据核心字段合同分类到 staging 或 verified
 * 3. 维护搜索索引
 * 4. 支持索引完整重建
 * 
 * 索引路径：
 * - .atlas/indexes/person/staging.json   待审核索引
 * - .atlas/indexes/person/verified.json  正式索引
 * - .atlas/indexes/person/search.json    搜索索引
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { getWorkspaceIndex } from './workspace-service.js';
import { getDocument } from './workspace-registry.js';
import { checkTypeGate, batchCheckTypeGate, updateQuarantine } from './type-gate.js';
import {
    extractFromFrontmatter,
    extractFromBlocks,
    mergeExtractedFields,
    checkVerifiedContract,
    createPersonIndexRecord,
    computeAccessStatus,
    type ExtractedPersonFields,
    type PersonIndexRecord,
} from './person-contract.js';

// Re-export PersonIndexRecord for use by other modules
export type { PersonIndexRecord } from './person-contract.js';

// ============================================================
// 类型定义
// ============================================================

/** Person 索引 */
export interface PersonIndex {
    entries: Record<string, PersonIndexRecord>;
    updated_at: string;
    count: number;
}

/** 搜索索引 */
export interface PersonSearchIndex {
    /** email -> person_id */
    byEmail: Record<string, string>;
    /** phone -> person_id */
    byPhone: Record<string, string>;
    /** name (lowercase) -> person_id[] */
    byName: Record<string, string[]>;
    updated_at: string;
}

/** 索引重建结果 */
export interface PersonIndexRebuildResult {
    staging: PersonIndex;
    verified: PersonIndex;
    search: PersonSearchIndex;
    quarantine: {
        'no-type': number;
        'unknown-type': number;
    };
    stats: {
        totalDocuments: number;
        personDocuments: number;
        stagingCount: number;
        verifiedCount: number;
        rebuildTime: number;
    };
}

// ============================================================
// 索引文件路径
// ============================================================

const PERSON_INDEX_DIR = () => join(config.indexDir, 'person');
const INDEX_PATHS = {
    staging: () => join(PERSON_INDEX_DIR(), 'staging.json'),
    verified: () => join(PERSON_INDEX_DIR(), 'verified.json'),
    search: () => join(PERSON_INDEX_DIR(), 'search.json'),
};

/**
 * 确保 person 索引目录存在
 */
function ensurePersonIndexDir(): void {
    const dir = PERSON_INDEX_DIR();
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
}

// ============================================================
// 核心索引函数
// ============================================================

/**
 * 重建所有 Person 索引
 */
export async function rebuildPersonIndex(): Promise<PersonIndexRebuildResult> {
    const startTime = Date.now();
    
    ensureDirectories();
    ensurePersonIndexDir();
    
    console.log('[PersonIndexer] Starting index rebuild...');
    
    // 初始化索引结构
    const staging: Record<string, PersonIndexRecord> = {};
    const verified: Record<string, PersonIndexRecord> = {};
    const searchByEmail: Record<string, string> = {};
    const searchByPhone: Record<string, string> = {};
    const searchByName: Record<string, string[]> = {};
    
    // 获取所有文档
    const wsIndex = await getWorkspaceIndex();
    const totalDocuments = wsIndex.documents.length;
    
    // 准备批量类型检查
    const documentsToCheck: Array<{ path: string; frontmatter: Record<string, unknown> | null }> = [];
    
    for (const doc of wsIndex.documents) {
        const content = getDocument(doc.path);
        if (!content) continue;
        
        documentsToCheck.push({
            path: doc.path,
            frontmatter: content.document.frontmatter as Record<string, unknown> | null,
        });
    }
    
    // 批量类型检查
    const typeCheckResults = batchCheckTypeGate(documentsToCheck);
    
    // 更新隔离区
    updateQuarantine(typeCheckResults);
    
    // 处理通过类型检查的 person 文档
    let personDocuments = 0;
    
    for (const result of typeCheckResults.valid) {
        if (result.declaredType !== 'person') {
            continue;  // 只处理 person 类型
        }
        
        personDocuments++;
        
        const content = getDocument(result.docPath);
        if (!content) continue;
        
        const frontmatter = content.document.frontmatter as Record<string, unknown> || {};
        const blocks = content.document.blocks || [];
        
        // 提取字段
        const frontmatterFields = extractFromFrontmatter(frontmatter);
        const blockFields = extractFromBlocks(blocks);
        const mergedFields = mergeExtractedFields(frontmatterFields, blockFields);
        
        // 检查合同
        const contractResult = checkVerifiedContract(mergedFields);
        
        // 生成 person ID
        const personId = generatePersonId(result.docPath, frontmatter, mergedFields);
        
        // 创建索引记录
        const record = createPersonIndexRecord(
            personId,
            result.docPath,
            mergedFields,
            contractResult
        );
        
        // 计算登录状态
        record.access.status = computeAccessStatus(record);
        
        // 分类到 staging 或 verified
        if (record.status === 'verified') {
            verified[personId] = record;
        } else {
            staging[personId] = record;
        }
        
        // 构建搜索索引
        if (record.email) {
            searchByEmail[record.email.toLowerCase()] = personId;
        }
        if (record.phone) {
            const phoneNormalized = record.phone.replace(/\D/g, '');
            searchByPhone[phoneNormalized] = personId;
            searchByPhone[record.phone] = personId;
        }
        if (record.display_name) {
            const nameLower = record.display_name.toLowerCase();
            if (!searchByName[nameLower]) {
                searchByName[nameLower] = [];
            }
            searchByName[nameLower].push(personId);
        }
    }
    
    // 构建结果
    const now = new Date().toISOString();
    
    const stagingIndex: PersonIndex = {
        entries: staging,
        updated_at: now,
        count: Object.keys(staging).length,
    };
    
    const verifiedIndex: PersonIndex = {
        entries: verified,
        updated_at: now,
        count: Object.keys(verified).length,
    };
    
    const searchIndex: PersonSearchIndex = {
        byEmail: searchByEmail,
        byPhone: searchByPhone,
        byName: searchByName,
        updated_at: now,
    };
    
    // 写入文件
    writeFileSync(INDEX_PATHS.staging(), JSON.stringify(stagingIndex, null, 2), 'utf-8');
    writeFileSync(INDEX_PATHS.verified(), JSON.stringify(verifiedIndex, null, 2), 'utf-8');
    writeFileSync(INDEX_PATHS.search(), JSON.stringify(searchIndex, null, 2), 'utf-8');
    
    const rebuildTime = Date.now() - startTime;
    
    console.log(`[PersonIndexer] Index rebuilt in ${rebuildTime}ms:`);
    console.log(`  - Total documents: ${totalDocuments}`);
    console.log(`  - Person documents: ${personDocuments}`);
    console.log(`  - Staging: ${stagingIndex.count}`);
    console.log(`  - Verified: ${verifiedIndex.count}`);
    console.log(`  - Quarantine: ${typeCheckResults.quarantine['no-type'].length + typeCheckResults.quarantine['unknown-type'].length}`);
    
    return {
        staging: stagingIndex,
        verified: verifiedIndex,
        search: searchIndex,
        quarantine: {
            'no-type': typeCheckResults.quarantine['no-type'].length,
            'unknown-type': typeCheckResults.quarantine['unknown-type'].length,
        },
        stats: {
            totalDocuments,
            personDocuments,
            stagingCount: stagingIndex.count,
            verifiedCount: verifiedIndex.count,
            rebuildTime,
        },
    };
}

/**
 * 生成 Person ID
 * 优先使用文档中声明的 ID，否则根据路径生成
 */
function generatePersonId(
    docPath: string,
    frontmatter: Record<string, unknown>,
    fields: ExtractedPersonFields
): string {
    // 1. 优先使用 frontmatter 中的 id
    if (frontmatter.id && typeof frontmatter.id === 'string') {
        return frontmatter.id;
    }
    
    // 2. 使用 email 作为 ID（如果有）
    if (fields.email) {
        return `person_${fields.email.replace(/[@.]/g, '_')}`;
    }
    
    // 3. 使用 phone 作为 ID（如果有）
    if (fields.phone) {
        return `person_${fields.phone.replace(/\D/g, '')}`;
    }
    
    // 4. 根据文档路径生成
    const fileName = docPath.split('/').pop()?.replace('.md', '') || 'unknown';
    return `person_${fileName}_${Date.now().toString(36)}`;
}

// ============================================================
// 索引读取函数
// ============================================================

/**
 * 获取 Staging 索引
 */
export function getStagingIndex(): PersonIndex | null {
    const path = INDEX_PATHS.staging();
    if (!existsSync(path)) return null;
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * 获取 Verified 索引
 */
export function getVerifiedIndex(): PersonIndex | null {
    const path = INDEX_PATHS.verified();
    if (!existsSync(path)) return null;
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * 获取搜索索引
 */
export function getSearchIndex(): PersonSearchIndex | null {
    const path = INDEX_PATHS.search();
    if (!existsSync(path)) return null;
    
    try {
        return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
        return null;
    }
}

/**
 * 获取所有 Staging 记录
 */
export function getAllStagingPersons(): PersonIndexRecord[] {
    const index = getStagingIndex();
    if (!index) return [];
    return Object.values(index.entries);
}

/**
 * 获取所有 Verified 记录
 */
export function getAllVerifiedPersons(): PersonIndexRecord[] {
    const index = getVerifiedIndex();
    if (!index) return [];
    return Object.values(index.entries);
}

/**
 * 根据 ID 获取 Person（自动搜索两个索引）
 */
export function getPersonById(personId: string): PersonIndexRecord | null {
    // 先搜索 verified
    const verifiedIndex = getVerifiedIndex();
    if (verifiedIndex?.entries[personId]) {
        return verifiedIndex.entries[personId];
    }
    
    // 再搜索 staging
    const stagingIndex = getStagingIndex();
    if (stagingIndex?.entries[personId]) {
        return stagingIndex.entries[personId];
    }
    
    return null;
}

/**
 * 根据 Email 搜索 Person
 */
export function getPersonByEmail(email: string): PersonIndexRecord | null {
    const searchIndex = getSearchIndex();
    if (!searchIndex) return null;
    
    const personId = searchIndex.byEmail[email.toLowerCase()];
    if (!personId) return null;
    
    return getPersonById(personId);
}

/**
 * 根据 Phone 搜索 Person
 */
export function getPersonByPhone(phone: string): PersonIndexRecord | null {
    const searchIndex = getSearchIndex();
    if (!searchIndex) return null;
    
    const phoneNormalized = phone.replace(/\D/g, '');
    const personId = searchIndex.byPhone[phoneNormalized] || searchIndex.byPhone[phone];
    if (!personId) return null;
    
    return getPersonById(personId);
}

/**
 * 搜索 Person（支持姓名、邮箱、手机模糊搜索）
 */
export function searchPersons(query: string): PersonIndexRecord[] {
    const searchIndex = getSearchIndex();
    if (!searchIndex) return [];
    
    const queryLower = query.toLowerCase();
    const queryNormalized = query.replace(/\D/g, '');
    const matchedIds = new Set<string>();
    
    // 精确匹配 email
    if (searchIndex.byEmail[queryLower]) {
        matchedIds.add(searchIndex.byEmail[queryLower]);
    }
    
    // 精确匹配 phone
    if (queryNormalized && searchIndex.byPhone[queryNormalized]) {
        matchedIds.add(searchIndex.byPhone[queryNormalized]);
    }
    
    // 模糊匹配 name
    for (const [name, personIds] of Object.entries(searchIndex.byName)) {
        if (name.includes(queryLower)) {
            personIds.forEach(id => matchedIds.add(id));
        }
    }
    
    // 前缀匹配 email
    for (const [email, personId] of Object.entries(searchIndex.byEmail)) {
        if (email.startsWith(queryLower) || email.includes(queryLower)) {
            matchedIds.add(personId);
        }
    }
    
    // 前缀匹配 phone
    if (queryNormalized) {
        for (const [phone, personId] of Object.entries(searchIndex.byPhone)) {
            if (phone.startsWith(queryNormalized)) {
                matchedIds.add(personId);
            }
        }
    }
    
    // 获取完整记录
    return Array.from(matchedIds)
        .map(id => getPersonById(id))
        .filter((p): p is PersonIndexRecord => p !== null);
}

// ============================================================
// 索引更新函数
// ============================================================

/**
 * 更新单个 Person 记录
 */
export function updatePersonRecord(record: PersonIndexRecord): void {
    const stagingIndex = getStagingIndex() || { entries: {}, updated_at: '', count: 0 };
    const verifiedIndex = getVerifiedIndex() || { entries: {}, updated_at: '', count: 0 };
    
    const now = new Date().toISOString();
    
    // 从两个索引中移除旧记录
    delete stagingIndex.entries[record.person_id];
    delete verifiedIndex.entries[record.person_id];
    
    // 添加到正确的索引
    if (record.status === 'verified') {
        verifiedIndex.entries[record.person_id] = record;
    } else {
        stagingIndex.entries[record.person_id] = record;
    }
    
    // 更新计数和时间戳
    stagingIndex.count = Object.keys(stagingIndex.entries).length;
    stagingIndex.updated_at = now;
    verifiedIndex.count = Object.keys(verifiedIndex.entries).length;
    verifiedIndex.updated_at = now;
    
    // 写入文件
    ensurePersonIndexDir();
    writeFileSync(INDEX_PATHS.staging(), JSON.stringify(stagingIndex, null, 2), 'utf-8');
    writeFileSync(INDEX_PATHS.verified(), JSON.stringify(verifiedIndex, null, 2), 'utf-8');
    
    // 更新搜索索引
    updateSearchIndex(record);
}

/**
 * 更新搜索索引（单个记录）
 */
function updateSearchIndex(record: PersonIndexRecord): void {
    const searchIndex = getSearchIndex() || { byEmail: {}, byPhone: {}, byName: {}, updated_at: '' };
    
    // 清除可能存在的旧索引（需要全量扫描）
    // 这里简化处理，直接添加新索引
    
    if (record.email) {
        searchIndex.byEmail[record.email.toLowerCase()] = record.person_id;
    }
    
    if (record.phone) {
        const phoneNormalized = record.phone.replace(/\D/g, '');
        searchIndex.byPhone[phoneNormalized] = record.person_id;
        searchIndex.byPhone[record.phone] = record.person_id;
    }
    
    if (record.display_name) {
        const nameLower = record.display_name.toLowerCase();
        if (!searchIndex.byName[nameLower]) {
            searchIndex.byName[nameLower] = [];
        }
        if (!searchIndex.byName[nameLower].includes(record.person_id)) {
            searchIndex.byName[nameLower].push(record.person_id);
        }
    }
    
    searchIndex.updated_at = new Date().toISOString();
    
    writeFileSync(INDEX_PATHS.search(), JSON.stringify(searchIndex, null, 2), 'utf-8');
}

/**
 * 将 Person 从 staging 升级到 verified
 */
export function promoteToVerified(
    personId: string,
    promotedBy?: string
): PersonIndexRecord | null {
    const record = getPersonById(personId);
    if (!record) return null;
    
    if (record.status === 'verified') {
        return record;  // 已经是 verified
    }
    
    // 更新状态
    record.status = 'verified';
    record.audit_trail.promoted_at = new Date().toISOString();
    record.audit_trail.promoted_by = promotedBy;
    
    // 重新计算登录状态
    record.access.status = computeAccessStatus(record);
    
    // 保存更新
    updatePersonRecord(record);
    
    return record;
}

/**
 * 将 Person 从 verified 降级到 staging
 */
export function demoteToStaging(personId: string): PersonIndexRecord | null {
    const record = getPersonById(personId);
    if (!record) return null;
    
    if (record.status === 'staging') {
        return record;  // 已经是 staging
    }
    
    // 更新状态
    record.status = 'staging';
    
    // 登录状态回退到 none
    record.access.status = 'none';
    
    // 保存更新
    updatePersonRecord(record);
    
    return record;
}

// ============================================================
// 统计函数
// ============================================================

/**
 * 获取 Person 索引统计
 */
export function getPersonIndexStats(): {
    staging: number;
    verified: number;
    total: number;
    byAccessStatus: Record<string, number>;
    lastUpdated: string | null;
} {
    const stagingIndex = getStagingIndex();
    const verifiedIndex = getVerifiedIndex();
    
    const staging = stagingIndex?.count || 0;
    const verified = verifiedIndex?.count || 0;
    
    // 统计登录状态分布
    const byAccessStatus: Record<string, number> = {
        none: 0,
        eligible: 0,
        invited: 0,
        active: 0,
        suspended: 0,
    };
    
    const allRecords = [
        ...Object.values(stagingIndex?.entries || {}),
        ...Object.values(verifiedIndex?.entries || {}),
    ];
    
    for (const record of allRecords) {
        const status = record.access.status || 'none';
        byAccessStatus[status] = (byAccessStatus[status] || 0) + 1;
    }
    
    return {
        staging,
        verified,
        total: staging + verified,
        byAccessStatus,
        lastUpdated: verifiedIndex?.updated_at || stagingIndex?.updated_at || null,
    };
}

