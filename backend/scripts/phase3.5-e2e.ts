/**
 * Phase 3.5 E2E 测试脚本
 * 
 * 测试内容：
 * 1. 固定键验证
 * 2. ID 自动生成
 * 3. 自动补齐服务
 * 4. 显示配置
 * 5. 标签系统扩展
 * 
 * 运行方式：npx tsx scripts/phase3.5-e2e.ts
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const API_BASE = 'http://localhost:3000/api';

// ============================================================
// 测试辅助函数
// ============================================================

async function request(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<{ status: number; data: unknown }> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info'): void {
  const icons = {
    info: '📋',
    success: '✅',
    error: '❌',
    warn: '⚠️',
  };
  console.log(`${icons[type]} ${message}`);
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// ============================================================
// 测试用例
// ============================================================

async function testFixedKeysValidation(): Promise<void> {
  log('=== 测试固定键验证 ===', 'info');
  
  // 测试 1: 获取文档 lint 结果
  const { status, data } = await request('GET', '/lint?path=联系人/principals/王编辑.md');
  
  if (status === 200) {
    const result = data as {
      valid: boolean;
      errors: unknown[];
      warnings: unknown[];
    };
    
    log(`文档校验结果: ${result.valid ? '有效' : '无效'}`, result.valid ? 'success' : 'warn');
    log(`错误数: ${result.errors.length}`, result.errors.length > 0 ? 'warn' : 'success');
    log(`警告数: ${result.warnings.length}`, 'info');
    
    // 检查是否有固定键相关的警告
    const fixedKeyWarnings = (result.warnings as { rule: string }[]).filter(
      w => w.rule.startsWith('fixed_key_')
    );
    if (fixedKeyWarnings.length > 0) {
      log(`固定键警告: ${fixedKeyWarnings.length} 个`, 'warn');
      fixedKeyWarnings.forEach((w: { message?: string }) => {
        log(`  - ${w.message}`, 'info');
      });
    }
  } else {
    log(`获取 lint 结果失败: ${status}`, 'error');
  }
}

async function testIdGenerator(): Promise<void> {
  log('=== 测试 ID 生成器 ===', 'info');
  
  // 导入 ID 生成器
  const { titleToSlug, generateId } = await import('../src/services/id-generator.js');
  
  // 测试 1: 中文标题转 slug
  const chineseSlug = titleToSlug('张三');
  log(`中文 "张三" -> "${chineseSlug}"`, chineseSlug.includes('zhang') ? 'success' : 'error');
  assert(chineseSlug.includes('zhang') || chineseSlug.includes('san'), 'Chinese pinyin conversion failed');
  
  // 测试 2: 英文标题转 slug
  const englishSlug = titleToSlug('John Doe');
  log(`英文 "John Doe" -> "${englishSlug}"`, englishSlug === 'john-doe' ? 'success' : 'error');
  assert(englishSlug === 'john-doe', 'English slug conversion failed');
  
  // 测试 3: 混合标题转 slug
  const mixedSlug = titleToSlug('张三 (John)');
  log(`混合 "张三 (John)" -> "${mixedSlug}"`, 'info');
  
  // 测试 4: 完整 ID 生成
  const result = generateId('principal', '王编辑');
  log(`principal + "王编辑" -> "${result.id}"`, result.id.startsWith('u-') ? 'success' : 'error');
  assert(result.id.startsWith('u-'), 'ID prefix should be "u-" for principal');
  
  // 测试 5: 唯一性
  const existingIds = new Set([result.id]);
  const result2 = generateId('principal', '王编辑', { existingIds });
  log(`重复 ID -> "${result2.id}"`, result2.hasSuffix ? 'success' : 'error');
  assert(result2.hasSuffix, 'Duplicate ID should have suffix');
}

async function testAutoComplete(): Promise<void> {
  log('=== 测试自动补齐服务 ===', 'info');
  
  // 测试 1: 预览自动补齐
  const previewResult = await request('POST', '/documents/auto-complete', {
    path: '联系人/principals/王编辑.md',
  });
  
  if (previewResult.status === 200) {
    const data = previewResult.data as {
      missingFields: unknown[];
      totalChanges: number;
      categories: { metadata: number; structural: number; function: number };
    };
    
    log(`预览结果: ${data.totalChanges} 个待补齐字段`, 'success');
    log(`  - 元数据: ${data.categories.metadata}`, 'info');
    log(`  - 结构: ${data.categories.structural}`, 'info');
    log(`  - 功能: ${data.categories.function}`, 'info');
    
    if (data.missingFields.length > 0) {
      log('缺失字段:', 'info');
      (data.missingFields as { key: string; suggestedValue: unknown }[]).slice(0, 5).forEach(f => {
        log(`  - ${f.key}: ${f.suggestedValue}`, 'info');
      });
    }
  } else {
    log(`预览失败: ${previewResult.status}`, 'error');
  }
  
  // 测试 2: 获取缺失字段
  const missingResult = await request('GET', '/documents/联系人/principals/王编辑.md/missing-fields');
  
  if (missingResult.status === 200) {
    const data = missingResult.data as { total: number };
    log(`缺失字段数: ${data.total}`, 'success');
  } else {
    log(`获取缺失字段失败: ${missingResult.status}`, 'error');
  }
}

async function testDisplayConfig(): Promise<void> {
  log('=== 测试显示配置服务 ===', 'info');
  
  // 测试 1: 获取完整配置
  const configResult = await request('GET', '/display-config');
  
  if (configResult.status === 200) {
    const data = configResult.data as {
      version: string;
      zones: { hero: unknown; body: unknown; footer: unknown };
    };
    
    log(`配置版本: ${data.version}`, 'success');
    log(`Hero Zone 配置: ${JSON.stringify(data.zones.hero)}`, 'info');
    log(`Footer Zone 配置: ${JSON.stringify(data.zones.footer)}`, 'info');
  } else {
    log(`获取配置失败: ${configResult.status}`, 'error');
  }
  
  // 测试 2: 获取特定实体类型配置
  const clientResult = await request('GET', '/display-config/client');
  
  if (clientResult.status === 200) {
    log('获取 client 类型配置成功', 'success');
  } else {
    log(`获取 client 配置失败: ${clientResult.status}`, 'error');
  }
  
  // 测试 3: 字段分类
  const categorizeResult = await request('POST', '/display-config/categorize', {
    machineData: {
      type: 'principal',
      id: 'u-test',
      status: 'active',
      display_name: '测试用户',
      email: 'test@example.com',
    },
    frontmatter: {
      version: '1.0',
      created: '2026-01-01T00:00:00Z',
      author: 'admin',
    },
  });
  
  if (categorizeResult.status === 200) {
    const data = categorizeResult.data as {
      heroFields: unknown[];
      bodyFields: unknown[];
      footerFields: unknown[];
    };
    
    log(`分类结果:`, 'success');
    log(`  - Hero 字段: ${data.heroFields.length}`, 'info');
    log(`  - Body 字段: ${data.bodyFields.length}`, 'info');
    log(`  - Footer 字段: ${data.footerFields.length}`, 'info');
  } else {
    log(`字段分类失败: ${categorizeResult.status}`, 'error');
  }
}

async function testLabelRegistry(): Promise<void> {
  log('=== 测试标签注册表 ===', 'info');
  
  // 测试 1: 获取标签注册表
  const registryResult = await request('GET', '/labels');
  
  if (registryResult.status === 200) {
    const data = registryResult.data as {
      version: string;
      labels: Record<string, unknown>;
      aliasIndex: Record<string, string>;
    };
    
    log(`标签注册表版本: ${data.version}`, 'success');
    log(`注册的标签数: ${Object.keys(data.labels).length}`, 'info');
    log(`别名索引数: ${Object.keys(data.aliasIndex).length}`, 'info');
    
    // 检查元数据标签
    const metadataLabels = ['版本', '创建时间', '更新时间', '作者'];
    for (const label of metadataLabels) {
      if (data.labels[label]) {
        log(`  ✓ 找到元数据标签: ${label}`, 'success');
      } else {
        log(`  ✗ 缺少元数据标签: ${label}`, 'warn');
      }
    }
  } else {
    log(`获取标签注册表失败: ${registryResult.status}`, 'error');
  }
  
  // 测试 2: 解析标签
  const resolveResult = await request('POST', '/labels/resolve', {
    fieldNames: ['status', 'created', 'author', 'atlas.function'],
  });
  
  if (resolveResult.status === 200) {
    const data = resolveResult.data as Record<string, { label: string; icon?: string }>;
    
    log('标签解析结果:', 'success');
    for (const [key, value] of Object.entries(data)) {
      log(`  ${key} -> ${value.label} (${value.icon || 'no icon'})`, 'info');
    }
  } else {
    log(`标签解析失败: ${resolveResult.status}`, 'error');
  }
}

// ============================================================
// 主函数
// ============================================================

async function main(): Promise<void> {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     Phase 3.5 固定键系统 + 智能编辑器 E2E 测试     ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('\n');
  
  try {
    // 检查服务器是否运行
    const healthResult = await request('GET', '/../health');
    if (healthResult.status !== 200) {
      log('后端服务器未运行，请先启动 npm run dev', 'error');
      process.exit(1);
    }
    log('后端服务器已连接', 'success');
    
    console.log('\n');
    
    // 运行测试
    await testIdGenerator();
    console.log('\n');
    
    await testFixedKeysValidation();
    console.log('\n');
    
    await testAutoComplete();
    console.log('\n');
    
    await testDisplayConfig();
    console.log('\n');
    
    await testLabelRegistry();
    console.log('\n');
    
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║              Phase 3.5 E2E 测试完成                ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log('\n');
    
  } catch (error) {
    log(`测试失败: ${error}`, 'error');
    process.exit(1);
  }
}

main();

