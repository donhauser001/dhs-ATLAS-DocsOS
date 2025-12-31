/**
 * 测试数据生成脚本
 * 
 * Phase 1: 生成测试用的项目和联系人文档
 * 
 * 运行方式: npx ts-node scripts/generate-test-data.ts
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../src/config.js';

// ============================================================
// 测试数据模板
// ============================================================

const PROJECT_TEMPLATE = (id: string, title: string, clientRef: string, services: string[]) => `---
document_type: project
version: "1.0"
---

# ${title} {#proj-${id}}

\`\`\`yaml
type: project
id: "${id}"
status: active
title: "${title}"
client: "${clientRef}"
budget: ${Math.floor(Math.random() * 500000) + 100000}
start_date: "2025-01-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}"
services:
${services.map(s => `  - "${s}"`).join('\n')}
\`\`\`

项目概述说明文本。

## 里程碑一 {#milestone-${id}-1}

\`\`\`yaml
type: milestone
id: "${id}-M1"
status: active
title: "项目启动与需求确认"
due_date: "2025-02-15"
\`\`\`

完成项目启动会议和需求文档确认。

## 里程碑二 {#milestone-${id}-2}

\`\`\`yaml
type: milestone
id: "${id}-M2"
status: draft
title: "设计方案交付"
due_date: "2025-03-15"
\`\`\`

完成设计方案并提交客户审核。

## 里程碑三 {#milestone-${id}-3}

\`\`\`yaml
type: milestone
id: "${id}-M3"
status: draft
title: "项目验收"
due_date: "2025-04-30"
\`\`\`

完成最终交付和项目验收。
`;

const CONTACT_TEMPLATE = (id: string, name: string, company: string, role: string) => `---
document_type: contact
version: "1.0"
---

# ${name} {#contact-${id}}

\`\`\`yaml
type: contact
id: "${id}"
status: active
title: "${name}"
company: "${company}"
role: "${role}"
phone: "138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}"
email: "${id}@example.com"
\`\`\`

联系人备注信息。
`;

// ============================================================
// 生成逻辑
// ============================================================

const PROJECTS = [
  { id: 'P-001', title: '星云科技品牌升级项目', client: 'zhang-san', services: ['svc-S-001', 'svc-S-002'] },
  { id: 'P-002', title: '蓝海集团官网重构', client: 'li-si', services: ['svc-S-002', 'svc-S-003'] },
  { id: 'P-003', title: '云峰数字化转型咨询', client: 'wang-wu', services: ['svc-S-001'] },
];

const CONTACTS = [
  { id: 'zhang-san', name: '张三', company: '星云科技有限公司', role: '市场总监' },
  { id: 'li-si', name: '李四', company: '蓝海集团', role: '品牌经理' },
  { id: 'wang-wu', name: '王五', company: '云峰控股', role: 'CEO' },
  { id: 'zhao-liu', name: '赵六', company: '明日科技', role: '产品总监' },
  { id: 'chen-qi', name: '陈七', company: '华创投资', role: '投资经理' },
  { id: 'liu-ba', name: '刘八', company: '盛世传媒', role: '创意总监' },
  { id: 'sun-jiu', name: '孙九', company: '远航物流', role: '运营总监' },
  { id: 'zhou-shi', name: '周十', company: '金鼎地产', role: '营销总监' },
  { id: 'wu-yi', name: '吴一', company: '天宇教育', role: '品牌经理' },
  { id: 'zheng-er', name: '郑二', company: '海通商贸', role: '采购经理' },
];

function generateTestData() {
  console.log('Generating test data...\n');
  
  const repoRoot = config.repositoryRoot;
  
  // 创建项目目录和文档
  console.log('Creating project documents:');
  const projectsDir = join(repoRoot, 'projects', '2025');
  mkdirSync(projectsDir, { recursive: true });
  
  for (const project of PROJECTS) {
    const projectDir = join(projectsDir, project.id);
    mkdirSync(projectDir, { recursive: true });
    
    const content = PROJECT_TEMPLATE(project.id, project.title, `contact-${project.client}`, project.services);
    const filePath = join(projectDir, '项目主文档.md');
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  - ${filePath.replace(repoRoot, 'repository')}`);
  }
  
  // 创建联系人目录和文档
  console.log('\nCreating contact documents:');
  const contactsDir = join(repoRoot, 'contacts');
  mkdirSync(contactsDir, { recursive: true });
  
  for (const contact of CONTACTS) {
    const content = CONTACT_TEMPLATE(contact.id, contact.name, contact.company, contact.role);
    const filePath = join(contactsDir, `客户-${contact.name}.md`);
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  - ${filePath.replace(repoRoot, 'repository')}`);
  }
  
  console.log('\nTest data generation complete!');
  console.log(`\nTotal: ${PROJECTS.length} projects, ${CONTACTS.length} contacts`);
}

// 运行
generateTestData();

