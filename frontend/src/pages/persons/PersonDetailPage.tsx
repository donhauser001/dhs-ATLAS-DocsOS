/**
 * Person 详情页
 * 
 * Phase 4.2: 显示 Person 完整信息，包含邀请/启用操作入口
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Building,
    Briefcase,
    Tag,
    Shield,
    CheckCircle,
    Clock,
    AlertCircle,
    Send,
    Ban,
    RefreshCw,
    FileText,
    History,
    ChevronDown,
    ChevronUp,
    Copy,
    ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    fetchPerson,
    sendInvite,
    resendInvite,
    cancelInvite,
    enableLogin,
    suspendLogin,
    reactivateLogin,
    getAvailableActions,
    type PersonRecord,
    type AuditRecord,
    type AvailableAction,
} from '@/api/persons';

// 登录状态配置
const ACCESS_STATUS_CONFIG: Record<string, {
    label: string;
    description: string;
    color: string;
    bgColor: string;
    icon: typeof Shield;
}> = {
    none: {
        label: '无登录资格',
        description: '尚未满足登录资格条件',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: AlertCircle,
    },
    eligible: {
        label: '可邀请',
        description: '满足字段合同，可发送登录邀请',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: User,
    },
    invited: {
        label: '已邀请',
        description: '已发送邀请，等待用户认领',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        icon: Mail,
    },
    active: {
        label: '已激活',
        description: '可正常登录系统',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
    },
    suspended: {
        label: '已禁用',
        description: '登录权限已被禁用',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: Ban,
    },
};

export function PersonDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [person, setPerson] = useState<PersonRecord | null>(null);
    const [auditTrail, setAuditTrail] = useState<AuditRecord[]>([]);
    const [availableActions, setAvailableActions] = useState<AvailableAction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showAuditTrail, setShowAuditTrail] = useState(false);
    const [inviteResult, setInviteResult] = useState<{
        magicLink?: string;
        expiresAt?: string;
    } | null>(null);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const [personData, actionsData] = await Promise.all([
                fetchPerson(id!),
                getAvailableActions(id!),
            ]);
            setPerson(personData.person);
            setAuditTrail(personData.audit_trail);
            setAvailableActions(actionsData.actions);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    // 执行动作
    async function handleAction(action: AvailableAction) {
        setActionLoading(action.action);
        setError(null);

        try {
            switch (action.action) {
                case 'send_invite':
                    const result = await sendInvite(id!);
                    setInviteResult({
                        magicLink: result.magicLink,
                        expiresAt: result.expiresAt,
                    });
                    break;
                case 'cancel_invite':
                    await cancelInvite(id!);
                    setInviteResult(null);
                    break;
                case 'enable_direct':
                    await enableLogin(id!);
                    break;
                case 'suspend':
                    await suspendLogin(id!);
                    break;
                case 'reactivate':
                    await reactivateLogin(id!);
                    break;
            }
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setActionLoading(null);
        }
    }

    // 重发邀请
    async function handleResendInvite() {
        setActionLoading('resend');
        try {
            const result = await resendInvite(id!);
            setInviteResult({
                magicLink: undefined,  // 重发不返回 magic link
                expiresAt: result.expiresAt,
            });
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setActionLoading(null);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (error && !person) {
        return (
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!person) {
        return null;
    }

    const statusConfig = ACCESS_STATUS_CONFIG[person.access.status] || ACCESS_STATUS_CONFIG.none;
    const StatusIcon = statusConfig.icon;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 头部 */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Link to="/persons">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                {/* 头像 */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                                    {person.avatar ? (
                                        <img
                                            src={person.avatar}
                                            alt={person.display_name}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        person.display_name?.charAt(0) || 'P'
                                    )}
                                </div>
                                
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">
                                        {person.display_name}
                                    </h1>
                                    <div className="flex items-center gap-4 text-slate-500 mt-1">
                                        {person.title && (
                                            <span className="flex items-center gap-1">
                                                <Briefcase className="w-4 h-4" />
                                                {person.title}
                                            </span>
                                        )}
                                        {person.company && (
                                            <span className="flex items-center gap-1">
                                                <Building className="w-4 h-4" />
                                                {person.company}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 状态徽章 */}
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
                            <StatusIcon className="w-5 h-5" />
                            <span className="font-medium">{statusConfig.label}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 内容区 */}
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                )}

                {/* 邀请链接（如果有） */}
                {inviteResult?.magicLink && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-purple-900">邀请链接已生成</div>
                                <div className="text-sm text-purple-600 mt-1">
                                    有效期至：{new Date(inviteResult.expiresAt!).toLocaleString()}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteResult.magicLink!);
                                    }}
                                    className="gap-1"
                                >
                                    <Copy className="w-4 h-4" />
                                    复制链接
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(inviteResult.magicLink, '_blank')}
                                    className="gap-1"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    打开
                                </Button>
                            </div>
                        </div>
                        <div className="mt-2 p-2 bg-white rounded border border-purple-200 text-sm font-mono text-purple-700 break-all">
                            {inviteResult.magicLink}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-6">
                    {/* 左侧：基本信息 */}
                    <div className="col-span-2 space-y-6">
                        {/* 联系方式 */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">联系方式</h2>
                            <div className="space-y-3">
                                <InfoRow icon={Mail} label="邮箱" value={person.email} />
                                <InfoRow icon={Phone} label="手机" value={person.phone} />
                                <InfoRow icon={Building} label="公司" value={person.company} />
                                <InfoRow icon={Briefcase} label="部门" value={person.department} />
                            </div>
                        </div>

                        {/* 标签 */}
                        {person.tags && person.tags.length > 0 && (
                            <div className="bg-white rounded-lg border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">标签</h2>
                                <div className="flex flex-wrap gap-2">
                                    {person.tags.map((tag, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 源文档 */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">源文档</h2>
                            <div className="flex items-center gap-2 text-slate-600">
                                <FileText className="w-4 h-4" />
                                <span className="font-mono text-sm">{person.source_doc}</span>
                            </div>
                        </div>

                        {/* 审计记录 */}
                        <div className="bg-white rounded-lg border border-slate-200">
                            <button
                                onClick={() => setShowAuditTrail(!showAuditTrail)}
                                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <History className="w-5 h-5 text-slate-400" />
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        审计记录 ({auditTrail.length})
                                    </h2>
                                </div>
                                {showAuditTrail ? (
                                    <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                            </button>
                            
                            {showAuditTrail && (
                                <div className="border-t border-slate-200 p-6 space-y-4">
                                    {auditTrail.length === 0 ? (
                                        <div className="text-slate-500 text-center py-4">
                                            暂无审计记录
                                        </div>
                                    ) : (
                                        auditTrail.map((record) => (
                                            <AuditRecordItem key={record.id} record={record} />
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右侧：登录状态与操作 */}
                    <div className="space-y-6">
                        {/* 登录状态卡片 */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">登录状态</h2>
                            
                            <div className={`p-4 rounded-lg ${statusConfig.bgColor} mb-4`}>
                                <div className={`flex items-center gap-2 ${statusConfig.color} font-medium`}>
                                    <StatusIcon className="w-5 h-5" />
                                    {statusConfig.label}
                                </div>
                                <div className="text-sm text-slate-600 mt-1">
                                    {statusConfig.description}
                                </div>
                            </div>

                            {/* 状态详情 */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">登录启用</span>
                                    <span className={person.access.enabled ? 'text-green-600' : 'text-slate-400'}>
                                        {person.access.enabled ? '是' : '否'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">联系方式已验证</span>
                                    <span className={person.access.contact_verified ? 'text-green-600' : 'text-slate-400'}>
                                        {person.access.contact_verified ? '是' : '否'}
                                    </span>
                                </div>
                                {person.access.invited_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">邀请时间</span>
                                        <span className="text-slate-700">
                                            {new Date(person.access.invited_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {person.access.claimed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">认领时间</span>
                                        <span className="text-slate-700">
                                            {new Date(person.access.claimed_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                                {person.access.last_login && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">最后登录</span>
                                        <span className="text-slate-700">
                                            {new Date(person.access.last_login).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">可用操作</h2>
                            
                            <div className="space-y-2">
                                {availableActions.length === 0 ? (
                                    <div className="text-slate-500 text-sm">
                                        当前状态下无可用操作
                                    </div>
                                ) : (
                                    availableActions.map((action) => (
                                        <ActionButton
                                            key={action.action}
                                            action={action}
                                            onClick={() => handleAction(action)}
                                            isLoading={actionLoading === action.action}
                                        />
                                    ))
                                )}

                                {/* 重发邀请（特殊按钮） */}
                                {person.access.status === 'invited' && (
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-2"
                                        onClick={handleResendInvite}
                                        disabled={actionLoading === 'resend'}
                                    >
                                        {actionLoading === 'resend' ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        重发邀请
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 信息行组件
function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Mail;
    label: string;
    value?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <Icon className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 w-16">{label}</span>
            <span className="text-slate-900">{value || '-'}</span>
        </div>
    );
}

// 操作按钮组件
function ActionButton({
    action,
    onClick,
    isLoading,
}: {
    action: AvailableAction;
    onClick: () => void;
    isLoading: boolean;
}) {
    const getButtonStyle = () => {
        switch (action.action) {
            case 'send_invite':
                return 'bg-purple-600 hover:bg-purple-700 text-white';
            case 'enable_direct':
                return 'bg-green-600 hover:bg-green-700 text-white';
            case 'suspend':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'reactivate':
                return 'bg-blue-600 hover:bg-blue-700 text-white';
            case 'cancel_invite':
                return 'bg-slate-600 hover:bg-slate-700 text-white';
            default:
                return '';
        }
    };

    const getIcon = () => {
        switch (action.action) {
            case 'send_invite':
                return Send;
            case 'enable_direct':
                return CheckCircle;
            case 'suspend':
                return Ban;
            case 'reactivate':
                return RefreshCw;
            case 'cancel_invite':
                return AlertCircle;
            default:
                return Shield;
        }
    };

    const Icon = getIcon();

    return (
        <Button
            className={`w-full justify-start gap-2 ${getButtonStyle()}`}
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
            {action.label}
        </Button>
    );
}

// 审计记录项组件
function AuditRecordItem({ record }: { record: AuditRecord }) {
    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            create: '创建',
            update: '更新',
            promote: '验证通过',
            demote: '降级',
            reject: '拒绝',
            send_invite: '发送邀请',
            cancel_invite: '取消邀请',
            claim: '认领账户',
            enable_login: '启用登录',
            suspend: '禁用登录',
            reactivate: '恢复登录',
            login: '登录',
        };
        return labels[action] || action;
    };

    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5" />
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                        {getActionLabel(record.action)}
                    </span>
                    {record.operator_name && (
                        <span className="text-slate-500">
                            by {record.operator_name}
                        </span>
                    )}
                </div>
                <div className="text-slate-400 text-xs">
                    {new Date(record.timestamp).toLocaleString()}
                </div>
                {record.reason && (
                    <div className="text-slate-600 mt-1">
                        原因：{record.reason}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PersonDetailPage;

