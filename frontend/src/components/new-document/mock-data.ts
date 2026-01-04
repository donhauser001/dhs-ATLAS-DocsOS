/**
 * 类型包模拟数据
 * 后续将从 atlas-content 目录加载
 */

import type { TypePackageInfo } from './types';

export const TYPE_PACKAGES: TypePackageInfo[] = [
    {
        id: 'contact',
        name: '联系人',
        description: '联系人信息管理，支持多联系方式、标签分组',
        icon: 'user',
        color: '#8B5CF6',
        category: 'business',
        isOfficial: true,
        defaultFunction: 'entity_detail',
        defaultDisplay: 'detail.card',
        defaultCapabilities: ['editable', 'searchable', 'linkable', 'exportable'],
        blocks: [
            { id: 'personal_info', name: '个人信息', description: '姓名、头像、职位等', required: true, selected: true },
            { id: 'contact_methods', name: '联系方式', description: '手机、邮箱、微信等', required: true, selected: true },
            { id: 'address_info', name: '地址信息', description: '工作/家庭地址', required: false, selected: false },
            { id: 'social_accounts', name: '社交账号', description: 'LinkedIn、微博等', required: false, selected: false },
            { id: 'tags_notes', name: '标签与备注', description: '分类标签和备注', required: false, selected: false },
        ],
    },
    {
        id: 'client',
        name: '客户管理',
        description: '标准客户关系管理，包含客户信息、跟进记录',
        icon: 'building',
        color: '#3B82F6',
        category: 'business',
        isOfficial: true,
        defaultFunction: 'entity_detail',
        defaultDisplay: 'detail.card',
        defaultCapabilities: ['editable', 'searchable', 'linkable'],
        blocks: [
            { id: 'basic_info', name: '基本信息', description: '客户名称、等级、来源', required: true, selected: true },
            { id: 'contact_info', name: '联系方式', description: '联系人、电话、邮箱', required: true, selected: true },
            { id: 'business_info', name: '业务信息', description: '状态、负责人、价值', required: false, selected: true },
            { id: 'follow_up', name: '跟进记录', description: '联系历史和下一步', required: false, selected: false },
        ],
    },
    {
        id: 'project',
        name: '项目管理',
        description: '项目全生命周期管理，包含里程碑、任务、进度',
        icon: 'folder',
        color: '#10B981',
        category: 'business',
        isOfficial: true,
        defaultFunction: 'entity_detail',
        defaultDisplay: 'detail.card',
        defaultCapabilities: ['editable', 'searchable', 'linkable', 'versionable'],
        blocks: [
            { id: 'project_info', name: '项目信息', description: '名称、状态、优先级', required: true, selected: true },
            { id: 'timeline', name: '时间线', description: '开始/结束日期、进度', required: true, selected: true },
            { id: 'team', name: '项目团队', description: '项目经理、成员', required: false, selected: true },
            { id: 'budget', name: '预算信息', description: '预算金额、已支出', required: false, selected: false },
            { id: 'milestones', name: '里程碑', description: '关键节点列表', required: false, selected: false },
        ],
    },
    {
        id: 'task',
        name: '任务清单',
        description: '待办任务管理，支持优先级、截止日期',
        icon: 'check-square',
        color: '#F59E0B',
        category: 'business',
        isOfficial: true,
        defaultFunction: 'entity_detail',
        defaultDisplay: 'detail.form',
        defaultCapabilities: ['editable', 'searchable'],
        blocks: [
            { id: 'task_info', name: '任务信息', description: '标题、状态、优先级', required: true, selected: true },
            { id: 'schedule', name: '时间安排', description: '截止日期、工时', required: false, selected: true },
        ],
    },
    {
        id: 'article',
        name: '文章',
        description: '长文本内容创作，支持目录、阅读模式',
        icon: 'file-text',
        color: '#EC4899',
        category: 'content',
        isOfficial: true,
        defaultFunction: 'article',
        defaultDisplay: 'article.single',
        defaultCapabilities: ['editable', 'searchable', 'publishable', 'versionable'],
        blocks: [
            { id: 'metadata', name: '文章信息', description: '标题、分类、标签', required: true, selected: true },
            { id: 'publish_info', name: '发布信息', description: '状态、发布日期', required: false, selected: false },
            { id: 'seo', name: 'SEO 设置', description: 'SEO 标题和描述', required: false, selected: false },
        ],
    },
    {
        id: 'note',
        name: '笔记',
        description: '知识记录和灵感捕捉，轻量级快速记录',
        icon: 'sticky-note',
        color: '#14B8A6',
        category: 'content',
        isOfficial: true,
        defaultFunction: 'wiki',
        defaultDisplay: 'article.double',
        defaultCapabilities: ['editable', 'searchable', 'linkable'],
        blocks: [
            { id: 'note_info', name: '笔记信息', description: '标题、标签、分类', required: false, selected: true },
            { id: 'links', name: '关联', description: '相关笔记、来源', required: false, selected: false },
        ],
    },
];

/** 按分类获取类型包 */
export function getPackagesByCategory() {
    const categories = {
        business: { label: '业务文档', packages: [] as TypePackageInfo[] },
        content: { label: '内容文档', packages: [] as TypePackageInfo[] },
        system: { label: '系统文档', packages: [] as TypePackageInfo[] },
        custom: { label: '自定义', packages: [] as TypePackageInfo[] },
    };

    TYPE_PACKAGES.forEach(pkg => {
        categories[pkg.category].packages.push(pkg);
    });

    return categories;
}

