/**
 * 重建认证索引脚本
 */

import { rebuildAuthUsersIndex } from '../src/services/auth-credential-indexer.js';

async function main() {
  console.log('🔄 开始重建认证索引...\n');
  
  const result = await rebuildAuthUsersIndex();
  
  console.log('✅ 索引重建完成！\n');
  console.log('📊 统计信息:');
  console.log(`  - 扫描文档数: ${result.stats.scannedDocuments}`);
  console.log(`  - 总用户数: ${result.stats.totalUsers}`);
  console.log(`  - 重建耗时: ${result.stats.rebuildTime}ms\n`);
  
  console.log('👥 用户列表:');
  for (const [id, user] of Object.entries(result.index.users)) {
    console.log(`  - ${user.username} (${id})`);
    console.log(`    角色: ${user.role_name}`);
    console.log(`    状态: ${user.status}`);
    console.log(`    邮箱: ${user.email || '无'}`);
    console.log();
  }
}

main().catch(console.error);

