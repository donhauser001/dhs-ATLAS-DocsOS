/**
 * Staging 审核池页面
 * 
 * Phase 4.2: 显示待审核的 Person
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ArrowLeft,
    User,
    Mail,
    Phone,
    FileText,
    ChevronRight,
    AlertCircle,
    Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    fetchStagingPersons,
    verifyPerson,
    completePerson,
    rejectPerson,
    type PersonRecord,
} from '@/api/persons';

export function StagingPoolPage() {
    const navigate = useNavigate();
    const [persons, setPersons] = useState<PersonRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // 编辑弹窗状态
    const [editingPerson, setEditingPerson] = useState<PersonRecord | null>(null);
    const [editFields, setEditFields] = useState<{
        display_name: string;
        email: string;
        phone: string;
    }>({ display_name: '', email: '', phone: '' });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const data = await fetchStagingPersons();
            setPersons(data);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    // 验证
    async function handleVerify(person: PersonRecord) {
        if (person.missing_fields.length > 0) {
            // 有缺失字段，打开编辑弹窗
            setEditingPerson(person);
            setEditFields({
                display_name: person.display_name || '',
                email: person.email || '',
                phone: person.phone || '',
            });
            return;
        }

        setActionLoading(person.person_id);
        try {
            await verifyPerson(person.person_id);
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setActionLoading(null);
        }
    }

    // 补全并验证
    async function handleComplete() {
        if (!editingPerson) return;

        setActionLoading(editingPerson.person_id);
        try {
            await completePerson(editingPerson.person_id, editFields);
            setEditingPerson(null);
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setActionLoading(null);
        }
    }

    // 拒绝
    async function handleReject(person: PersonRecord) {
        const reason = prompt('请输入拒绝原因：');
        if (!reason) return;

        setActionLoading(person.person_id);
        try {
            await rejectPerson(person.person_id, reason);
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setActionLoading(null);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 头部 */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/persons">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                    <Clock className="w-7 h-7 text-amber-500" />
                                    审核池
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    待审核的 Person 文档，验证后将进入正式列表
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                                共 {persons.length} 条待审核
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 内容区 */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                ) : persons.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">审核池为空</h3>
                        <p className="text-slate-500 mt-1">
                            所有 Person 文档都已验证通过
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {persons.map((person) => (
                            <StagingCard
                                key={person.person_id}
                                person={person}
                                onVerify={() => handleVerify(person)}
                                onReject={() => handleReject(person)}
                                onEdit={() => {
                                    setEditingPerson(person);
                                    setEditFields({
                                        display_name: person.display_name || '',
                                        email: person.email || '',
                                        phone: person.phone || '',
                                    });
                                }}
                                isLoading={actionLoading === person.person_id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* 编辑弹窗 */}
            {editingPerson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setEditingPerson(null)}
                    />
                    <div className="relative bg-white rounded-xl shadow-2xl w-[500px] max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900">
                                补全信息
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                请补全缺失的字段以完成验证
                            </p>
                        </div>

                        <div className="p-6 space-y-4">
                            {editingPerson.missing_fields.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                                    <div className="flex items-center gap-2 font-medium">
                                        <AlertTriangle className="w-4 h-4" />
                                        缺失字段
                                    </div>
                                    <div className="mt-1">
                                        {editingPerson.missing_fields.join('、')}
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    显示名称 *
                                </label>
                                <Input
                                    value={editFields.display_name}
                                    onChange={(e) =>
                                        setEditFields({ ...editFields, display_name: e.target.value })
                                    }
                                    placeholder="请输入显示名称"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    邮箱
                                </label>
                                <Input
                                    type="email"
                                    value={editFields.email}
                                    onChange={(e) =>
                                        setEditFields({ ...editFields, email: e.target.value })
                                    }
                                    placeholder="请输入邮箱"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    手机号
                                </label>
                                <Input
                                    value={editFields.phone}
                                    onChange={(e) =>
                                        setEditFields({ ...editFields, phone: e.target.value })
                                    }
                                    placeholder="请输入手机号"
                                />
                            </div>

                            <div className="text-sm text-slate-500">
                                * 至少需要填写邮箱或手机号中的一项
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setEditingPerson(null)}
                            >
                                取消
                            </Button>
                            <Button
                                onClick={handleComplete}
                                disabled={
                                    !editFields.display_name.trim() ||
                                    (!editFields.email.trim() && !editFields.phone.trim()) ||
                                    actionLoading === editingPerson.person_id
                                }
                            >
                                {actionLoading === editingPerson.person_id ? '处理中...' : '保存并验证'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Staging 卡片组件
function StagingCard({
    person,
    onVerify,
    onReject,
    onEdit,
    isLoading,
}: {
    person: PersonRecord;
    onVerify: () => void;
    onReject: () => void;
    onEdit: () => void;
    isLoading: boolean;
}) {
    const hasMissingFields = person.missing_fields.length > 0;
    const hasIssues = person.issues.length > 0;

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium text-lg">
                        {person.display_name?.charAt(0) || '?'}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1">
                        <div className="font-medium text-slate-900 text-lg">
                            {person.display_name || '(未命名)'}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            {person.email && (
                                <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {person.email}
                                </span>
                            )}
                            {person.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {person.phone}
                                </span>
                            )}
                        </div>

                        {/* 源文档 */}
                        <div className="flex items-center gap-1 text-sm text-slate-400 mt-2">
                            <FileText className="w-3.5 h-3.5" />
                            {person.source_doc}
                        </div>

                        {/* 置信度 */}
                        <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all"
                                        style={{ width: `${person.confidence}%` }}
                                    />
                                </div>
                                <span className="text-sm text-slate-500">
                                    {person.confidence}%
                                </span>
                            </div>
                        </div>

                        {/* 缺失字段 */}
                        {hasMissingFields && (
                            <div className="flex items-center gap-2 mt-3 text-sm text-amber-600">
                                <AlertTriangle className="w-4 h-4" />
                                缺失: {person.missing_fields.join('、')}
                            </div>
                        )}

                        {/* 问题 */}
                        {hasIssues && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                {person.issues.join('；')}
                            </div>
                        )}
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        disabled={isLoading}
                        className="gap-1"
                    >
                        <Edit className="w-4 h-4" />
                        编辑
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReject}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                    >
                        <XCircle className="w-4 h-4" />
                        拒绝
                    </Button>
                    <Button
                        size="sm"
                        onClick={onVerify}
                        disabled={isLoading}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircle className="w-4 h-4" />
                        )}
                        {hasMissingFields ? '补全' : '验证'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default StagingPoolPage;


