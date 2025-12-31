/**
 * Phase 1 E2E 测试脚本
 * 
 * 测试内容：
 * 1. Workspace 索引生成与查询
 * 2. 多文档导航
 * 3. Query 搜索
 * 4. 权限验证（admin/staff/client）
 * 5. 完整流程：登录 → 搜索 → 打开文档 → 编辑 → Proposal → 执行
 * 
 * 运行方式: npx tsx scripts/phase1-e2e.ts
 */

import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { config, ensureDirectories } from '../src/config.js';
import { rebuildWorkspaceIndex, getWorkspaceIndex, getWorkspaceTree } from '../src/services/workspace-service.js';
import { executeQuery, rebuildBlocksIndex } from '../src/services/query-service.js';
import { getUserByUsername, verifyPassword, checkPathPermission, toPublicUser } from '../src/services/auth-service.js';
import { parseADL, findBlockByAnchor } from '../src/adl/parser.js';
import { createProposal, getProposal, deleteProposal } from '../src/adl/proposal-store.js';
import { validateProposal } from '../src/adl/validator.js';
import { executeProposal } from '../src/adl/executor.js';
import simpleGit from 'simple-git';

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

async function cleanup() {
  // 清理测试产生的 proposals
  // 这里不做实际清理，因为 proposal 可能在测试中有用
}

// ============================================================
// 测试用例
// ============================================================

async function testWorkspaceIndex() {
  console.log('\n=== 测试 Workspace 索引 ===');
  
  // 重建索引
  const index = await rebuildWorkspaceIndex();
  
  assert(
    index.documents.length > 0,
    `索引包含 ${index.documents.length} 个文档`
  );
  
  assert(
    index.stats.total_blocks > 0,
    `共 ${index.stats.total_blocks} 个 blocks`
  );
  
  assert(
    index.stats.total_anchors > 0,
    `共 ${index.stats.total_anchors} 个 anchors`
  );
  
  // 验证目录结构
  const tree = await getWorkspaceTree();
  assert(
    tree.length > 0,
    `目录树包含 ${tree.length} 个根节点`
  );
  
  // 验证索引文件存在
  assert(
    existsSync(config.workspaceIndexPath),
    `索引文件已生成: ${config.workspaceIndexPath}`
  );
}

async function testBlocksIndex() {
  console.log('\n=== 测试 Blocks 索引 ===');
  
  // 重建索引
  const index = await rebuildBlocksIndex();
  
  assert(
    index.blocks.length > 0,
    `Blocks 索引包含 ${index.blocks.length} 个 blocks`
  );
  
  // 验证索引文件存在
  assert(
    existsSync(config.blocksIndexPath),
    `Blocks 索引文件已生成: ${config.blocksIndexPath}`
  );
}

async function testQuery() {
  console.log('\n=== 测试 Query 功能 ===');
  
  // 按 type 查询
  const serviceResults = await executeQuery({ type: 'service' });
  assert(
    serviceResults.count > 0,
    `按 type=service 查询返回 ${serviceResults.count} 个结果`
  );
  
  // 按 type 查询项目
  const projectResults = await executeQuery({ type: 'project' });
  assert(
    projectResults.count > 0,
    `按 type=project 查询返回 ${projectResults.count} 个结果`
  );
  
  // 按 type 查询联系人
  const contactResults = await executeQuery({ type: 'contact' });
  assert(
    contactResults.count > 0,
    `按 type=contact 查询返回 ${contactResults.count} 个结果`
  );
  
  // 标题搜索
  const titleSearchResults = await executeQuery({
    filter: { title: { $contains: '品牌' } }
  });
  assert(
    titleSearchResults.count > 0,
    `标题搜索 "品牌" 返回 ${titleSearchResults.count} 个结果`
  );
  
  // Select 投影
  const selectResults = await executeQuery({
    type: 'service',
    select: ['id', 'title'],
    limit: 5,
  });
  assert(
    selectResults.results.length <= 5,
    `Select + Limit 限制结果数量为 ${selectResults.results.length}`
  );
  
  // 检查查询时间
  assert(
    selectResults.query_time_ms < 1000,
    `查询时间 ${selectResults.query_time_ms}ms < 1000ms`
  );
}

async function testAuthentication() {
  console.log('\n=== 测试认证功能 ===');
  
  // 测试 admin 用户
  const admin = getUserByUsername('admin');
  assert(admin !== null, 'Admin 用户存在');
  assert(
    admin !== null && verifyPassword(admin, 'admin123'),
    'Admin 密码验证成功'
  );
  
  // 测试 staff 用户
  const staff = getUserByUsername('designer');
  assert(staff !== null, 'Staff 用户存在');
  assert(
    staff !== null && verifyPassword(staff, 'staff123'),
    'Staff 密码验证成功'
  );
  
  // 测试 client 用户
  const client = getUserByUsername('client-zhang');
  assert(client !== null, 'Client 用户存在');
  assert(
    client !== null && verifyPassword(client, 'client123'),
    'Client 密码验证成功'
  );
}

async function testPermissions() {
  console.log('\n=== 测试权限功能 ===');
  
  const admin = getUserByUsername('admin');
  const client = getUserByUsername('client-zhang');
  
  if (!admin || !client) {
    e2eLog('error', '用户不存在，跳过权限测试');
    return;
  }
  
  const adminPublic = toPublicUser(admin);
  const clientPublic = toPublicUser(client);
  
  // Admin 可以访问所有路径
  assert(
    checkPathPermission(adminPublic, 'genesis/服务示例.md'),
    'Admin 可以访问 genesis/服务示例.md'
  );
  assert(
    checkPathPermission(adminPublic, 'projects/2025/P-001/项目主文档.md'),
    'Admin 可以访问任意项目'
  );
  
  // Client 只能访问授权路径
  assert(
    checkPathPermission(clientPublic, 'projects/2025/P-001/项目主文档.md'),
    'Client 可以访问授权项目 P-001'
  );
  assert(
    !checkPathPermission(clientPublic, 'projects/2025/P-002/项目主文档.md'),
    'Client 不能访问未授权项目 P-002'
  );
  assert(
    checkPathPermission(clientPublic, 'contacts/客户-张三.md'),
    'Client 可以访问自己的联系人文档'
  );
  assert(
    !checkPathPermission(clientPublic, 'contacts/客户-李四.md'),
    'Client 不能访问其他联系人文档'
  );
}

async function testProposalWorkflow() {
  console.log('\n=== 测试 Proposal 工作流 ===');
  
  const testDocPath = 'genesis/服务示例.md';
  const fullPath = join(config.repositoryRoot, testDocPath);
  
  if (!existsSync(fullPath)) {
    e2eLog('warn', `测试文档不存在: ${testDocPath}，跳过 Proposal 测试`);
    return;
  }
  
  // 1. 读取文档
  const content = readFileSync(fullPath, 'utf-8');
  const doc = parseADL(content, testDocPath);
  assert(
    doc.blocks.length > 0,
    `文档包含 ${doc.blocks.length} 个 blocks`
  );
  
  // 2. 创建 Proposal
  const proposal = createProposal({
    proposed_by: 'e2e-test',
    proposed_at: new Date().toISOString(),
    target_file: testDocPath,
    ops: [
      {
        op: 'update_yaml',
        anchor: doc.blocks[0].anchor,
        path: 'status',
        value: 'active',
        old_value: doc.blocks[0].machine?.status,
      },
    ],
  });
  assert(
    proposal.id.length > 0,
    `Proposal 创建成功: ${proposal.id}`
  );
  
  // 3. 验证 Proposal
  const validation = validateProposal(proposal, config.repositoryRoot);
  assert(
    validation.valid,
    `Proposal 验证通过${validation.errors.length > 0 ? ': ' + JSON.stringify(validation.errors) : ''}`
  );
  
  // 4. 执行 Proposal
  const result = await executeProposal(proposal, config.repositoryRoot);
  assert(
    result.success,
    `Proposal 执行成功${result.commit_hash ? ': ' + result.commit_hash : ''}`
  );
  
  // 5. 验证 Git commit
  if (result.success) {
    const git = simpleGit(config.repositoryRoot);
    const gitLog = await git.log({ maxCount: 1 });
    const lastCommit = gitLog.latest;
    
    assert(
      lastCommit !== null && lastCommit.message.includes(proposal.id),
      `Git commit 包含 Proposal ID: ${lastCommit?.message || 'N/A'}`
    );
  }
  
  // 6. 清理
  deleteProposal(proposal.id);
}

// ============================================================
// 主测试流程
// ============================================================

async function runPhase1E2E() {
  console.log('====================================');
  console.log('  ATLAS Phase 1 E2E 测试');
  console.log('====================================');
  console.log(`\n项目根目录: ${config.projectRoot}`);
  console.log(`仓库根目录: ${config.repositoryRoot}`);
  
  // 确保目录存在
  ensureDirectories();
  
  try {
    await testWorkspaceIndex();
    await testBlocksIndex();
    await testQuery();
    await testAuthentication();
    await testPermissions();
    await testProposalWorkflow();
  } catch (error) {
    e2eLog('error', `测试过程中发生错误: ${error}`);
    testsFailed++;
  }
  
  // 清理
  await cleanup();
  
  // 输出结果
  console.log('\n====================================');
  console.log('  测试结果');
  console.log('====================================');
  console.log(`  通过: ${testsPassed}`);
  console.log(`  失败: ${testsFailed}`);
  console.log('====================================\n');
  
  if (testsFailed > 0) {
    process.exit(1);
  }
}

// 运行测试
runPhase1E2E().catch(error => {
  e2eLog('error', `Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

