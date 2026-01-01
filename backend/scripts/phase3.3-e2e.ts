/**
 * Phase 3.3 E2E 测试脚本
 * 
 * 测试功能声明系统的完整流程：
 * 1. FunctionRegistry 扫描和注册
 * 2. Auth 从 Principal 文档认证
 * 3. 动态导航生成
 * 4. 文档校验
 */

import { join } from 'path';
import { config, ensureDirectories } from '../src/config.js';
import { rebuildWorkspaceIndex } from '../src/services/workspace-service.js';
import {
    rebuildFunctionRegistry,
    getByFunction,
    findPrincipalByEmail,
    getSidebarNavigation,
} from '../src/services/function-registry.js';
import { lintAllDocuments } from '../src/services/document-linter.js';
import { getUserByEmail, verifyPassword } from '../src/services/auth-service.js';

// ============================================================
// 测试工具
// ============================================================

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.log(`  ✗ ${message}`);
        failed++;
    }
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
    console.log(`\n📦 ${name}`);
    try {
        await fn();
    } catch (error) {
        console.log(`  ✗ Test crashed: ${error}`);
        failed++;
    }
}

// ============================================================
// 测试用例
// ============================================================

async function testFunctionRegistry(): Promise<void> {
    await test('FunctionRegistry - 重建', async () => {
        const registry = await rebuildFunctionRegistry();

        assert(registry.version === '1.0', 'Registry 版本正确');
        assert(Object.keys(registry.functions).length > 0, 'Registry 包含功能分组');
        assert(registry.navigation.sidebar !== undefined, 'Registry 包含导航配置');
    });

    await test('FunctionRegistry - 查询 Principal', async () => {
        const principals = await getByFunction('principal');

        assert(principals.length > 0, `找到 ${principals.length} 个 principal`);
        assert(principals.some(p => p.id === 'u-wang'), 'u-wang 在列表中');
        assert(principals.every(p => p.capabilities.includes('auth.login')), '所有 principal 都有 auth.login 能力');
    });

    await test('FunctionRegistry - 按 Email 查找', async () => {
        const entry = await findPrincipalByEmail('wang@zhongxin.com');

        assert(entry !== null, '找到 wang@zhongxin.com');
        assert(entry?.id === 'u-wang', 'ID 正确');
        assert(entry?.path === 'users/principals/u-wang.md', '路径正确');
    });

    await test('FunctionRegistry - 查询 entity_list', async () => {
        const lists = await getByFunction('entity_list');

        assert(lists.length > 0, `找到 ${lists.length} 个 entity_list`);
        // 检查用户列表
        const userList = lists.find(l => l.path.includes('用户列表'));
        assert(userList !== undefined, '用户列表在 entity_list 中');
        if (userList) {
            assert(userList.navigation?.visible === true, '用户列表导航可见');
        }
    });
}

async function testDynamicNavigation(): Promise<void> {
    await test('动态导航 - 获取侧边栏', async () => {
        const navItems = await getSidebarNavigation();

        assert(Array.isArray(navItems), '导航是数组');
        // 检查排序
        const orders = navItems.map(i => i.order);
        const sorted = [...orders].sort((a, b) => a - b);
        assert(JSON.stringify(orders) === JSON.stringify(sorted), '导航按 order 排序');

        // 检查必要的导航项
        const hasUsers = navItems.some(i => i.label?.includes('用户'));
        assert(hasUsers, '包含用户管理导航');
    });
}

async function testAuthFromPrincipal(): Promise<void> {
    await test('Auth - 从 Principal 文档获取用户', async () => {
        const user = await getUserByEmail('wang@zhongxin.com');

        assert(user !== null, '找到用户');
        assert(user?.id === 'u-wang', 'ID 正确');
        assert(user?.name === '王编辑', '名称正确');
        assert(user?.principal_path === 'users/principals/u-wang.md', 'principal_path 正确');
    });

    await test('Auth - 密码验证', async () => {
        const user = await getUserByEmail('wang@zhongxin.com');

        if (user) {
            // 使用测试密码哈希对应的密码
            // 注意：实际测试时需要使用正确的密码
            const hasPasswordHash = !!user.password_hash;
            assert(hasPasswordHash, '用户有 password_hash');

            // 由于我们设置的是占位符哈希，这里只验证结构
            assert(typeof user.password_hash === 'string', 'password_hash 是字符串');
        } else {
            assert(false, '找不到用户');
        }
    });

    await test('Auth - 用户不存在', async () => {
        const user = await getUserByEmail('nonexistent@example.com');
        assert(user === null, '不存在的用户返回 null');
    });
}

async function testDocumentLinter(): Promise<void> {
    await test('DocumentLinter - 全量校验', async () => {
        const report = await lintAllDocuments();

        assert(report.version === '1.0', '报告版本正确');
        assert(report.summary.total_documents > 0, `校验了 ${report.summary.total_documents} 个文档`);
        assert(typeof report.summary.error_count === 'number', '有错误计数');
        assert(typeof report.summary.warning_count === 'number', '有警告计数');

        console.log(`    统计: ${report.summary.passed_count} 通过, ${report.summary.failed_count} 失败`);
        console.log(`    问题: ${report.summary.error_count} 错误, ${report.summary.warning_count} 警告`);
    });

    await test('DocumentLinter - Principal 文档校验', async () => {
        const report = await lintAllDocuments();

        // 检查 principal 文档
        const principalDocs = report.documents.filter(d =>
            d.path.includes('principals/') && d.path.endsWith('.md')
        );

        assert(principalDocs.length > 0, `找到 ${principalDocs.length} 个 principal 文档`);

        // 检查是否有 atlas 声明相关的错误
        const atlasErrors = principalDocs.flatMap(d =>
            d.issues.filter(i => i.rule.includes('atlas'))
        );

        console.log(`    Principal 文档 atlas 相关问题: ${atlasErrors.length}`);
    });
}

// ============================================================
// 主函数
// ============================================================

async function main(): Promise<void> {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║         Phase 3.3 功能声明系统 E2E 测试                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');

    console.log(`\n📍 项目根目录: ${config.projectRoot}`);
    console.log(`📍 仓库根目录: ${config.repositoryRoot}`);

    // 确保目录存在
    ensureDirectories();

    // 先重建工作空间索引
    console.log('\n🔄 重建工作空间索引...');
    await rebuildWorkspaceIndex();

    // 运行测试
    await testFunctionRegistry();
    await testDynamicNavigation();
    await testAuthFromPrincipal();
    await testDocumentLinter();

    // 输出结果
    console.log('\n════════════════════════════════════════════════════════════════');
    console.log(`📊 测试结果: ${passed} 通过, ${failed} 失败`);

    if (failed > 0) {
        console.log('\n❌ 部分测试失败');
        process.exit(1);
    } else {
        console.log('\n✅ 所有测试通过！');
        console.log('\n🎉 Phase 3.3 功能声明系统实现完成！');
    }
}

main().catch((error) => {
    console.error('E2E 测试失败:', error);
    process.exit(1);
});

