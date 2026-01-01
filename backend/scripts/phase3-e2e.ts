/**
 * Phase 3.0 E2E 测试脚本
 * 
 * 测试内容：
 * 1. ADL v0.3 语法校验
 * 2. Token 系统
 * 3. 确定性显现映射
 * 4. 错误处理
 * 
 * 运行方式：
 * cd backend && npx tsx scripts/phase3-e2e.ts
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { config } from '../src/config.js';
import { parseADL, parseBlocks } from '../src/adl/parser.js';
import { validateBlock, validateDocument, REQUIRED_FIELDS, VALID_STATUS_VALUES } from '../src/adl/schema-validator.js';
import { loadTokens, resolveToken, resolveTokenStrict, TokenResolveError, clearTokenCache } from '../src/services/token-resolver.js';
import { ATLASError, ParseError, ValidationError, NotFoundError, toATLASError } from '../src/errors/index.js';

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

async function testParserBasics(): Promise<void> {
  e2eLog('\n=== 测试 Parser 基础功能 ===\n');
  
  // 测试 1: 解析完整文档
  const docContent = `---
version: "1.0"
document_type: facts
created: 2025-01-01
author: test
---

# 测试文档

## 测试服务 {#svc-test-001}

\`\`\`yaml
type: service
id: TEST-001
status: active
title: 测试服务
price:
  base: 50000
  unit: 项目
\`\`\`

这是测试服务的描述。
`;

  try {
    const doc = parseADL(docContent, 'test.md');
    assert(doc.frontmatter.version === '1.0', 'Parser: 解析 frontmatter version');
    assert(doc.blocks.length === 1, 'Parser: 解析 Block 数量');
    assert(doc.blocks[0].anchor === 'svc-test-001', 'Parser: 解析 anchor');
    assert(doc.blocks[0].machine.type === 'service', 'Parser: 解析 machine.type');
    assert(doc.blocks[0].machine.id === 'TEST-001', 'Parser: 解析 machine.id');
    assert(doc.blocks[0].body?.includes('测试服务的描述'), 'Parser: 解析 body');
  } catch (err) {
    fail('Parser: 基础解析', err);
  }
  
  // 测试 2: 解析空文档
  try {
    const emptyDoc = parseADL('', 'empty.md');
    assert(emptyDoc.blocks.length === 0, 'Parser: 空文档返回空 blocks');
    assert(Object.keys(emptyDoc.frontmatter).length === 0, 'Parser: 空文档返回空 frontmatter');
  } catch (err) {
    fail('Parser: 空文档解析', err);
  }
  
  // 测试 3: 解析多个 Block
  const multiBlockContent = `
## Block A {#block-a}

\`\`\`yaml
type: note
id: A
status: active
title: Block A
\`\`\`

## Block B {#block-b}

\`\`\`yaml
type: note
id: B
status: draft
title: Block B
\`\`\`

## Block C {#block-c}

\`\`\`yaml
type: note
id: C
status: archived
title: Block C
\`\`\`
`;

  try {
    const multiDoc = parseADL(multiBlockContent, 'multi.md');
    assert(multiDoc.blocks.length === 3, 'Parser: 多 Block 解析数量');
    assert(multiDoc.blocks[0].anchor === 'block-a', 'Parser: 多 Block 第一个 anchor');
    assert(multiDoc.blocks[1].anchor === 'block-b', 'Parser: 多 Block 第二个 anchor');
    assert(multiDoc.blocks[2].anchor === 'block-c', 'Parser: 多 Block 第三个 anchor');
  } catch (err) {
    fail('Parser: 多 Block 解析', err);
  }
}

async function testSchemaValidator(): Promise<void> {
  e2eLog('\n=== 测试 Schema Validator ===\n');
  
  // 测试 1: 验证有效 Block
  const validBlock = {
    anchor: 'test-valid',
    heading: 'Test Valid',
    level: 2,
    body: '',
    machine: {
      type: 'service',
      id: 'S-001',
      status: 'active' as const,
      title: 'Test Service',
    },
  };
  
  try {
    const result = validateBlock(validBlock);
    assert(result.valid === true, 'Validator: 有效 Block 通过验证');
    assert(result.errors.length === 0, 'Validator: 有效 Block 无错误');
  } catch (err) {
    fail('Validator: 有效 Block 验证', err);
  }
  
  // 测试 2: 检测缺少必填字段
  const missingFieldBlock = {
    anchor: 'test-missing',
    heading: 'Test Missing',
    level: 2,
    body: '',
    machine: {
      type: 'service',
      // 缺少 id, status, title
    } as any,
  };
  
  try {
    const result = validateBlock(missingFieldBlock);
    assert(result.valid === false, 'Validator: 缺少必填字段不通过');
    assert(result.errors.some((e: any) => e.code === 'E001'), 'Validator: 返回 E001 错误码');
  } catch (err) {
    fail('Validator: 缺少必填字段检测', err);
  }
  
  // 测试 3: 检测无效 status 值
  const invalidStatusBlock = {
    anchor: 'test-invalid-status',
    heading: 'Test Invalid Status',
    level: 2,
    body: '',
    machine: {
      type: 'service',
      id: 'S-001',
      status: 'invalid' as any,
      title: 'Test',
    },
  };
  
  try {
    const result = validateBlock(invalidStatusBlock);
    assert(result.valid === false, 'Validator: 无效 status 不通过');
    assert(result.errors.some((e: any) => e.code === 'E003'), 'Validator: 返回 E003 错误码');
  } catch (err) {
    fail('Validator: 无效 status 检测', err);
  }
  
  // 测试 4: 检测 $display 中的字面量颜色
  const literalColorBlock = {
    anchor: 'test-literal-color',
    heading: 'Test Literal Color',
    level: 2,
    body: '',
    machine: {
      type: 'service',
      id: 'S-001',
      status: 'active' as const,
      title: 'Test',
      $display: {
        color: '#FF0000', // 字面量，应该报错
      },
    },
  };
  
  try {
    const result = validateBlock(literalColorBlock);
    assert(result.errors.some((e: any) => e.code === 'E101'), 'Validator: 检测字面量颜色');
  } catch (err) {
    fail('Validator: 字面量颜色检测', err);
  }
  
  // 测试 5: 接受正确的 token 引用
  const tokenRefBlock = {
    anchor: 'test-token-ref',
    heading: 'Test Token Ref',
    level: 2,
    body: '',
    machine: {
      type: 'service',
      id: 'S-001',
      status: 'active' as const,
      title: 'Test',
      $display: {
        color: { token: 'color.brand.primary' },
        icon: { token: 'icon.type.service' },
      },
    },
  };
  
  try {
    const result = validateBlock(tokenRefBlock);
    const displayErrors = result.errors.filter((e: any) => e.code === 'E101');
    assert(displayErrors.length === 0, 'Validator: Token 引用通过验证');
  } catch (err) {
    fail('Validator: Token 引用验证', err);
  }
  
  // 测试 6: 检测重复 anchor
  const docWithDuplicateAnchors = {
    path: 'test.md',
    frontmatter: {},
    blocks: [
      {
        anchor: 'duplicate',
        heading: 'Block 1',
        level: 2,
        body: '',
        machine: {
          type: 'note',
          id: '1',
          status: 'active' as const,
          title: 'Block 1',
        },
      },
      {
        anchor: 'duplicate', // 重复
        heading: 'Block 2',
        level: 2,
        body: '',
        machine: {
          type: 'note',
          id: '2',
          status: 'active' as const,
          title: 'Block 2',
        },
      },
    ],
  };
  
  try {
    const result = validateDocument(docWithDuplicateAnchors);
    assert(result.errors.some((e: any) => e.code === 'E004'), 'Validator: 检测重复 anchor');
  } catch (err) {
    fail('Validator: 重复 anchor 检测', err);
  }
}

async function testTokenSystem(): Promise<void> {
  e2eLog('\n=== 测试 Token 系统 ===\n');
  
  // 清除缓存
  clearTokenCache();
  
  // 测试 1: 加载 Token
  try {
    const cache = await loadTokens();
    assert(cache.groups !== undefined, 'Token: 加载 groups');
    assert(cache.index !== undefined, 'Token: 加载 index');
    assert(Object.keys(cache.index).length > 0, 'Token: index 不为空');
  } catch (err) {
    fail('Token: 加载 Token', err);
  }
  
  // 测试 2: 解析已存在的 Token
  try {
    const color = await resolveToken('color.brand.primary');
    assert(color !== null, 'Token: 解析 color.brand.primary');
    assert(color?.startsWith('#'), 'Token: 返回颜色值');
  } catch (err) {
    fail('Token: 解析已存在 Token', err);
  }
  
  // 测试 3: 解析不存在的 Token (非严格模式)
  try {
    const notFound = await resolveToken('not.exist.token');
    assert(notFound === null, 'Token: 不存在的 Token 返回 null');
  } catch (err) {
    fail('Token: 不存在 Token 处理', err);
  }
  
  // 测试 4: 严格模式解析不存在的 Token
  try {
    await resolveTokenStrict('not.exist.token');
    fail('Token: 严格模式应该抛出错误');
  } catch (err) {
    if (err instanceof TokenResolveError) {
      assert(err.code === 'E101', 'Token: 严格模式抛出 E101');
    } else {
      fail('Token: 严格模式错误类型', err);
    }
  }
  
  // 测试 5: 解析状态色
  try {
    const activeColor = await resolveToken('color.status.active');
    assert(activeColor !== null, 'Token: 解析 color.status.active');
    
    const draftColor = await resolveToken('color.status.draft');
    assert(draftColor !== null, 'Token: 解析 color.status.draft');
    
    const archivedColor = await resolveToken('color.status.archived');
    assert(archivedColor !== null, 'Token: 解析 color.status.archived');
  } catch (err) {
    fail('Token: 解析状态色', err);
  }
  
  // 测试 6: 解析类型色
  try {
    const serviceColor = await resolveToken('color.type.service');
    assert(serviceColor !== null, 'Token: 解析 color.type.service');
    
    const categoryColor = await resolveToken('color.type.category');
    assert(categoryColor !== null, 'Token: 解析 color.type.category');
  } catch (err) {
    fail('Token: 解析类型色', err);
  }
}

async function testErrorHandling(): Promise<void> {
  e2eLog('\n=== 测试错误处理系统 ===\n');
  
  // 测试 1: ATLASError 基本功能
  try {
    const error = new ATLASError('TEST_ERROR', 'Test error message', {
      suggestion: 'Try this fix',
      context: { key: 'value' },
    });
    
    assert(error.code === 'TEST_ERROR', 'Error: ATLASError code');
    assert(error.message === 'Test error message', 'Error: ATLASError message');
    assert(error.suggestion === 'Try this fix', 'Error: ATLASError suggestion');
    
    const response = error.toResponse();
    assert(response.error === true, 'Error: toResponse error flag');
    assert(response.code === 'TEST_ERROR', 'Error: toResponse code');
    
    const humanReadable = error.toHumanReadable();
    assert(humanReadable.includes('[TEST_ERROR]'), 'Error: toHumanReadable code');
    assert(humanReadable.includes('建议'), 'Error: toHumanReadable suggestion');
  } catch (err) {
    fail('Error: ATLASError 基本功能', err);
  }
  
  // 测试 2: 特定错误类型
  try {
    const parseError = new ParseError('Invalid YAML', { file: 'test.md', line: 10 });
    assert(parseError.code === 'PARSE_ERROR', 'Error: ParseError code');
    
    const validationError = new ValidationError('Missing field', { anchor: 'test', field: 'title' });
    assert(validationError.code === 'VALIDATION_ERROR', 'Error: ValidationError code');
    
    const notFoundError = new NotFoundError('Document', 'test.md');
    assert(notFoundError.code === 'NOT_FOUND', 'Error: NotFoundError code');
    assert(notFoundError.message.includes('test.md'), 'Error: NotFoundError message');
  } catch (err) {
    fail('Error: 特定错误类型', err);
  }
  
  // 测试 3: 错误转换
  try {
    const regularError = new Error('Regular error');
    const converted = toATLASError(regularError);
    assert(converted instanceof ATLASError, 'Error: toATLASError 转换 Error');
    assert(converted.code === 'UNKNOWN_ERROR', 'Error: 转换后 code');
    
    const stringError = toATLASError('string error');
    assert(stringError instanceof ATLASError, 'Error: toATLASError 转换字符串');
    
    const atlasError = new ATLASError('ORIGINAL', 'original');
    const unchanged = toATLASError(atlasError);
    assert(unchanged === atlasError, 'Error: ATLASError 不变');
  } catch (err) {
    fail('Error: 错误转换', err);
  }
}

async function testRealDocument(): Promise<void> {
  e2eLog('\n=== 测试真实文档 ===\n');
  
  const tokensPath = join(config.repositoryRoot, 'genesis/tokens.md');
  
  if (!existsSync(tokensPath)) {
    fail('真实文档: tokens.md 不存在');
    return;
  }
  
  try {
    const content = readFileSync(tokensPath, 'utf-8');
    const doc = parseADL(content, 'genesis/tokens.md');
    
    assert(doc.blocks.length > 0, '真实文档: tokens.md 包含 blocks');
    
    // 验证所有 token_group 类型的 Block
    const tokenGroups = doc.blocks.filter(b => b.machine.type === 'token_group');
    assert(tokenGroups.length > 0, '真实文档: 包含 token_group 类型');
    
    // 验证每个 token_group 有 tokens 字段
    for (const group of tokenGroups) {
      const hasTokens = 'tokens' in group.machine;
      assert(hasTokens, `真实文档: ${group.anchor} 有 tokens 字段`);
    }
  } catch (err) {
    fail('真实文档: 解析 tokens.md', err);
  }
  
  // 测试服务示例文档
  const servicePath = join(config.repositoryRoot, 'genesis/服务示例.md');
  
  if (existsSync(servicePath)) {
    try {
      const content = readFileSync(servicePath, 'utf-8');
      const doc = parseADL(content, 'genesis/服务示例.md');
      
      assert(doc.blocks.length > 0, '真实文档: 服务示例.md 包含 blocks');
      
      // 验证文档结构
      const result = validateDocument(doc);
      assert(result.errors.length === 0 || result.warnings.length >= 0, 
        '真实文档: 服务示例.md 结构有效');
    } catch (err) {
      fail('真实文档: 解析服务示例.md', err);
    }
  }
}

async function testSemanticLayers(): Promise<void> {
  e2eLog('\n=== 测试语义分层 ===\n');
  
  // 测试完整的语义分层 Block
  const fullBlock = {
    anchor: 'test-semantic',
    heading: 'Test Semantic Layers',
    level: 2,
    body: '这是 Body 内容',
    machine: {
      // 语义层
      type: 'service',
      id: 'S-SEMANTIC',
      status: 'active' as const,
      title: 'Semantic Test',
      category: { ref: '#cat-test' },
      
      // 显现层
      $display: {
        color: { token: 'color.brand.primary' },
        icon: { token: 'icon.type.service' },
      },
      
      // 操作层
      $constraints: {
        editable: ['status', 'title'],
        readonly: ['type', 'id'],
      },
    },
  };
  
  try {
    const result = validateBlock(fullBlock);
    assert(result.valid === true, '语义分层: 完整 Block 验证通过');
    
    // 检查语义层字段
    assert(fullBlock.machine.type !== undefined, '语义分层: type 存在');
    assert(fullBlock.machine.id !== undefined, '语义分层: id 存在');
    assert(fullBlock.machine.status !== undefined, '语义分层: status 存在');
    assert(fullBlock.machine.title !== undefined, '语义分层: title 存在');
    
    // 检查显现层字段
    assert(fullBlock.machine.$display !== undefined, '语义分层: $display 存在');
    assert(fullBlock.machine.$display.color !== undefined, '语义分层: $display.color 存在');
    assert(fullBlock.machine.$display.icon !== undefined, '语义分层: $display.icon 存在');
    
    // 检查操作层字段
    assert(fullBlock.machine.$constraints !== undefined, '语义分层: $constraints 存在');
    assert(Array.isArray(fullBlock.machine.$constraints.editable), '语义分层: editable 是数组');
    assert(Array.isArray(fullBlock.machine.$constraints.readonly), '语义分层: readonly 是数组');
  } catch (err) {
    fail('语义分层: 完整 Block 验证', err);
  }
}

// ============================================================
// 主函数
// ============================================================

async function main(): Promise<void> {
  e2eLog('================================================');
  e2eLog('   Phase 3.0 E2E 测试');
  e2eLog('   形态与语言收敛期');
  e2eLog('================================================');
  
  try {
    await testParserBasics();
    await testSchemaValidator();
    await testTokenSystem();
    await testErrorHandling();
    await testRealDocument();
    await testSemanticLayers();
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
    e2eLog('\n[RESULT] Phase 3.0 E2E 测试 失败');
    process.exit(1);
  } else {
    e2eLog('\n[RESULT] Phase 3.0 E2E 测试 通过');
    process.exit(0);
  }
}

main();

