#!/usr/bin/env npx tsx
/**
 * Phase 0 E2E 测试脚本
 * 
 * 验证完整闭环：
 * 1. 读取示例文档
 * 2. 创建 Proposal
 * 3. Validate
 * 4. Execute
 * 5. 检查 Git log
 * 
 * 使用方法：
 *   cd backend
 *   npx tsx scripts/phase0-e2e.ts
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import simpleGit from 'simple-git';
import { parseADL, findBlockByAnchor } from '../src/adl/parser.js';
import { validateProposal } from '../src/adl/validator.js';
import { executeProposal } from '../src/adl/executor.js';
import { createProposal, getProposal, listProposals } from '../src/adl/proposal-store.js';
import { config, ensureDirectories, validateConfig } from '../src/config.js';
import type { Proposal } from '../src/adl/types.js';

// ANSI 颜色
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function logMessage(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, message: string): void {
  console.log(`\n${colors.cyan}[Step ${step}]${colors.reset} ${colors.bold}${message}${colors.reset}`);
}

function logSuccess(message: string): void {
  console.log(`  ${colors.green}✓${colors.reset} ${message}`);
}

function logError(message: string): void {
  console.log(`  ${colors.red}✗${colors.reset} ${message}`);
}

async function runE2ETest(): Promise<boolean> {
  console.log('\n' + '='.repeat(60));
  logMessage('Phase 0 E2E Test - ATLAS Runtime', 'bold');
  console.log('='.repeat(60));
  
  // 验证配置
  logStep(0, 'Validating configuration');
  const configResult = validateConfig();
  if (!configResult.valid) {
    logError('Configuration invalid:');
    configResult.errors.forEach(e => logError(`  ${e}`));
    return false;
  }
  logSuccess(`Repository root: ${config.repositoryRoot}`);
  
  // 确保目录存在
  ensureDirectories();
  logSuccess(`Proposals dir: ${config.proposalsDir}`);
  
  // Step 1: 读取示例文档
  logStep(1, 'Reading sample document');
  const docPath = 'genesis/服务示例.md';
  const fullPath = join(config.repositoryRoot, docPath);
  
  if (!existsSync(fullPath)) {
    logError(`Document not found: ${fullPath}`);
    return false;
  }
  
  const content = readFileSync(fullPath, 'utf-8');
  const doc = parseADL(content, docPath);
  
  logSuccess(`Document parsed: ${doc.path}`);
  logSuccess(`Blocks found: ${doc.blocks.length}`);
  
  // 找到测试目标 Block
  const testAnchor = 'cat-brand-design';
  const block = findBlockByAnchor(doc, testAnchor);
  
  if (!block) {
    logError(`Block not found: ${testAnchor}`);
    return false;
  }
  
  logSuccess(`Target block: ${testAnchor} (type: ${block.machine.type})`);
  
  // Step 2: 创建 Proposal
  logStep(2, 'Creating Proposal');
  
  // 切换 status: active <-> draft
  const currentStatus = block.machine.status;
  const newStatus = currentStatus === 'active' ? 'draft' : 'active';
  
  const proposal = createProposal({
    target_file: docPath,
    ops: [
      {
        op: 'update_yaml',
        anchor: testAnchor,
        path: 'status',
        value: newStatus,
        old_value: currentStatus,
      },
    ],
    author: 'e2e-test',
    message: `E2E Test: Toggle status ${currentStatus} -> ${newStatus}`,
  });
  
  logSuccess(`Proposal created: ${proposal.id}`);
  logSuccess(`Status change: ${currentStatus} -> ${newStatus}`);
  
  // 验证持久化
  const savedProposal = getProposal(proposal.id);
  if (!savedProposal) {
    logError('Proposal not persisted');
    return false;
  }
  logSuccess('Proposal persisted to file');
  
  // Step 3: Validate Proposal
  logStep(3, 'Validating Proposal');
  
  const validationResult = validateProposal(proposal);
  
  if (!validationResult.valid) {
    logError('Validation failed:');
    validationResult.errors.forEach(e => logError(`  ${e.message}`));
    return false;
  }
  
  logSuccess('Validation passed');
  
  // Step 4: Execute Proposal
  logStep(4, 'Executing Proposal');
  
  const executeResult = await executeProposal(proposal);
  
  if (!executeResult.success) {
    logError(`Execution failed: ${executeResult.error}`);
    return false;
  }
  
  logSuccess(`Execution successful`);
  logSuccess(`Commit hash: ${executeResult.commit_hash}`);
  
  // Step 5: 验证 Git log
  logStep(5, 'Verifying Git commit');
  
  const git = simpleGit(config.repositoryRoot);
  const gitLog = await git.log({ maxCount: 1 });
  
  if (!gitLog.latest) {
    logError('No commits found');
    return false;
  }
  
  const latestCommit = gitLog.latest;
  
  if (!latestCommit.message.includes(proposal.id)) {
    logError(`Commit message does not contain proposal ID`);
    logError(`Expected to contain: ${proposal.id}`);
    logError(`Actual: ${latestCommit.message}`);
    return false;
  }
  
  logSuccess(`Latest commit: ${latestCommit.hash.substring(0, 7)}`);
  logSuccess(`Commit message: ${latestCommit.message}`);
  
  // Step 6: 验证文档已更新
  logStep(6, 'Verifying document update');
  
  const updatedContent = readFileSync(fullPath, 'utf-8');
  const updatedDoc = parseADL(updatedContent, docPath);
  const updatedBlock = findBlockByAnchor(updatedDoc, testAnchor);
  
  if (!updatedBlock) {
    logError('Block not found after update');
    return false;
  }
  
  if (updatedBlock.machine.status !== newStatus) {
    logError(`Status not updated`);
    logError(`Expected: ${newStatus}`);
    logError(`Actual: ${updatedBlock.machine.status}`);
    return false;
  }
  
  logSuccess(`Document updated: status = ${updatedBlock.machine.status}`);
  
  // 总结
  console.log('\n' + '='.repeat(60));
  logMessage('E2E Test Result: ALL PASSED', 'green');
  console.log('='.repeat(60));
  
  console.log(`
${colors.cyan}Summary:${colors.reset}
  Document: ${docPath}
  Target Block: ${testAnchor}
  Operation: status ${currentStatus} -> ${newStatus}
  Proposal ID: ${proposal.id}
  Commit: ${executeResult.commit_hash?.substring(0, 7)}
  
${colors.green}The Phase 0 closed loop is working correctly!${colors.reset}
`);
  
  return true;
}

// 主函数
async function main(): Promise<void> {
  try {
    const success = await runE2ETest();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n');
    logError(`Unexpected error: ${error}`);
    process.exit(1);
  }
}

main();

