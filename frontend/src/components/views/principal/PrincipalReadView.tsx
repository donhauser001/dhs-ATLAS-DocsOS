/**
 * PrincipalReadView - 用户卡片阅读视图
 * 
 * 以卡片形式展示用户信息
 */

import { useMemo } from 'react';
import {
    User, Mail, Phone, Shield, Link2, Calendar,
    Clock, FileText, ChevronDown, ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { useLabels } from '@/providers/LabelProvider';
import type { ViewProps } from '@/registry/types';
import { cn } from '@/lib/utils';

// 状态颜色映射
const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    inactive: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
    suspended: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
};

export function PrincipalReadView({ document, onViewModeChange }: ViewProps) {
    const { resolveLabel, getLabel } = useLabels();
    const [showMetadata, setShowMetadata] = useState(false);

    // 解析用户数据
    const userData = useMemo(() => {
        const block = document.blocks[0];
        const machine = block?.machine || {};
        const frontmatter = document.frontmatter || {};

        return {
            // 基本信息
            displayName: machine.display_name as string || block?.title || '未命名用户',
            id: machine.id as string || '',
            type: machine.type as string || 'principal',
            status: machine.status as string || 'active',

            // 身份信息
            identity: machine.identity as {
                emails?: string[];
                phones?: string[];
                avatar?: { token?: string };
            } || {},

            // 关联档案
            profiles: machine.profiles as Array<{ ref: string }> || [],

            // 元数据
            version: frontmatter.version as string || '1.0',
            created: frontmatter.created as string || '',
            updated: frontmatter.updated as string || '',
            author: frontmatter.author as string || '',
            documentType: frontmatter.document_type as string || 'facts',

            // 功能声明
            atlas: frontmatter.atlas as {
                function?: string;
                capabilities?: string | string[];
            } || {},
        };
    }, [document]);

    const statusStyle = STATUS_COLORS[userData.status] || STATUS_COLORS.active;

    // 获取能力列表
    const capabilities = useMemo(() => {
        const caps = userData.atlas.capabilities;
        if (!caps) return [];
        if (typeof caps === 'string') return caps.split(',').map(s => s.trim());
        return caps;
    }, [userData.atlas.capabilities]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* 用户卡片 */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* 头部区域 */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                    <div className="flex items-start gap-6">
                        {/* 头像 */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {userData.displayName.charAt(0).toUpperCase()}
                        </div>

                        {/* 基本信息 */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {userData.displayName}
                                </h1>
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
                                    statusStyle.bg, statusStyle.text
                                )}>
                                    <span className={cn("w-1.5 h-1.5 rounded-full", statusStyle.dot)} />
                                    {getLabel(userData.status)}
                                </span>
                            </div>
                            <p className="text-gray-500 font-mono text-sm">
                                @{userData.id}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                    <Shield className="w-4 h-4" />
                                    {getLabel(userData.type)}
                                </span>
                                {userData.atlas.function && (
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {getLabel(userData.atlas.function)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* 编辑按钮 */}
                        {onViewModeChange && (
                            <button
                                onClick={() => onViewModeChange('form')}
                                className="px-4 py-2 bg-white rounded-lg border shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                编辑
                            </button>
                        )}
                    </div>
                </div>

                {/* 内容区域 */}
                <div className="p-6 space-y-6">
                    {/* 联系方式 */}
                    <section>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            联系方式
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 邮箱 */}
                            {userData.identity.emails && userData.identity.emails.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">邮箱</div>
                                        <div className="font-medium">{userData.identity.emails[0]}</div>
                                        {userData.identity.emails.length > 1 && (
                                            <div className="text-xs text-gray-400">
                                                +{userData.identity.emails.length - 1} 个其他邮箱
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 电话 */}
                            {userData.identity.phones && userData.identity.phones.length > 0 && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">电话</div>
                                        <div className="font-medium">{userData.identity.phones[0]}</div>
                                        {userData.identity.phones.length > 1 && (
                                            <div className="text-xs text-gray-400">
                                                +{userData.identity.phones.length - 1} 个其他号码
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 无联系方式 */}
                            {(!userData.identity.emails || userData.identity.emails.length === 0) &&
                                (!userData.identity.phones || userData.identity.phones.length === 0) && (
                                    <div className="col-span-2 text-center py-6 text-gray-400">
                                        暂无联系方式
                                    </div>
                                )}
                        </div>
                    </section>

                    {/* 能力标签 */}
                    {capabilities.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                功能能力
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                {capabilities.map(cap => (
                                    <span
                                        key={cap}
                                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                    >
                                        {getLabel(cap)}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 关联档案 */}
                    {userData.profiles.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Link2 className="w-4 h-4" />
                                关联档案
                            </h2>
                            <div className="space-y-2">
                                {userData.profiles.map((profile, index) => (
                                    <a
                                        key={index}
                                        href={`/workspace/${profile.ref.replace('#', '?anchor=')}`}
                                        className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
                                    >
                                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                        <span className="font-mono text-sm text-gray-600 group-hover:text-blue-600">
                                            {profile.ref}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* 元数据折叠区 */}
                <div className="border-t">
                    <button
                        onClick={() => setShowMetadata(!showMetadata)}
                        className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            系统元数据
                        </span>
                        {showMetadata ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>

                    {showMetadata && (
                        <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <div className="text-gray-400 text-xs">版本</div>
                                <div className="font-medium">{userData.version}</div>
                            </div>
                            <div>
                                <div className="text-gray-400 text-xs">文档类型</div>
                                <div className="font-medium">{getLabel(userData.documentType)}</div>
                            </div>
                            {userData.created && (
                                <div>
                                    <div className="text-gray-400 text-xs flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> 创建时间
                                    </div>
                                    <div className="font-medium">{userData.created}</div>
                                </div>
                            )}
                            {userData.updated && (
                                <div>
                                    <div className="text-gray-400 text-xs flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> 更新时间
                                    </div>
                                    <div className="font-medium">{userData.updated}</div>
                                </div>
                            )}
                            {userData.author && (
                                <div>
                                    <div className="text-gray-400 text-xs">作者</div>
                                    <div className="font-medium">{userData.author}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PrincipalReadView;

