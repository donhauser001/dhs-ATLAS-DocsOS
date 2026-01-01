/**
 * Phase 3.1 E2E 测试脚本
 * 
 * 测试内容：
 * 1. Parser 正确解析 principal/profile block
 * 2. Schema Validator 校验 principal/profile 必填字段
 * 3. 索引正确生成 principal↔profile 关系
 * 4. 索引正确生成 client↔contacts 关系
 * 5. 搜索索引支持 email/phone/name 查询
 * 6. Principal API 返回正确数据
 * 7. Profile API 返回正确数据
 * 8. 跨文档 ref 解析正确
 * 
 * 运行方式：
 * cd backend && npx tsx scripts/phase3.1-e2e.ts
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../src/config.js';
import { parseADL } from '../src/adl/parser.js';
import { validateBlock, validateDocument } from '../src/adl/schema-validator.js';
import {
  rebuildPrincipalIndex,
  getPrincipalById,
  getProfileById,
  getProfilesByPrincipal,
  getContactsByClient,
  searchPrincipals,
  getAllPrincipals,
  getAllProfiles,
} from '../src/services/principal-indexer.js';
import { rebuildWorkspaceIndex } from '../src/services/workspace-service.js';

// ============================================================
// 测试工具
// ============================================================

let passCount = 0;
let failCount = 0;

function e2eLog(message: string): void {
  console.log(message);
}

function pass(name: string): void {
  e2eLog(`[PASS] ${name}`);
  passCount++;
}

function fail(name: string, error?: unknown): void {
  e2eLog(`[FAIL] ${name}`);
  if (error) {
    e2eLog(`       ${error instanceof Error ? error.message : String(error)}`);
  }
  failCount++;
}

function assert(condition: boolean, name: string, error?: unknown): void {
  if (condition) {
    pass(name);
  } else {
    fail(name, error);
  }
}

// ============================================================
// 测试用例
// ============================================================

async function testPrincipalParser(): Promise<void> {
  e2eLog('\n=== 测试 Principal Parser ===\n');
  
  const principalsPath = join(config.repositoryRoot, 'users/principals.md');
  
  if (!existsSync(principalsPath)) {
    fail('Parser: principals.md 文件不存在');
    return;
  }
  
  try {
    const content = readFileSync(principalsPath, 'utf-8');
    const doc = parseADL(content, 'users/principals.md');
    
    assert(doc.blocks.length > 0, 'Parser: principals.md 包含 blocks');
    
    // 检查是否有 principal 类型的 block
    const principals = doc.blocks.filter(b => b.machine.type === 'principal');
    assert(principals.length > 0, 'Parser: 包含 principal 类型');
    
    // 检查第一个 principal 的结构
    const first = principals[0];
    assert(first.machine.display_name !== undefined, 'Parser: principal 有 display_name');
    assert(first.machine.identity !== undefined, 'Parser: principal 有 identity');
    assert(first.machine.status !== undefined, 'Parser: principal 有 status');
  } catch (err) {
    fail('Parser: 解析 principals.md', err);
  }
}

async function testProfileParser(): Promise<void> {
  e2eLog('\n=== 测试 Profile Parser ===\n');
  
  const employeesPath = join(config.repositoryRoot, 'users/profiles/employees.md');
  
  if (!existsSync(employeesPath)) {
    fail('Parser: employees.md 文件不存在');
    return;
  }
  
  try {
    const content = readFileSync(employeesPath, 'utf-8');
    const doc = parseADL(content, 'users/profiles/employees.md');
    
    assert(doc.blocks.length > 0, 'Parser: employees.md 包含 blocks');
    
    // 检查是否有 profile 类型的 block
    const profiles = doc.blocks.filter(b => b.machine.type === 'profile');
    assert(profiles.length > 0, 'Parser: 包含 profile 类型');
    
    // 检查第一个 profile 的结构
    const first = profiles[0];
    assert(first.machine.profile_type !== undefined, 'Parser: profile 有 profile_type');
    assert(first.machine.principal_ref !== undefined, 'Parser: profile 有 principal_ref');
  } catch (err) {
    fail('Parser: 解析 employees.md', err);
  }
}

async function testSchemaValidator(): Promise<void> {
  e2eLog('\n=== 测试 Schema Validator ===\n');
  
  // 测试有效的 Principal Block
  const validPrincipal = {
    anchor: 'u-test',
    heading: 'Test User',
    level: 2,
    body: '',
    machine: {
      type: 'principal',
      id: 'u-test',
      status: 'active' as const,
      title: 'Test User',
      display_name: 'Test User',
      identity: {
        emails: ['test@example.com'],
        phones: ['123-456-7890'],
      },
    },
  };
  
  try {
    const result = validateBlock(validPrincipal);
    assert(result.valid === true, 'Validator: 有效 Principal 通过验证');
  } catch (err) {
    fail('Validator: 有效 Principal 验证', err);
  }
  
  // 测试缺少 display_name 的 Principal
  const invalidPrincipal = {
    anchor: 'u-invalid',
    heading: 'Invalid User',
    level: 2,
    body: '',
    machine: {
      type: 'principal',
      id: 'u-invalid',
      status: 'active' as const,
      title: 'Invalid User',
      // 缺少 display_name 和 identity
    } as any,
  };
  
  try {
    const result = validateBlock(invalidPrincipal);
    assert(result.valid === false, 'Validator: 缺少必填字段不通过');
    assert(result.errors.some(e => e.field === 'display_name'), 'Validator: 报告缺少 display_name');
  } catch (err) {
    fail('Validator: 缺少必填字段检测', err);
  }
  
  // 测试有效的 Profile Block
  const validProfile = {
    anchor: 'p-test',
    heading: 'Test Profile',
    level: 2,
    body: '',
    machine: {
      type: 'profile',
      id: 'p-test',
      status: 'active' as const,
      title: 'Test Profile',
      profile_type: 'employee',
      principal_ref: { ref: '#u-test' },
      employee: {
        employee_no: 'EMP-001',
        department: 'Test Dept',
        title: 'Tester',
      },
    },
  };
  
  try {
    const result = validateBlock(validProfile);
    assert(result.valid === true, 'Validator: 有效 Profile 通过验证');
  } catch (err) {
    fail('Validator: 有效 Profile 验证', err);
  }
  
  // 测试缺少 profile_type 的 Profile
  const invalidProfile = {
    anchor: 'p-invalid',
    heading: 'Invalid Profile',
    level: 2,
    body: '',
    machine: {
      type: 'profile',
      id: 'p-invalid',
      status: 'active' as const,
      title: 'Invalid Profile',
      // 缺少 profile_type 和 principal_ref
    } as any,
  };
  
  try {
    const result = validateBlock(invalidProfile);
    assert(result.valid === false, 'Validator: 缺少 profile_type 不通过');
    assert(result.errors.some(e => e.field === 'profile_type'), 'Validator: 报告缺少 profile_type');
  } catch (err) {
    fail('Validator: 缺少 profile_type 检测', err);
  }
}

async function testPrincipalIndex(): Promise<void> {
  e2eLog('\n=== 测试 Principal 索引 ===\n');
  
  try {
    // 先重建 workspace 索引
    await rebuildWorkspaceIndex();
    
    // 重建 Principal 索引
    const result = await rebuildPrincipalIndex();
    
    assert(result.principals.count > 0, 'Index: 索引包含 principals');
    assert(result.profiles.count > 0, 'Index: 索引包含 profiles');
    
    // 检查边索引
    const hasEdges = Object.keys(result.edges.principal_has_profiles.edges).length > 0;
    assert(hasEdges, 'Index: 生成了 principal_has_profiles 边索引');
    
    // 检查搜索索引
    const hasSearch = Object.keys(result.search.principal.entries).length > 0;
    assert(hasSearch, 'Index: 生成了搜索索引');
  } catch (err) {
    fail('Index: 重建索引', err);
  }
}

async function testPrincipalQueries(): Promise<void> {
  e2eLog('\n=== 测试 Principal 查询 ===\n');
  
  try {
    // 获取所有 principals
    const allPrincipals = getAllPrincipals();
    assert(allPrincipals.length > 0, 'Query: getAllPrincipals 返回数据');
    
    // 按 ID 获取
    const firstPrincipal = allPrincipals[0];
    const byId = getPrincipalById(firstPrincipal.id);
    assert(byId !== null, 'Query: getPrincipalById 找到数据');
    assert(byId?.id === firstPrincipal.id, 'Query: getPrincipalById 返回正确数据');
    
    // 获取 profiles
    const profiles = getProfilesByPrincipal(firstPrincipal.id);
    e2eLog(`       找到 ${profiles.length} 个 profiles`);
    assert(profiles.length >= 0, 'Query: getProfilesByPrincipal 返回数组');
  } catch (err) {
    fail('Query: Principal 查询', err);
  }
}

async function testProfileQueries(): Promise<void> {
  e2eLog('\n=== 测试 Profile 查询 ===\n');
  
  try {
    // 获取所有 profiles
    const allProfiles = getAllProfiles();
    assert(allProfiles.length > 0, 'Query: getAllProfiles 返回数据');
    
    // 按类型获取
    const employees = getAllProfiles('employee');
    e2eLog(`       找到 ${employees.length} 个 employee profiles`);
    assert(employees.every(p => p.profile_type === 'employee'), 'Query: 按类型筛选正确');
    
    // 按 ID 获取
    if (allProfiles.length > 0) {
      const firstProfile = allProfiles[0];
      const byId = getProfileById(firstProfile.id);
      assert(byId !== null, 'Query: getProfileById 找到数据');
      assert(byId?.id === firstProfile.id, 'Query: getProfileById 返回正确数据');
    }
  } catch (err) {
    fail('Query: Profile 查询', err);
  }
}

async function testSearchIndex(): Promise<void> {
  e2eLog('\n=== 测试搜索索引 ===\n');
  
  try {
    const allPrincipals = getAllPrincipals();
    
    if (allPrincipals.length > 0) {
      const firstPrincipal = allPrincipals[0];
      
      // 按名称搜索
      const byName = searchPrincipals(firstPrincipal.display_name);
      assert(byName.length > 0, 'Search: 按名称搜索返回结果');
      assert(byName.some(p => p.id === firstPrincipal.id), 'Search: 搜索结果包含目标');
      
      // 按 email 搜索
      if (firstPrincipal.emails.length > 0) {
        const byEmail = searchPrincipals(firstPrincipal.emails[0]);
        assert(byEmail.length > 0, 'Search: 按 email 搜索返回结果');
      }
      
      // 按 phone 搜索
      if (firstPrincipal.phones.length > 0) {
        const byPhone = searchPrincipals(firstPrincipal.phones[0]);
        assert(byPhone.length > 0, 'Search: 按 phone 搜索返回结果');
      }
    }
  } catch (err) {
    fail('Search: 搜索索引', err);
  }
}

async function testEdgeRelations(): Promise<void> {
  e2eLog('\n=== 测试关系边索引 ===\n');
  
  try {
    const allProfiles = getAllProfiles('client_contact');
    
    if (allProfiles.length > 0) {
      // 找一个有 client_id 的 profile
      const contactProfile = allProfiles.find(p => p.client_id);
      
      if (contactProfile && contactProfile.client_id) {
        const contacts = getContactsByClient(contactProfile.client_id);
        assert(contacts.length > 0, 'Edge: getContactsByClient 返回结果');
        assert(contacts.some(c => c.id === contactProfile.id), 'Edge: 结果包含原 profile');
      }
    }
  } catch (err) {
    fail('Edge: 关系边索引', err);
  }
}

async function testRealDocuments(): Promise<void> {
  e2eLog('\n=== 测试真实文档 ===\n');
  
  // 测试 Profile Type Registry
  const registryPath = join(config.repositoryRoot, 'system/profile-types.md');
  
  if (existsSync(registryPath)) {
    try {
      const content = readFileSync(registryPath, 'utf-8');
      const doc = parseADL(content, 'system/profile-types.md');
      
      assert(doc.blocks.length > 0, '真实文档: profile-types.md 包含 blocks');
      
      // 检查是否有 registry 类型
      const registries = doc.blocks.filter(b => b.machine.type === 'registry');
      assert(registries.length > 0, '真实文档: 包含 registry 类型');
    } catch (err) {
      fail('真实文档: 解析 profile-types.md', err);
    }
  } else {
    e2eLog('       profile-types.md 不存在，跳过');
  }
  
  // 测试 client-contacts.md
  const contactsPath = join(config.repositoryRoot, 'users/profiles/client-contacts.md');
  
  if (existsSync(contactsPath)) {
    try {
      const content = readFileSync(contactsPath, 'utf-8');
      const doc = parseADL(content, 'users/profiles/client-contacts.md');
      
      assert(doc.blocks.length > 0, '真实文档: client-contacts.md 包含 blocks');
      
      // 检查 client_contact 类型
      const contacts = doc.blocks.filter(b => 
        b.machine.type === 'profile' && 
        b.machine.profile_type === 'client_contact'
      );
      assert(contacts.length > 0, '真实文档: 包含 client_contact profiles');
    } catch (err) {
      fail('真实文档: 解析 client-contacts.md', err);
    }
  } else {
    e2eLog('       client-contacts.md 不存在，跳过');
  }
}

// ============================================================
// 主函数
// ============================================================

async function main(): Promise<void> {
  e2eLog('================================================');
  e2eLog('   Phase 3.1 E2E 测试');
  e2eLog('   Principal + Profile 用户体系');
  e2eLog('================================================');
  
  try {
    await testPrincipalParser();
    await testProfileParser();
    await testSchemaValidator();
    await testPrincipalIndex();
    await testPrincipalQueries();
    await testProfileQueries();
    await testSearchIndex();
    await testEdgeRelations();
    await testRealDocuments();
  } catch (err) {
    e2eLog(`\n[FATAL] 测试运行时错误: ${err}`);
  }
  
  e2eLog('\n================================================');
  e2eLog('   测试结果');
  e2eLog('================================================');
  e2eLog(`  通过: ${passCount}`);
  e2eLog(`  失败: ${failCount}`);
  e2eLog('================================================');
  
  if (failCount > 0) {
    e2eLog('\n[RESULT] Phase 3.1 E2E 测试 失败');
    process.exit(1);
  } else {
    e2eLog('\n[RESULT] Phase 3.1 E2E 测试 通过');
    process.exit(0);
  }
}

main();

