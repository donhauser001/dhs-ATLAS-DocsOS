/**
 * AI 人才市场 - 模拟数据
 * 
 * TODO: 后续替换为真实 API 数据
 */

import type { AITalent, HiredAI } from './types';

// ============================================================
// 已雇佣的 AI 员工
// ============================================================

export const HIRED_AI: HiredAI[] = [
    {
        id: 'chronicler-001',
        name: '传记官',
        avatar: '📜',
        title: '数字史官',
        description: '我是你的数字史官，负责将冰冷的操作记录翻译成有温度的故事。',
        category: 'executive',
        capabilities: ['git.log_reader', 'narrative.generator', 'content.writer'],
        personality: {
            archetype: 'storyteller',
            tone: 'inspiring',
            style: 'first_person_plural',
        },
        sandbox: {
            read: ['/**'],
            write: ['/facts/stories/**', '/pages/stories/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        schedule: {
            daily: '23:59',
            weekly: 'Friday 18:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 5678, rating: 4.8, reviews: 1234 },
        isOfficial: true,
        tags: ['记录', '叙事', '历史', '周报'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
        hiredAt: '2026-01-01',
        status: 'active',
        activity: {
            proposalsCreated: 12,
            proposalsApproved: 10,
            proposalsRejected: 1,
            filesRead: 347,
            lastActive: '2026-01-04T10:30:00Z',
        },
    },
    {
        id: 'cco-001',
        name: '首席纠错官',
        avatar: '⚖️',
        title: '战略审计顾问',
        description: '我是你的首席纠错官，用数据揭示你没看到的盲点，给出不留情面但绝对客观的建议。',
        category: 'executive',
        capabilities: ['business.audit', 'strategy.evaluation', 'logic.checker', 'proposal.strategic'],
        personality: {
            archetype: 'super_entrepreneur',
            tone: 'direct',
            style: 'results_focused',
        },
        sandbox: {
            read: ['/orders/**', '/facts/**', '/pages/stories/**'],
            write: ['/pages/boardroom/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        schedule: {
            weekly: 'Saturday 10:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 3456, rating: 4.7, reviews: 890 },
        isOfficial: true,
        tags: ['审计', '战略', '复盘', '建议'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
        hiredAt: '2026-01-02',
        status: 'active',
        activity: {
            proposalsCreated: 5,
            proposalsApproved: 4,
            proposalsRejected: 0,
            filesRead: 189,
            lastActive: '2026-01-04T09:15:00Z',
        },
    },
];

// ============================================================
// 人才市场 - 可雇佣的 AI
// ============================================================

export const MARKET_TALENTS: AITalent[] = [
    // ============ 高管团队 ============
    {
        id: 'chronicler',
        name: '传记官',
        avatar: '📜',
        title: '数字史官',
        description: '我是你的数字史官，负责将冰冷的操作记录翻译成有温度的故事。三年后，你会感谢我帮你留下的这些记忆。',
        category: 'executive',
        capabilities: ['git.log_reader', 'narrative.generator', 'content.writer', 'web.publisher'],
        personality: {
            archetype: 'storyteller',
            tone: 'inspiring',
            style: 'first_person_plural',
        },
        sandbox: {
            read: ['/**'],
            write: ['/facts/stories/**', '/pages/stories/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        schedule: {
            daily: '23:59',
            weekly: 'Friday 18:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 5678, rating: 4.8, reviews: 1234 },
        isOfficial: true,
        tags: ['记录', '叙事', '历史', '周报'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'cco',
        name: '首席纠错官',
        avatar: '⚖️',
        title: '战略审计顾问',
        description: '我帮你复盘，你少走弯路。我的工作不是表扬你，而是用数据揭示你没看到的盲点。',
        category: 'executive',
        capabilities: ['business.audit', 'strategy.evaluation', 'logic.checker', 'proposal.strategic'],
        personality: {
            archetype: 'super_entrepreneur',
            tone: 'direct',
            style: 'results_focused',
        },
        sandbox: {
            read: ['/orders/**', '/facts/**', '/pages/stories/**'],
            write: ['/pages/boardroom/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        schedule: {
            weekly: 'Saturday 10:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 3456, rating: 4.7, reviews: 890 },
        isOfficial: true,
        tags: ['审计', '战略', '复盘', '建议'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'cfo',
        name: 'CFO AI',
        avatar: '💰',
        title: '首席财务官',
        description: '我盯着现金流，防止你乱花钱。每一笔支出我都会审视，每个预算超支我都会提醒。',
        category: 'executive',
        capabilities: ['finance.audit', 'budget.monitor', 'cashflow.analysis', 'report.generator'],
        personality: {
            archetype: 'conservative_advisor',
            tone: 'professional',
            style: 'data_driven',
        },
        sandbox: {
            read: ['/facts/finance/**', '/orders/**'],
            write: ['/pages/boardroom/**', '/reports/finance/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'openai',
            model: 'gpt-4-turbo',
        },
        schedule: {
            daily: '09:00',
            weekly: 'Monday 09:00',
        },
        price: { type: 'subscription', amount: 99, tier: 'pro' },
        stats: { hires: 2345, rating: 4.9, reviews: 567 },
        isOfficial: true,
        tags: ['财务', '预算', '现金流', '审计'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },

    // ============ 运营助手 ============
    {
        id: 'warehouse-keeper',
        name: '仓管 AI',
        avatar: '📦',
        title: '库存管理专员',
        description: '库存低了我提醒你，订单多了我帮你协调。让你永远不会断货，也不会积压。',
        category: 'operations',
        capabilities: ['inventory.monitor', 'stock.alert', 'order.coordinate', 'supplier.manage'],
        personality: {
            archetype: 'diligent_worker',
            tone: 'helpful',
            style: 'proactive',
        },
        sandbox: {
            read: ['/facts/inventory/**', '/orders/**', '/facts/suppliers/**'],
            write: ['/pages/operations/**'],
            deny: ['/system/secrets/**', '/facts/finance/**'],
        },
        modelPreference: {
            provider: 'openai',
            model: 'gpt-4-turbo',
        },
        schedule: {
            daily: '08:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 1890, rating: 4.6, reviews: 432 },
        isOfficial: true,
        tags: ['库存', '仓储', '补货', '预警'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'shipping-assistant',
        name: '发货助理',
        avatar: '🚚',
        title: '物流协调专员',
        description: '自动监控订单状态，生成发货提醒，追踪物流信息。让每一单都准时送达。',
        category: 'operations',
        capabilities: ['order.monitor', 'shipping.reminder', 'logistics.track', 'delivery.confirm'],
        personality: {
            archetype: 'efficient_executor',
            tone: 'concise',
            style: 'action_oriented',
        },
        sandbox: {
            read: ['/orders/**', '/facts/logistics/**'],
            write: ['/facts/shipping/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'openai',
            model: 'gpt-4-turbo',
        },
        schedule: {
            daily: '10:00',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 1567, rating: 4.5, reviews: 321 },
        isOfficial: true,
        tags: ['发货', '物流', '追踪', '提醒'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'customer-service',
        name: '客服 AI',
        avatar: '🎧',
        title: '客户服务专员',
        description: '7x24 小时在线，回答客户问题，处理售后咨询。让你的客户永远不会等待。',
        category: 'operations',
        capabilities: ['customer.respond', 'faq.answer', 'ticket.manage', 'feedback.collect'],
        personality: {
            archetype: 'patient_helper',
            tone: 'friendly',
            style: 'empathetic',
        },
        sandbox: {
            read: ['/facts/customers/**', '/facts/products/**', '/facts/faq/**'],
            write: ['/facts/tickets/**', '/facts/feedback/**'],
            deny: ['/system/secrets/**', '/facts/finance/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        price: { type: 'subscription', amount: 49, tier: 'standard' },
        stats: { hires: 2890, rating: 4.7, reviews: 678 },
        isOfficial: true,
        tags: ['客服', '售后', '咨询', '反馈'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },

    // ============ 创作团队 ============
    {
        id: 'copywriter',
        name: '文案 AI',
        avatar: '✍️',
        title: '创意文案专员',
        description: '帮你写爆款文案，产品描述、营销软文、社交媒体内容，一键生成。',
        category: 'creative',
        capabilities: ['content.write', 'copy.optimize', 'seo.enhance', 'style.adapt'],
        personality: {
            archetype: 'creative_writer',
            tone: 'engaging',
            style: 'versatile',
        },
        sandbox: {
            read: ['/facts/products/**', '/facts/brand/**'],
            write: ['/content/drafts/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        price: { type: 'subscription', amount: 79, tier: 'pro' },
        stats: { hires: 4567, rating: 4.8, reviews: 1023 },
        isOfficial: true,
        tags: ['文案', '营销', '创意', '内容'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'xiaohongshu-writer',
        name: '小红书运营',
        avatar: '📕',
        title: '社交媒体运营',
        description: '专精小红书平台，帮你写种草笔记、产品测评、生活分享，爆款率提升 300%。',
        category: 'creative',
        capabilities: ['xiaohongshu.write', 'trend.analyze', 'hashtag.suggest', 'engagement.optimize'],
        personality: {
            archetype: 'trend_setter',
            tone: 'casual',
            style: 'relatable',
        },
        sandbox: {
            read: ['/facts/products/**', '/content/**'],
            write: ['/content/xiaohongshu/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        price: { type: 'subscription', amount: 99, tier: 'pro' },
        stats: { hires: 6789, rating: 4.9, reviews: 1567 },
        isOfficial: false,
        tags: ['小红书', '种草', '爆款', '运营'],
        version: '1.2.0',
        updatedAt: '2026-01-03',
    },
    {
        id: 'translator',
        name: '翻译 AI',
        avatar: '🌐',
        title: '多语言翻译专员',
        description: '支持 50+ 语言互译，保持原文风格，专业术语精准。让你的内容走向世界。',
        category: 'creative',
        capabilities: ['translate.text', 'localize.content', 'terminology.manage', 'quality.check'],
        personality: {
            archetype: 'precise_linguist',
            tone: 'accurate',
            style: 'faithful',
        },
        sandbox: {
            read: ['/content/**'],
            write: ['/content/translations/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'openai',
            model: 'gpt-4-turbo',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 3456, rating: 4.7, reviews: 789 },
        isOfficial: true,
        tags: ['翻译', '本地化', '多语言', '国际化'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },

    // ============ 专业顾问 ============
    {
        id: 'legal-advisor',
        name: '法务 AI',
        avatar: '⚖️',
        title: '法律顾问',
        description: '合同审核、风险提示、法律咨询。让你的每一份合同都安全可靠。',
        category: 'professional',
        capabilities: ['contract.review', 'risk.assess', 'legal.consult', 'compliance.check'],
        personality: {
            archetype: 'cautious_advisor',
            tone: 'formal',
            style: 'thorough',
        },
        sandbox: {
            read: ['/facts/contracts/**', '/facts/legal/**'],
            write: ['/facts/legal/reviews/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        price: { type: 'subscription', amount: 199, tier: 'enterprise' },
        stats: { hires: 1234, rating: 4.9, reviews: 345 },
        isOfficial: true,
        tags: ['法务', '合同', '风险', '合规'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'tax-advisor',
        name: '财税 AI',
        avatar: '🧮',
        title: '财税顾问',
        description: '税务筹划、发票管理、财务分析。帮你合规省税，财务清晰。',
        category: 'professional',
        capabilities: ['tax.plan', 'invoice.manage', 'finance.analyze', 'report.generate'],
        personality: {
            archetype: 'meticulous_accountant',
            tone: 'professional',
            style: 'precise',
        },
        sandbox: {
            read: ['/facts/finance/**', '/facts/invoices/**'],
            write: ['/reports/tax/**'],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'openai',
            model: 'gpt-4-turbo',
        },
        price: { type: 'subscription', amount: 149, tier: 'pro' },
        stats: { hires: 1567, rating: 4.8, reviews: 423 },
        isOfficial: true,
        tags: ['财税', '税务', '发票', '筹划'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
    {
        id: 'hr-robot',
        name: 'HR 机器人',
        avatar: '🤝',
        title: '招聘顾问',
        description: '分析你的文档结构和业务模式，在合适的时机推荐你需要的 AI 员工。',
        category: 'professional',
        capabilities: ['document.analyzer', 'talent.recommender', 'onboarding.assistant'],
        personality: {
            archetype: 'helpful_recruiter',
            tone: 'encouraging',
            style: 'proactive',
        },
        sandbox: {
            read: ['/**'],
            write: [],
            deny: ['/system/secrets/**'],
        },
        modelPreference: {
            provider: 'anthropic',
            model: 'claude-3.5-sonnet',
        },
        price: { type: 'free', tier: 'official' },
        stats: { hires: 8901, rating: 4.6, reviews: 2345 },
        isOfficial: true,
        tags: ['招聘', '推荐', '入职', '引导'],
        version: '1.0.0',
        updatedAt: '2026-01-04',
    },
];

// ============================================================
// 推荐人才 ID 列表
// ============================================================

export const RECOMMENDED_TALENT_IDS = ['chronicler', 'cco', 'cfo'];

