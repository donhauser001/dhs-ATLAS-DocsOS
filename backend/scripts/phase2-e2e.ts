/**
 * Phase 2 + 2.1 E2E 测试脚本 - 安全场景测试
 * 
 * Phase 2 核心验收标准：
 * 1. 路径穿透防护（SafePath）
 * 2. 权限中间件全面接入
 * 3. Query 结果可见域过滤
 * 4. Executor 通过 Registry
 * 5. Index 去数据库化
 * 6. 缓存一致性校验
 * 
 * Phase 2.1 补丁：
 * 7. Query-service 全面通过 Registry
 * 8. SafePath realpath 前缀校验
 * 9. BlocksIndex 增量更新
 * 
 * 运行方式: npx tsx scripts/phase2-e2e.ts
 */

import { config, ensureDirectories } from '../src/config.js';
import { rebuildWorkspaceIndex, getWorkspaceIndex } from '../src/services/workspace-service.js';
import { executeQuery, rebuildBlocksIndex, updateBlocksIndexForDocument } from '../src/services/query-service.js';
import { getUserByUsername, toPublicUser, checkPathPermission } from '../src/services/auth-service.js';
import { createProposal, deleteProposal } from '../src/adl/proposal-store.js';
import { validateProposal } from '../src/adl/validator.js';
import { executeProposal } from '../src/adl/executor.js';
import simpleGit from 'simple-git';
import {
  resolveSafePath,
  getSafeAbsolutePath,
  documentExists,
  getDocument,
  resolveDocument,
  canAccessDocument,
} from '../src/services/workspace-registry.js';

// ============================================================
// 测试辅助函数
// ============================================================

let testsPassed = 0;
let testsFailed = 0;

function e2eLog(level: 'info' | 'success' | 'error' | 'warn', message: string) {
  const prefix = {
    info: '  ',
    success: '  [PASS]',
    error: '  [FAIL]',
    warn: '  [WARN]',
  };
  console.log(`${prefix[level]} ${message}`);
}

function assert(condition: boolean, message: string): void {
  if (condition) {
    e2eLog('success', message);
    testsPassed++;
  } else {
    e2eLog('error', message);
    testsFailed++;
  }
}

// ============================================================
// 测试用例：路径穿透防护
// ============================================================

async function testPathTraversalProtection() {
  console.log('\n=== 测试路径穿透防护 (P0-1) ===');
  
  // 测试正常路径
  const normalPath = resolveSafePath('genesis/服务示例.md');
  assert(normalPath.valid === true, '正常路径验证通过');
  assert(normalPath.relative === 'genesis/服务示例.md', '正常路径规范化正确');
  
  // 测试路径穿越攻击
  const traversalPath = resolveSafePath('../../../etc/passwd');
  assert(traversalPath.valid === false, '路径穿越 (../) 被拒绝');
  assert(traversalPath.error?.includes('traversal') === true, '错误信息包含 traversal');
  
  // 测试绝对路径
  const absolutePath = resolveSafePath('/etc/passwd');
  assert(absolutePath.valid === false, '绝对路径被拒绝');
  assert(absolutePath.error?.includes('Absolute') === true, '错误信息包含 Absolute');
  
  // 测试 URL 编码绕过
  const encodedPath = resolveSafePath('%2e%2e/etc/passwd');
  assert(encodedPath.valid === false, 'URL 编码路径穿越被拒绝');
  
  // 测试空路径
  const emptyPath = resolveSafePath('');
  assert(emptyPath.valid === false, '空路径被拒绝');
  
  // 测试 getSafeAbsolutePath
  const safePath = getSafeAbsolutePath('genesis/服务示例.md');
  assert(safePath !== null, 'getSafeAbsolutePath 返回有效路径');
  
  const unsafePath = getSafeAbsolutePath('../../../etc/passwd');
  assert(unsafePath === null, 'getSafeAbsolutePath 拒绝不安全路径');
  
  // 测试 documentExists 拒绝不安全路径
  const existsUnsafe = documentExists('../../../etc/passwd');
  assert(existsUnsafe === false, 'documentExists 拒绝不安全路径');
  
  // 测试 resolveDocument 拒绝不安全路径
  const handleUnsafe = resolveDocument('../../../etc/passwd');
  assert(handleUnsafe === null, 'resolveDocument 拒绝不安全路径');
  
  // 测试 getDocument 拒绝不安全路径
  const contentUnsafe = getDocument('../../../etc/passwd');
  assert(contentUnsafe === null, 'getDocument 拒绝不安全路径');
}

// ============================================================
// 测试用例：权限系统
// ============================================================

async function testPermissionSystem() {
  console.log('\n=== 测试权限系统 (P0-2) ===');
  
  const admin = getUserByUsername('admin');
  const staff = getUserByUsername('designer');  // 实际用户名
  const client = getUserByUsername('client-zhang');
  
  if (!admin || !staff || !client) {
    e2eLog('error', '测试用户不存在');
    testsFailed++;
    return;
  }
  
  const adminPublic = toPublicUser(admin);
  const staffPublic = toPublicUser(staff);
  const clientPublic = toPublicUser(client);
  
  // Admin 有全局权限
  assert(
    checkPathPermission(adminPublic, 'genesis/服务示例.md') === true,
    'Admin 可以访问任意文档'
  );
  assert(
    checkPathPermission(adminPublic, 'projects/2025/P-001/项目主文档.md') === true,
    'Admin 可以访问项目文档'
  );
  
  // Staff 有全局权限
  assert(
    checkPathPermission(staffPublic, 'genesis/服务示例.md') === true,
    'Staff 可以访问任意文档'
  );
  
  // Client 只能访问授权路径
  assert(
    checkPathPermission(clientPublic, 'genesis/服务示例.md') === false,
    'Client 不能访问未授权文档'
  );
  assert(
    checkPathPermission(clientPublic, 'projects/2025/P-001/项目主文档.md') === true,
    'Client 可以访问授权项目 P-001'
  );
  assert(
    checkPathPermission(clientPublic, 'projects/2025/P-002/项目主文档.md') === false,
    'Client 不能访问未授权项目 P-002'
  );
  
  // 测试 canAccessDocument（结合路径安全和权限）
  assert(
    canAccessDocument(adminPublic, 'genesis/服务示例.md') === true,
    'canAccessDocument: Admin 可以访问'
  );
  assert(
    canAccessDocument(clientPublic, 'genesis/服务示例.md') === false,
    'canAccessDocument: Client 不能访问未授权文档'
  );
  assert(
    canAccessDocument(null, 'genesis/服务示例.md') === false,
    'canAccessDocument: 未登录用户不能访问'
  );
  assert(
    canAccessDocument(adminPublic, '../../../etc/passwd') === false,
    'canAccessDocument: 不安全路径被拒绝'
  );
}

// ============================================================
// 测试用例：Query 可见域过滤
// ============================================================

async function testQueryVisibilityFilter() {
  console.log('\n=== 测试 Query 可见域过滤 (P1-1) ===');
  
  // 重建索引
  await rebuildWorkspaceIndex();
  await rebuildBlocksIndex();
  
  // 执行查询
  const result = await executeQuery({ type: 'service' });
  
  assert(
    result.results.length > 0,
    `Query 返回 ${result.results.length} 个结果`
  );
  
  // 验证结果结构（文档定位而非数据替身）
  const firstResult = result.results[0];
  assert(
    'anchor' in firstResult && 'document' in firstResult,
    'Query 结果包含 anchor 和 document（定位信息）'
  );
  assert(
    'heading' in firstResult && 'title' in firstResult && 'type' in firstResult,
    'Query 结果包含 heading、title、type（人类可读摘要）'
  );
  
  // 验证没有 machine 全量数据
  assert(
    !('machine' in firstResult),
    'Query 结果不包含 machine 全量数据'
  );
  
  // 验证 searchable 字段过滤
  const filteredResult = await executeQuery({ 
    type: 'service',
    filter: { status: 'active' }
  });
  
  assert(
    filteredResult.results.every(r => r.status === 'active'),
    'Query 过滤结果正确（status=active）'
  );
}

// ============================================================
// 测试用例：Executor 通过 Registry
// ============================================================

async function testExecutorThroughRegistry() {
  console.log('\n=== 测试 Executor 通过 Registry (P0-3) ===');
  
  const testDocPath = 'genesis/服务示例.md';
  
  // 确保文档存在
  const content = getDocument(testDocPath);
  if (!content || content.document.blocks.length === 0) {
    e2eLog('error', '测试文档不存在或为空');
    testsFailed++;
    return;
  }
  
  const firstBlock = content.document.blocks[0];
  const currentStatus = firstBlock.machine?.status || 'active';
  const newStatus = currentStatus === 'active' ? 'draft' : 'active';
  
  // 创建 Proposal
  const proposal = createProposal({
    proposed_by: 'e2e-test',
    proposed_at: new Date().toISOString(),
    target_file: testDocPath,
    reason: 'Phase 2 E2E 测试：验证 Executor 通过 Registry',
    ops: [
      {
        op: 'update_yaml',
        anchor: firstBlock.anchor,
        path: 'status',
        value: newStatus,
        old_value: currentStatus,
      },
    ],
  });
  
  assert(proposal.id.length > 0, `Proposal 创建成功: ${proposal.id}`);
  
  // 验证 Proposal（不再传 repositoryRoot）
  const validation = validateProposal(proposal);
  assert(validation.valid, 'Proposal 验证通过');
  
  // 执行 Proposal（不再传 repositoryRoot）
  const result = await executeProposal(proposal);
  assert(result.success, `Proposal 执行成功: ${result.commit_hash || 'no hash'}`);
  
  // 验证 Git commit
  if (result.success) {
    const git = simpleGit(config.repositoryRoot);
    const gitLog = await git.log({ maxCount: 1 });
    const lastCommit = gitLog.latest;
    
    assert(
      lastCommit !== null && lastCommit.message.includes(proposal.id),
      `Git commit 包含 Proposal ID`
    );
  }
  
  // 清理
  deleteProposal(proposal.id);
}

// ============================================================
// 测试用例：不安全 Proposal 被拒绝
// ============================================================

async function testUnsafeProposalRejected() {
  console.log('\n=== 测试不安全 Proposal 被拒绝 ===');
  
  // 创建一个指向不安全路径的 Proposal
  const unsafeProposal = createProposal({
    proposed_by: 'e2e-test',
    proposed_at: new Date().toISOString(),
    target_file: '../../../etc/passwd',
    reason: 'E2E 测试：不安全路径',
    ops: [
      {
        op: 'update_yaml',
        anchor: 'test',
        path: 'status',
        value: 'hacked',
        old_value: 'safe',
      },
    ],
  });
  
  // 验证应该失败
  const validation = validateProposal(unsafeProposal);
  assert(
    validation.valid === false,
    '不安全路径 Proposal 验证失败'
  );
  assert(
    validation.errors.some(e => e.rule === 'path_safe'),
    '验证错误包含 path_safe 规则'
  );
  
  // 清理
  deleteProposal(unsafeProposal.id);
  
  // 测试无 reason 的 Proposal
  const noReasonProposal = createProposal({
    proposed_by: 'e2e-test',
    proposed_at: new Date().toISOString(),
    target_file: 'genesis/服务示例.md',
    reason: '', // 空 reason
    ops: [],
  });
  
  const noReasonValidation = validateProposal(noReasonProposal);
  assert(
    noReasonValidation.valid === false,
    '无 reason 的 Proposal 验证失败'
  );
  assert(
    noReasonValidation.errors.some(e => e.rule === 'reason_required'),
    '验证错误包含 reason_required 规则'
  );
  
  deleteProposal(noReasonProposal.id);
}

// ============================================================
// 测试用例：Index 去数据库化
// ============================================================

async function testIndexMinimization() {
  console.log('\n=== 测试 Index 去数据库化 (P1-1) ===');
  
  // 重建索引
  const blocksIndex = await rebuildBlocksIndex();
  
  assert(blocksIndex.blocks.length > 0, `Blocks 索引包含 ${blocksIndex.blocks.length} 个条目`);
  
  // 检查索引条目结构
  const firstEntry = blocksIndex.blocks[0];
  
  // 应该有定位信息
  assert(
    'anchor' in firstEntry && 'document' in firstEntry,
    'Index 条目包含定位信息'
  );
  
  // 应该有人类可读摘要
  assert(
    'heading' in firstEntry && 'title' in firstEntry && 'type' in firstEntry,
    'Index 条目包含人类可读摘要'
  );
  
  // 应该有 searchable 白名单字段
  assert(
    'searchable' in firstEntry,
    'Index 条目包含 searchable 字段'
  );
  
  // 不应该有 machine 全量数据
  assert(
    !('machine' in firstEntry),
    'Index 条目不包含 machine 全量数据'
  );
}

// ============================================================
// 测试用例：增量索引更新 (Phase 2.1)
// ============================================================

async function testIncrementalIndexUpdate() {
  console.log('\n=== 测试增量索引更新 (Phase 2.1) ===');
  
  // 重建全量索引
  const fullIndex = await rebuildBlocksIndex();
  const initialCount = fullIndex.blocks.length;
  
  assert(initialCount > 0, `全量索引包含 ${initialCount} 个条目`);
  
  // 增量更新单个文档
  const testDocPath = 'genesis/服务示例.md';
  const startTime = Date.now();
  const incrementalIndex = await updateBlocksIndexForDocument(testDocPath);
  const incrementalTime = Date.now() - startTime;
  
  // 验证增量更新后条目数量正确
  assert(
    incrementalIndex.blocks.length >= initialCount - 10, // 允许一些偏差
    `增量更新后索引条目数量合理: ${incrementalIndex.blocks.length}`
  );
  
  // 验证增量更新比全量快（正常情况下应该快很多）
  assert(
    incrementalTime < 1000, // 增量更新应该在 1 秒内完成
    `增量更新耗时合理: ${incrementalTime}ms`
  );
  
  // 验证被更新文档的条目存在
  const updatedEntries = incrementalIndex.blocks.filter(b => b.document === testDocPath);
  assert(
    updatedEntries.length > 0,
    `增量更新后文档条目存在: ${updatedEntries.length} 个`
  );
}

// ============================================================
// 测试用例：缓存一致性
// ============================================================

async function testCacheConsistency() {
  console.log('\n=== 测试缓存一致性 (P1-3) ===');
  
  // 重建索引
  await rebuildWorkspaceIndex();
  
  // 获取索引
  const index = await getWorkspaceIndex();
  
  // 应该有 repo_head
  assert(
    index.repo_head !== undefined && index.repo_head.length > 0,
    `Index 包含 repo_head: ${index.repo_head?.slice(0, 8)}...`
  );
  
  // 刚重建的索引不应该是 stale
  assert(
    index.stale === false,
    'Index 不是 stale 状态'
  );
  
  // 验证 repo_head 与当前 Git HEAD 一致
  const git = simpleGit(config.repositoryRoot);
  const currentHead = await git.revparse(['HEAD']);
  
  assert(
    index.repo_head === currentHead.trim(),
    'Index repo_head 与当前 Git HEAD 一致'
  );
}

// ============================================================
// 主测试流程
// ============================================================

async function runPhase2E2E() {
  console.log('================================================');
  console.log('   ATLAS Phase 2 E2E 测试 - 安全场景');
  console.log('================================================');
  console.log(`Repository: ${config.repositoryRoot}`);
  
  ensureDirectories();
  
  try {
    await testPathTraversalProtection();
    await testPermissionSystem();
    await testQueryVisibilityFilter();
    await testExecutorThroughRegistry();
    await testUnsafeProposalRejected();
    await testIndexMinimization();
    await testIncrementalIndexUpdate(); // Phase 2.1
    await testCacheConsistency();
  } catch (error) {
    console.error('\n[FATAL] 测试过程中发生错误:', error);
    testsFailed++;
  }
  
  // 输出结果
  console.log('\n================================================');
  console.log('   测试结果');
  console.log('================================================');
  console.log(`  通过: ${testsPassed}`);
  console.log(`  失败: ${testsFailed}`);
  console.log('================================================');
  
  if (testsFailed > 0) {
    console.log('\n[RESULT] Phase 2 E2E 测试 失败');
    process.exit(1);
  } else {
    console.log('\n[RESULT] Phase 2 E2E 测试 通过');
    process.exit(0);
  }
}

runPhase2E2E();

