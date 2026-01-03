/**
 * 真实客户数据迁移脚本
 * 从 donhauser 系统迁移客户和联系人数据到 ATLAS DocsOS
 */
import * as fs from 'fs';
import * as path from 'path';

// 数据文件路径
const customerDataPath = '/tmp/customer_data.json';
const contactsDataPath = '/tmp/contacts.json';
const repositoryPath = path.join(__dirname, '../../repository');

// 客户类别映射
const categoryMap: Record<string, string> = {
  '1': '图书出版',
  '2': '教育出版',
  '3': '文化传媒',
  '4': '印刷发行',
  '5': '其他行业',
  '6': '政府机构',
};

// 价格列表映射
const pricelistMap: Record<string, string> = {
  '1': '标准价格',
  '2': '优惠价格',
  '3': '协议价格',
  '4': 'VIP价格',
  '5': '特殊价格',
  '6': '合作价格',
};

// 生成拼音缩写 ID (简化版)
function generateId(name: string): string {
  // 移除特殊字符，保留中文和字母数字
  const clean = name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
  // 截取前10个字符
  const short = clean.slice(0, 10);
  // 生成简单ID
  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

interface CustomerData {
  id: string;
  customer_name: string;
  customer_address?: string;
  invoice_info?: string;
  invoice_type?: string;
  category_id?: string;
  pricelist_id?: string;
  customer_rating?: string;
  blacklist?: string;
  created_at?: string;
}

interface ContactData {
  id: string;
  contact_name: string;
  contact_email?: string;
  contact_phone?: string;
  customer_id?: string;
  contact_position?: string;
  shipping_method?: string;
  blacklist?: string;
  notes?: string;
  created_at?: string;
}

// 用于处理重名的计数器
const nameCounter = new Map<string, number>();

function getUniqueFileName(name: string): string {
  const count = nameCounter.get(name) || 0;
  nameCounter.set(name, count + 1);
  if (count === 0) {
    return name;
  }
  return `${name}-${count + 1}`;
}

// ID 计数器（用于生成唯一英文 ID）
const idCounter = new Map<string, number>();

function getUniqueId(baseName: string): string {
  // 将中文名转为拼音首字母缩写或直接用数字ID
  const count = idCounter.get(baseName) || 0;
  idCounter.set(baseName, count + 1);
  if (count === 0) {
    return baseName;
  }
  return `${baseName}-${count + 1}`;
}

// 读取JSON数据
function loadData<T>(filePath: string): T[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(content);
  
  // 处理 PHPMyAdmin 导出格式
  if (Array.isArray(parsed) && parsed[0]?.type === 'header') {
    // 找到 data 数组
    for (const item of parsed) {
      if (item.type === 'table' && item.data) {
        return item.data;
      }
    }
    return [];
  }
  
  return parsed;
}

// 生成客户文档块
function generateClientBlock(customer: CustomerData): string {
  const id = `client-${customer.id}`;
  const category = categoryMap[customer.category_id || '1'] || '图书出版';
  const rating = parseInt(customer.customer_rating || '3');
  const address = customer.customer_address?.replace(/[\r\n]+/g, ' ').trim() || '';
  const invoiceType = customer.invoice_type === '电子专票' ? '增值税专用发票' : '增值税普通发票';
  
  // 使用正确的 heading + anchor 格式，这样后端 parser 才能识别
  return `
---

### ${customer.customer_name} {#${id}}

\`\`\`yaml
type: client
id: ${id}
status: active
title: ${customer.customer_name}
category: ${category}
rating: ${rating}
address: ${address || customer.customer_name}
invoiceType: ${invoiceType}
\`\`\`
`;
}

// 生成联系人 Principal 文档
function generatePrincipalDoc(contact: ContactData, customer?: CustomerData, fileName?: string, anchorId?: string): string {
  // anchorId 是英文格式的 ID（如 u-contact-1），用于 anchor
  // fileName 是中文姓名，用于文件名和显示
  const id = anchorId || `u-contact-${contact.id}`;
  const displayName = contact.contact_name;
  const phone = contact.contact_phone?.replace(/\.0$/, '') || '';
  const email = contact.contact_email || `${contact.contact_name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`;
  
  return `---
version: "1.0"
document_type: facts
created: 2025-01-01T00:00:00.000Z
author: system
atlas:
  function: principal
  capabilities:
    - auth.login
    - auth.session
  navigation:
    visible: false
---

# ${displayName} {#${id}}

\`\`\`yaml
type: principal
id: ${id}
display_name: ${displayName}
status: active
identity:
  emails:
    - ${email}
  phones:
    - "${phone}"
  avatar:
    token: avatar.default
auth:
  password_hash: $2a$10$rQnKz5zH5V5b5Q5Q5Q5eCvJsVEXN4QW1bnHdL6bY3qM5LJPbK/a
profiles:
  - ref: 联系人/profiles/real-client-contacts.md#p-${id}
$display:
  color:
    token: color.brand.primary
  icon:
    token: icon.general.user
\`\`\`

${displayName}${customer ? `是${customer.customer_name}的联系人。` : '是客户联系人。'}
${contact.notes && contact.notes !== 'NULL' ? `\n> ${contact.notes.replace(/[\r\n]+/g, ' ')}` : ''}
`;
}

// 生成联系人 Profile 块
function generateProfileBlock(contact: ContactData, customer?: CustomerData, fileName?: string, anchorId?: string): string {
  // anchorId 是英文格式的 ID（如 u-contact-1）
  const principalId = anchorId || `u-contact-${contact.id}`;
  const profileId = `p-${principalId}`;
  const clientId = customer ? `client-${customer.id}` : 'client-unknown';
  const position = contact.contact_position !== '未知' ? contact.contact_position : '联系人';
  const address = contact.shipping_method && contact.shipping_method !== 'Unknown Address' 
    ? contact.shipping_method 
    : '';
  
  return `
---

## ${contact.contact_name} - ${customer?.customer_name || '未知客户'}联系人 {#${profileId}}

\`\`\`yaml
type: profile
profile_type: client_contact
id: ${profileId}
principal_ref: { ref: "联系人/principals/${fileName}.md#${principalId}" }
status: active

client_ref: { ref: "客户管理.md#${clientId}" }
role_title: ${position || '联系人'}
department: 业务部
relationship_strength: 3

notes: |
  ${address || '无备注'}
  ${contact.notes && contact.notes !== 'NULL' ? contact.notes.replace(/[\r\n]+/g, '\n  ') : ''}

tags:
  - 客户联系人

$display:
  color: { token: color.brand.secondary }
  icon: { token: icon.general.user }
\`\`\`

${contact.contact_name}是${customer?.customer_name || '客户'}的联系人。
`;
}

async function main() {
  console.log('🚀 开始数据迁移...\n');
  
  // 1. 加载客户数据
  console.log('📦 加载客户数据...');
  const customers: CustomerData[] = loadData<CustomerData>(customerDataPath);
  console.log(`   找到 ${customers.length} 个客户\n`);
  
  // 2. 加载联系人数据
  console.log('📦 加载联系人数据...');
  let contacts: ContactData[] = [];
  try {
    contacts = loadData<ContactData>(contactsDataPath);
    console.log(`   找到 ${contacts.length} 个联系人\n`);
  } catch (e) {
    console.log('   联系人数据加载失败，跳过\n');
  }
  
  // 创建客户ID到客户的映射
  const customerMap = new Map<string, CustomerData>();
  customers.forEach(c => customerMap.set(c.id, c));
  
  // 3. 按类别分组客户
  const customersByCategory = new Map<string, CustomerData[]>();
  customers.forEach(customer => {
    const category = categoryMap[customer.category_id || '1'] || '其他';
    if (!customersByCategory.has(category)) {
      customersByCategory.set(category, []);
    }
    customersByCategory.get(category)!.push(customer);
  });
  
  // 4. 生成客户管理文档
  console.log('📝 生成客户管理文档...');
  let clientDoc = `---
version: "1.0"
document_type: facts
created: 2025-01-01T00:00:00.000Z
author: system
atlas:
  function: entity_list
  entity_type: client
  capabilities:
    - nav.sidebar
  navigation:
    visible: true
    icon: building
    label: 客户管理
    order: 20
updated: "${new Date().toISOString()}"
---

# 客户管理 {#client-management}

\`\`\`yaml
type: directory_index
id: client-management
status: active
title: 客户管理
\`\`\`

> 本文档管理所有客户信息，数据来源于 donhauser 系统。
> 共计 **${customers.length}** 个客户，分为 **${customersByCategory.size}** 个类别。

`;

  // 按类别添加客户
  for (const [category, categoryCustomers] of customersByCategory) {
    clientDoc += `\n## ${category}\n`;
    for (const customer of categoryCustomers) {
      clientDoc += generateClientBlock(customer);
    }
  }
  
  fs.writeFileSync(path.join(repositoryPath, '客户管理.md'), clientDoc);
  console.log(`   ✅ 客户管理文档已生成\n`);
  
  // 5. 生成联系人 Principal 文档
  if (contacts.length > 0) {
    console.log('📝 生成联系人文档...');
    
    const principalsDir = path.join(repositoryPath, '联系人/principals');
    if (!fs.existsSync(principalsDir)) {
      fs.mkdirSync(principalsDir, { recursive: true });
    }
    
    // 清理旧的 u-contact-* 文件
    const existingFiles = fs.readdirSync(principalsDir);
    for (const file of existingFiles) {
      if (file.startsWith('u-contact-')) {
        fs.unlinkSync(path.join(principalsDir, file));
      }
    }
    
    // 重置姓名计数器
    nameCounter.clear();
    
    // 先为所有联系人生成唯一文件名和 ID
    const contactFileNames = new Map<string, string>();  // contact.id -> 中文文件名
    const contactAnchorIds = new Map<string, string>();  // contact.id -> 英文 anchor ID
    
    for (const contact of contacts) {
      const fileName = getUniqueFileName(contact.contact_name);
      contactFileNames.set(contact.id, fileName);
      // 英文格式的 anchor ID
      contactAnchorIds.set(contact.id, `u-contact-${contact.id}`);
    }
    
    // 为每个联系人生成 principal 文档（使用姓名作为文件名，英文 ID 作为 anchor）
    for (const contact of contacts) {
      const customer = customerMap.get(contact.customer_id || '');
      const fileName = contactFileNames.get(contact.id)!;
      const anchorId = contactAnchorIds.get(contact.id)!;
      const principalDoc = generatePrincipalDoc(contact, customer, fileName, anchorId);
      fs.writeFileSync(path.join(principalsDir, `${fileName}.md`), principalDoc);
    }
    console.log(`   ✅ 已生成 ${contacts.length} 个联系人 principal 文档\n`);
    
    // 6. 生成联系人 Profile 文档
    console.log('📝 生成联系人 Profile 文档...');
    
    const profilesDir = path.join(repositoryPath, '联系人/profiles');
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }
    
    let profileDoc = `---
version: "1.0"
document_type: facts
created: 2025-01-01
author: system
---

# 真实客户联系人档案

本文档存储所有从 donhauser 系统迁移的客户联系人的 Client Contact Profile（客户联系人档案）信息。

共计 **${contacts.length}** 个联系人。
`;
    
    for (const contact of contacts) {
      const customer = customerMap.get(contact.customer_id || '');
      const fileName = contactFileNames.get(contact.id)!;
      const anchorId = contactAnchorIds.get(contact.id)!;
      profileDoc += generateProfileBlock(contact, customer, fileName, anchorId);
    }
    
    fs.writeFileSync(path.join(profilesDir, 'real-client-contacts.md'), profileDoc);
    console.log(`   ✅ 联系人 Profile 文档已生成\n`);
  }
  
  console.log('🎉 数据迁移完成！');
  console.log(`   - 客户数量: ${customers.length}`);
  console.log(`   - 联系人数量: ${contacts.length}`);
  console.log(`   - 输出目录: ${repositoryPath}`);
}

main().catch(console.error);

