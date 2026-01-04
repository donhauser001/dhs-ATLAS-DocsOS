/**
 * TalentDetailModal - 人才详情弹窗组件
 * 
 * 显示 AI 人才的详细信息
 */

import {
    XCircle,
    Star,
    MessageSquare,
    Zap,
    Heart,
    Shield,
    Eye,
    PenTool,
    Bot,
    ChevronRight,
    Clock,
    BarChart3,
    FileText,
    Settings,
    UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AITalent, HiredAI } from '../types';
import { getCategoryColor } from '../constants';
import { PriceTag } from './PriceTag';

interface TalentDetailModalProps {
    talent: AITalent | HiredAI | null;
    onClose: () => void;
    onHire?: (talent: AITalent) => void;
    onFire?: (talent: HiredAI) => void;
    onConfigure?: (talent: HiredAI) => void;
}

/**
 * 判断是否为已雇佣的 AI
 */
function isHiredAI(talent: AITalent | HiredAI): talent is HiredAI {
    return 'hiredAt' in talent;
}

export function TalentDetailModal({
    talent,
    onClose,
    onHire,
    onFire,
    onConfigure,
}: TalentDetailModalProps) {
    if (!talent) return null;

    const isHired = isHiredAI(talent);
    const categoryColor = getCategoryColor(talent.category);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* 头部 */}
                <div
                    className="p-6 text-white"
                    style={{ backgroundColor: categoryColor }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
                            {talent.avatar}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h2 className="text-2xl font-bold">{talent.name}</h2>
                                {talent.isOfficial && (
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
                                        官方认证
                                    </span>
                                )}
                            </div>
                            <p className="text-white/80 mb-2">{talent.title}</p>
                            <div className="flex items-center gap-4 text-sm text-white/70">
                                <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-current text-yellow-300" />
                                    {talent.stats.rating} ({talent.stats.reviews} 评价)
                                </span>
                                <span>📥 {talent.stats.hires.toLocaleString()} 次雇佣</span>
                            </div>
                        </div>
                        <button
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            onClick={onClose}
                        >
                            <XCircle className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* 内容 */}
                <ScrollArea className="h-[calc(90vh-200px)]">
                    <div className="p-6 space-y-6">
                        {/* 自我介绍 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                自我介绍
                            </h3>
                            <p className="text-slate-600 leading-relaxed">
                                {talent.description}
                            </p>
                        </section>

                        {/* 核心能力 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                核心能力
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {talent.capabilities.map((cap, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm"
                                    >
                                        {cap}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* 性格特点 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Heart className="h-4 w-4" />
                                性格特点
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">原型</div>
                                    <div className="font-medium text-slate-700">
                                        {talent.personality.archetype}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">语气</div>
                                    <div className="font-medium text-slate-700">
                                        {talent.personality.tone}
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xs text-slate-500 mb-1">风格</div>
                                    <div className="font-medium text-slate-700">
                                        {talent.personality.style}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 权限需求 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                权限需求
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-start gap-2">
                                    <Eye className="h-4 w-4 text-green-500 mt-0.5" />
                                    <div>
                                        <span className="text-slate-500">读取：</span>
                                        <span className="text-slate-700">
                                            {talent.sandbox.read.join(', ')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <PenTool className="h-4 w-4 text-blue-500 mt-0.5" />
                                    <div>
                                        <span className="text-slate-500">写入：</span>
                                        <span className="text-slate-700">
                                            {talent.sandbox.write.join(', ') || '无'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                    <div>
                                        <span className="text-slate-500">禁止：</span>
                                        <span className="text-slate-700">
                                            {talent.sandbox.deny.join(', ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 模型偏好 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Bot className="h-4 w-4" />
                                模型偏好
                            </h3>
                            <div className="p-3 bg-slate-50 rounded-lg inline-flex items-center gap-2">
                                <span className="text-slate-700">
                                    {talent.modelPreference.provider}
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                                <span className="font-medium text-slate-900">
                                    {talent.modelPreference.model}
                                </span>
                            </div>
                        </section>

                        {/* 调度配置 */}
                        {talent.schedule && (
                            <section>
                                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    调度配置
                                </h3>
                                <div className="flex gap-3">
                                    {talent.schedule.daily && (
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">每日</div>
                                            <div className="font-medium text-slate-700">
                                                {talent.schedule.daily}
                                            </div>
                                        </div>
                                    )}
                                    {talent.schedule.weekly && (
                                        <div className="p-3 bg-slate-50 rounded-lg">
                                            <div className="text-xs text-slate-500 mb-1">每周</div>
                                            <div className="font-medium text-slate-700">
                                                {talent.schedule.weekly}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* 已雇佣的活动记录 */}
                        {isHired && (
                            <section>
                                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    工作记录
                                </h3>
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-slate-700">
                                            {talent.activity.proposalsCreated}
                                        </div>
                                        <div className="text-xs text-slate-500">发起提案</div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {talent.activity.proposalsApproved}
                                        </div>
                                        <div className="text-xs text-slate-500">通过</div>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-600">
                                            {talent.activity.proposalsRejected}
                                        </div>
                                        <div className="text-xs text-slate-500">拒绝</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-slate-700">
                                            {talent.activity.filesRead}
                                        </div>
                                        <div className="text-xs text-slate-500">阅读文件</div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 标签 */}
                        <section>
                            <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                标签
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {talent.tags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </div>
                </ScrollArea>

                {/* 底部操作 */}
                <div className="p-4 border-t bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        版本 {talent.version} · 更新于 {talent.updatedAt}
                    </div>
                    <div className="flex items-center gap-2">
                        {isHired ? (
                            <>
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() => onConfigure?.(talent)}
                                >
                                    <Settings className="h-4 w-4" />
                                    配置
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => onFire?.(talent)}
                                >
                                    <XCircle className="h-4 w-4" />
                                    解雇
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="text-lg font-semibold mr-2">
                                    <PriceTag price={talent.price} />
                                </div>
                                <Button
                                    className="gap-2"
                                    onClick={() => onHire?.(talent)}
                                >
                                    <UserPlus className="h-4 w-4" />
                                    立即雇佣
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TalentDetailModal;

