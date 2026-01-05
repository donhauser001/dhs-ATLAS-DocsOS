/**
 * Person 列表页（Verified）
 * 
 * Phase 4.2: 显示所有已验证的 Person
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Search,
    RefreshCw,
    CheckCircle,
    Clock,
    Shield,
    Users,
    AlertCircle,
    ChevronRight,
    Building,
    Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    fetchVerifiedPersons,
    searchPersons,
    rebuildPersonIndex,
    fetchPersonStats,
    type PersonRecord,
    type PersonIndexStats,
} from '@/api/persons';

// 登录状态配置
const ACCESS_STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
    none: { label: '无登录资格', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
    eligible: { label: '可邀请', color: 'bg-blue-100 text-blue-600', icon: User },
    invited: { label: '已邀请', color: 'bg-purple-100 text-purple-600', icon: Mail },
    active: { label: '已激活', color: 'bg-green-100 text-green-600', icon: CheckCircle },
    suspended: { label: '已禁用', color: 'bg-red-100 text-red-600', icon: AlertCircle },
};

export function PersonsPage() {
    const navigate = useNavigate();
    const [persons, setPersons] = useState<PersonRecord[]>([]);
    const [stats, setStats] = useState<PersonIndexStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isRebuilding, setIsRebuilding] = useState(false);

    // 加载数据
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);

        try {
            const [personsData, statsData] = await Promise.all([
                fetchVerifiedPersons(),
                fetchPersonStats(),
            ]);
            setPersons(personsData);
            setStats(statsData.index);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    // 搜索
    async function handleSearch() {
        if (!searchQuery.trim()) {
            loadData();
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            const results = await searchPersons(searchQuery);
            // 只显示 verified 的结果
            setPersons(results.filter(p => p.status === 'verified'));
        } catch (e) {
            setError(String(e));
        } finally {
            setIsSearching(false);
        }
    }

    // 重建索引
    async function handleRebuildIndex() {
        setIsRebuilding(true);
        setError(null);

        try {
            await rebuildPersonIndex();
            await loadData();
        } catch (e) {
            setError(String(e));
        } finally {
            setIsRebuilding(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* 头部 */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Users className="w-7 h-7 text-purple-600" />
                                人员列表
                            </h1>
                            <p className="text-slate-500 mt-1">
                                管理系统中的所有已验证人员
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Link to="/persons/staging">
                                <Button variant="outline" className="gap-2">
                                    <Clock size={16} />
                                    审核池
                                    {stats && stats.staging > 0 && (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {stats.staging}
                                        </span>
                                    )}
                                </Button>
                            </Link>
                            <Button
                                variant="outline"
                                onClick={handleRebuildIndex}
                                disabled={isRebuilding}
                                className="gap-2"
                            >
                                <RefreshCw size={16} className={isRebuilding ? 'animate-spin' : ''} />
                                重建索引
                            </Button>
                        </div>
                    </div>

                    {/* 统计卡片 */}
                    {stats && (
                        <div className="grid grid-cols-5 gap-4 mt-6">
                            <StatCard
                                label="已验证"
                                value={stats.verified}
                                icon={CheckCircle}
                                color="text-green-600"
                                bgColor="bg-green-50"
                            />
                            <StatCard
                                label="已激活"
                                value={stats.byAccessStatus.active || 0}
                                icon={Shield}
                                color="text-emerald-600"
                                bgColor="bg-emerald-50"
                            />
                            <StatCard
                                label="可邀请"
                                value={stats.byAccessStatus.eligible || 0}
                                icon={User}
                                color="text-blue-600"
                                bgColor="bg-blue-50"
                            />
                            <StatCard
                                label="已邀请"
                                value={stats.byAccessStatus.invited || 0}
                                icon={Mail}
                                color="text-purple-600"
                                bgColor="bg-purple-50"
                            />
                            <StatCard
                                label="待审核"
                                value={stats.staging}
                                icon={Clock}
                                color="text-amber-600"
                                bgColor="bg-amber-50"
                            />
                        </div>
                    )}

                    {/* 搜索框 */}
                    <div className="flex gap-3 mt-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="搜索姓名、邮箱、手机号..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? '搜索中...' : '搜索'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 内容区 */}
            <div className="max-w-7xl mx-auto px-6 py-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                        {error}
                    </div>
                ) : persons.length === 0 ? (
                    <div className="text-center py-20">
                        <Users className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-600">暂无已验证人员</h3>
                        <p className="text-slate-500 mt-1">
                            请先在审核池中验证人员
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {persons.map((person) => (
                            <PersonCard
                                key={person.person_id}
                                person={person}
                                onClick={() => navigate(`/persons/${person.person_id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// 统计卡片组件
function StatCard({
    label,
    value,
    icon: Icon,
    color,
    bgColor,
}: {
    label: string;
    value: number;
    icon: typeof CheckCircle;
    color: string;
    bgColor: string;
}) {
    return (
        <div className={`${bgColor} rounded-lg p-4`}>
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                    <div className="text-sm text-slate-600">{label}</div>
                </div>
            </div>
        </div>
    );
}

// Person 卡片组件
function PersonCard({
    person,
    onClick,
}: {
    person: PersonRecord;
    onClick: () => void;
}) {
    const statusConfig = ACCESS_STATUS_CONFIG[person.access.status] || ACCESS_STATUS_CONFIG.none;
    const StatusIcon = statusConfig.icon;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-lg border border-slate-200 p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* 头像 */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium text-lg">
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

                    {/* 信息 */}
                    <div>
                        <div className="font-medium text-slate-900 text-lg">
                            {person.display_name}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                            {person.title && (
                                <span className="flex items-center gap-1">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    {person.title}
                                </span>
                            )}
                            {person.company && (
                                <span className="flex items-center gap-1">
                                    <Building className="w-3.5 h-3.5" />
                                    {person.company}
                                </span>
                            )}
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
                    </div>
                </div>

                {/* 右侧 */}
                <div className="flex items-center gap-4">
                    {/* 登录状态 */}
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusConfig.label}
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
            </div>
        </div>
    );
}

export default PersonsPage;

