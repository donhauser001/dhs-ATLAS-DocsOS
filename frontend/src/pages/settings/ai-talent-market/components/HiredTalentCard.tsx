/**
 * HiredTalentCard - 已雇佣 AI 卡片组件
 * 
 * 显示已雇佣 AI 员工的信息和工作状态
 * 样式参照插件市场
 */

import { BadgeCheck } from 'lucide-react';
import type { HiredAI } from '../types';
import { getCategoryColor } from '../constants';
import { StatusBadge } from './StatusBadge';

interface HiredTalentCardProps {
    talent: HiredAI;
    onClick?: () => void;
}

export function HiredTalentCard({ talent, onClick }: HiredTalentCardProps) {
    const categoryColor = getCategoryColor(talent.category);

    return (
        <div
            className="border rounded-xl p-4 hover:border-slate-300 hover:shadow-sm transition-all group bg-white cursor-pointer"
            onClick={onClick}
        >
            {/* 头部 */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: categoryColor + '15' }}
                >
                    {talent.avatar}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-medium text-sm text-slate-900 truncate">
                            {talent.nickname || talent.name}
                        </h3>
                        {talent.isOfficial && (
                            <BadgeCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-slate-500">{talent.title}</p>
                </div>
                <StatusBadge status={talent.status} />
            </div>

            {/* 活动统计 */}
            <div className="grid grid-cols-3 gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                <div className="text-center">
                    <div className="text-base font-semibold text-slate-700">
                        {talent.activity.proposalsCreated}
                    </div>
                    <div className="text-[10px] text-slate-500">提案</div>
                </div>
                <div className="text-center border-x border-slate-200">
                    <div className="text-base font-semibold text-green-600">
                        {talent.activity.proposalsApproved}
                    </div>
                    <div className="text-[10px] text-slate-500">通过</div>
                </div>
                <div className="text-center">
                    <div className="text-base font-semibold text-slate-700">
                        {talent.activity.filesRead}
                    </div>
                    <div className="text-[10px] text-slate-500">阅读</div>
                </div>
            </div>

            {/* 能力标签 */}
            <div className="flex flex-wrap gap-1 mb-3">
                {talent.capabilities.slice(0, 3).map((cap, i) => (
                    <span
                        key={i}
                        className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                    >
                        {cap.split('.')[1] || cap}
                    </span>
                ))}
                {talent.capabilities.length > 3 && (
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]">
                        +{talent.capabilities.length - 3}
                    </span>
                )}
            </div>

            {/* 底部信息 */}
            <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>入职于 {talent.hiredAt}</span>
                <span>最近活跃 {new Date(talent.activity.lastActive).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

export default HiredTalentCard;
