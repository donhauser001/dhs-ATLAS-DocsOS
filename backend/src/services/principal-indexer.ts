/**
 * Principal Indexer - Principal/Profile 索引服务
 * 
 * Phase 3.1: 实现用户体系的三层索引
 * 
 * 职责：
 * 1. Entity Index - 实体索引（principal.json, profile.json）
 * 2. Edge Index - 关系边索引（principal↔profile, client↔contacts）
 * 3. Search Index - 检索索引（email/phone/name）
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config, ensureDirectories } from '../config.js';
import { getWorkspaceIndex } from './workspace-service.js';
import { getDocument } from './workspace-registry.js';
import type { Block } from '../adl/types.js';

// ============================================================
// 类型定义
// ============================================================

/** Principal 实体索引条目 */
export interface PrincipalIndexEntry {
  id: string;
  display_name: string;
  status: string;
  emails: string[];
  phones: string[];
  document: string;
  anchor: string;
  profile_count: number;
  profile_ids: string[];
}

/** Profile 实体索引条目 */
export interface ProfileIndexEntry {
  id: string;
  profile_type: string;
  principal_id: string;
  status: string;
  title: string;
  /** employee 档案的部门 */
  department?: string;
  /** client_contact 档案的客户 ID */
  client_id?: string;
  /** client_contact 档案的职位 */
  role_title?: string;
  document: string;
  anchor: string;
}

/** 实体索引 */
export interface EntityIndex<T> {
  entries: Record<string, T>;
  updated_at: string;
  count: number;
}

/** 边索引（一对多关系） */
export interface EdgeIndex {
  edges: Record<string, string[]>;
  updated_at: string;
}

/** 搜索索引 */
export interface SearchIndex {
  entries: Record<string, string>;
  updated_at: string;
}

/** 完整的 Principal 索引结果 */
export interface PrincipalIndexResult {
  principals: EntityIndex<PrincipalIndexEntry>;
  profiles: EntityIndex<ProfileIndexEntry>;
  edges: {
    principal_has_profiles: EdgeIndex;
    profile_belongs_to_principal: EdgeIndex;
    client_has_contacts: EdgeIndex;
    contact_belongs_to_client: EdgeIndex;
  };
  search: {
    principal: SearchIndex;
  };
}

// ============================================================
// 索引文件路径
// ============================================================

const INDEX_PATHS = {
  principals: () => join(config.entitiesDir, 'principal.json'),
  profiles: () => join(config.entitiesDir, 'profile.json'),
  principalHasProfiles: () => join(config.edgesDir, 'principal_has_profiles.json'),
  profileBelongsToPrincipal: () => join(config.edgesDir, 'profile_belongs_to_principal.json'),
  clientHasContacts: () => join(config.edgesDir, 'client_has_contacts.json'),
  contactBelongsToClient: () => join(config.edgesDir, 'contact_belongs_to_client.json'),
  principalSearch: () => join(config.searchDir, 'principal.search.json'),
};

// ============================================================
// 解析辅助函数
// ============================================================

/**
 * 从 ref 对象中提取 anchor ID
 */
function extractAnchorFromRef(ref: unknown): string | null {
  if (!ref || typeof ref !== 'object') return null;
  
  const refObj = ref as { ref?: string };
  if (!refObj.ref || typeof refObj.ref !== 'string') return null;
  
  // 支持格式：
  // - "#anchor"
  // - "path/to/doc.md#anchor"
  const refStr = refObj.ref;
  const hashIndex = refStr.lastIndexOf('#');
  
  if (hashIndex === -1) return null;
  return refStr.substring(hashIndex + 1);
}

/**
 * 从 Block 提取 Principal 信息
 */
function extractPrincipalEntry(block: Block, docPath: string): PrincipalIndexEntry | null {
  const machine = block.machine;
  
  if (machine.type !== 'principal') return null;
  
  const identity = machine.identity as Record<string, unknown> | undefined;
  const profiles = machine.profiles as Array<{ ref: string }> | undefined;
  
  // 提取 profile IDs
  const profileIds: string[] = [];
  if (profiles && Array.isArray(profiles)) {
    for (const p of profiles) {
      const id = extractAnchorFromRef(p);
      if (id) profileIds.push(id);
    }
  }
  
  return {
    id: machine.id as string,
    display_name: (machine.display_name as string) || (machine.title as string) || '',
    status: (machine.status as string) || 'active',
    emails: (identity?.emails as string[]) || [],
    phones: (identity?.phones as string[]) || [],
    document: docPath,
    anchor: block.anchor,
    profile_count: profileIds.length,
    profile_ids: profileIds,
  };
}

/**
 * 从 Block 提取 Profile 信息
 */
function extractProfileEntry(block: Block, docPath: string): ProfileIndexEntry | null {
  const machine = block.machine;
  
  if (machine.type !== 'profile') return null;
  
  const profileType = machine.profile_type as string;
  const principalId = extractAnchorFromRef(machine.principal_ref);
  
  if (!principalId) return null;
  
  const entry: ProfileIndexEntry = {
    id: machine.id as string,
    profile_type: profileType,
    principal_id: principalId,
    status: (machine.status as string) || 'active',
    title: (machine.title as string) || '',
    document: docPath,
    anchor: block.anchor,
  };
  
  // 根据 profile_type 提取特定字段
  if (profileType === 'employee') {
    const employee = machine.employee as Record<string, unknown> | undefined;
    if (employee) {
      entry.department = employee.department as string | undefined;
      entry.title = (employee.title as string) || entry.title;
    }
  } else if (profileType === 'client_contact') {
    entry.client_id = extractAnchorFromRef(machine.client_ref) || undefined;
    entry.role_title = machine.role_title as string | undefined;
  }
  
  return entry;
}

// ============================================================
// 核心索引函数
// ============================================================

/**
 * 重建所有 Principal/Profile 索引
 */
export async function rebuildPrincipalIndex(): Promise<PrincipalIndexResult> {
  ensureDirectories();
  
  console.log('[PrincipalIndexer] Starting index rebuild...');
  
  // 初始化索引结构
  const principals: Record<string, PrincipalIndexEntry> = {};
  const profiles: Record<string, ProfileIndexEntry> = {};
  
  // 获取所有文档
  const wsIndex = await getWorkspaceIndex();
  
  // 遍历所有文档提取 principal 和 profile
  for (const doc of wsIndex.documents) {
    const content = getDocument(doc.path);
    if (!content) continue;
    
    for (const block of content.document.blocks) {
      // 提取 Principal
      const principalEntry = extractPrincipalEntry(block, doc.path);
      if (principalEntry) {
        principals[principalEntry.id] = principalEntry;
      }
      
      // 提取 Profile
      const profileEntry = extractProfileEntry(block, doc.path);
      if (profileEntry) {
        profiles[profileEntry.id] = profileEntry;
      }
    }
  }
  
  // 构建边索引
  const principalHasProfiles: Record<string, string[]> = {};
  const profileBelongsToPrincipal: Record<string, string[]> = {};
  const clientHasContacts: Record<string, string[]> = {};
  const contactBelongsToClient: Record<string, string[]> = {};
  
  for (const [profileId, profile] of Object.entries(profiles)) {
    const principalId = profile.principal_id;
    
    // principal → profiles
    if (!principalHasProfiles[principalId]) {
      principalHasProfiles[principalId] = [];
    }
    principalHasProfiles[principalId].push(profileId);
    
    // profile → principal
    if (!profileBelongsToPrincipal[profileId]) {
      profileBelongsToPrincipal[profileId] = [];
    }
    profileBelongsToPrincipal[profileId].push(principalId);
    
    // client_contact 特有的关系
    if (profile.profile_type === 'client_contact' && profile.client_id) {
      // client → contacts
      if (!clientHasContacts[profile.client_id]) {
        clientHasContacts[profile.client_id] = [];
      }
      clientHasContacts[profile.client_id].push(profileId);
      
      // contact → client
      if (!contactBelongsToClient[profileId]) {
        contactBelongsToClient[profileId] = [];
      }
      contactBelongsToClient[profileId].push(profile.client_id);
    }
  }
  
  // 构建搜索索引
  const searchEntries: Record<string, string> = {};
  
  for (const [principalId, principal] of Object.entries(principals)) {
    // 按 display_name 索引
    const nameLower = principal.display_name.toLowerCase();
    searchEntries[nameLower] = principalId;
    
    // 按 email 索引
    for (const email of principal.emails) {
      searchEntries[email.toLowerCase()] = principalId;
    }
    
    // 按 phone 索引
    for (const phone of principal.phones) {
      // 移除非数字字符用于搜索
      const phoneNormalized = phone.replace(/\D/g, '');
      searchEntries[phoneNormalized] = principalId;
      searchEntries[phone] = principalId;
    }
  }
  
  // 构建结果
  const now = new Date().toISOString();
  
  const result: PrincipalIndexResult = {
    principals: {
      entries: principals,
      updated_at: now,
      count: Object.keys(principals).length,
    },
    profiles: {
      entries: profiles,
      updated_at: now,
      count: Object.keys(profiles).length,
    },
    edges: {
      principal_has_profiles: { edges: principalHasProfiles, updated_at: now },
      profile_belongs_to_principal: { edges: profileBelongsToPrincipal, updated_at: now },
      client_has_contacts: { edges: clientHasContacts, updated_at: now },
      contact_belongs_to_client: { edges: contactBelongsToClient, updated_at: now },
    },
    search: {
      principal: { entries: searchEntries, updated_at: now },
    },
  };
  
  // 写入文件
  writeFileSync(INDEX_PATHS.principals(), JSON.stringify(result.principals, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.profiles(), JSON.stringify(result.profiles, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.principalHasProfiles(), JSON.stringify(result.edges.principal_has_profiles, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.profileBelongsToPrincipal(), JSON.stringify(result.edges.profile_belongs_to_principal, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.clientHasContacts(), JSON.stringify(result.edges.client_has_contacts, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.contactBelongsToClient(), JSON.stringify(result.edges.contact_belongs_to_client, null, 2), 'utf-8');
  writeFileSync(INDEX_PATHS.principalSearch(), JSON.stringify(result.search.principal, null, 2), 'utf-8');
  
  console.log(`[PrincipalIndexer] Index rebuilt: ${result.principals.count} principals, ${result.profiles.count} profiles`);
  
  return result;
}

// ============================================================
// 索引读取函数
// ============================================================

/**
 * 获取 Principal 索引
 */
export function getPrincipalIndex(): EntityIndex<PrincipalIndexEntry> | null {
  const path = INDEX_PATHS.principals();
  if (!existsSync(path)) return null;
  
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * 获取 Profile 索引
 */
export function getProfileIndex(): EntityIndex<ProfileIndexEntry> | null {
  const path = INDEX_PATHS.profiles();
  if (!existsSync(path)) return null;
  
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * 获取 Principal 通过 ID
 */
export function getPrincipalById(id: string): PrincipalIndexEntry | null {
  const index = getPrincipalIndex();
  if (!index) return null;
  return index.entries[id] || null;
}

/**
 * 获取 Profile 通过 ID
 */
export function getProfileById(id: string): ProfileIndexEntry | null {
  const index = getProfileIndex();
  if (!index) return null;
  return index.entries[id] || null;
}

/**
 * 获取 Principal 的所有 Profiles
 */
export function getProfilesByPrincipal(principalId: string): ProfileIndexEntry[] {
  const edgePath = INDEX_PATHS.principalHasProfiles();
  if (!existsSync(edgePath)) return [];
  
  try {
    const edges: EdgeIndex = JSON.parse(readFileSync(edgePath, 'utf-8'));
    const profileIds = edges.edges[principalId] || [];
    
    const profileIndex = getProfileIndex();
    if (!profileIndex) return [];
    
    return profileIds
      .map(id => profileIndex.entries[id])
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 获取 Client 的所有联系人 Profiles
 */
export function getContactsByClient(clientId: string): ProfileIndexEntry[] {
  const edgePath = INDEX_PATHS.clientHasContacts();
  if (!existsSync(edgePath)) return [];
  
  try {
    const edges: EdgeIndex = JSON.parse(readFileSync(edgePath, 'utf-8'));
    const profileIds = edges.edges[clientId] || [];
    
    const profileIndex = getProfileIndex();
    if (!profileIndex) return [];
    
    return profileIds
      .map(id => profileIndex.entries[id])
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 搜索 Principal
 */
export function searchPrincipals(query: string): PrincipalIndexEntry[] {
  const searchPath = INDEX_PATHS.principalSearch();
  if (!existsSync(searchPath)) return [];
  
  try {
    const searchIndex: SearchIndex = JSON.parse(readFileSync(searchPath, 'utf-8'));
    const queryLower = query.toLowerCase();
    const queryNormalized = query.replace(/\D/g, '');
    
    const matchedIds = new Set<string>();
    
    // 精确匹配
    if (searchIndex.entries[queryLower]) {
      matchedIds.add(searchIndex.entries[queryLower]);
    }
    if (queryNormalized && searchIndex.entries[queryNormalized]) {
      matchedIds.add(searchIndex.entries[queryNormalized]);
    }
    
    // 前缀匹配
    for (const [key, principalId] of Object.entries(searchIndex.entries)) {
      if (key.startsWith(queryLower) || key.includes(queryLower)) {
        matchedIds.add(principalId);
      }
    }
    
    const principalIndex = getPrincipalIndex();
    if (!principalIndex) return [];
    
    return Array.from(matchedIds)
      .map(id => principalIndex.entries[id])
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * 获取所有 Principals
 */
export function getAllPrincipals(): PrincipalIndexEntry[] {
  const index = getPrincipalIndex();
  if (!index) return [];
  return Object.values(index.entries);
}

/**
 * 获取所有 Profiles（可按类型筛选）
 */
export function getAllProfiles(profileType?: string): ProfileIndexEntry[] {
  const index = getProfileIndex();
  if (!index) return [];
  
  let profiles = Object.values(index.entries);
  
  if (profileType) {
    profiles = profiles.filter(p => p.profile_type === profileType);
  }
  
  return profiles;
}

