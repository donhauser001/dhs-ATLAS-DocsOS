/**
 * EmptyState - 空状态组件
 * 
 * 用于显示没有数据时的提示
 */

import { Users, Search, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    type: 'no-hired' | 'no-results';
    onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
    if (type === 'no-hired') {
        return (
            <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                    还没有雇佣 AI 员工
                </h3>
                <p className="text-slate-500 mb-4">
                    前往人才市场，组建你的虚拟团队
                </p>
                {onAction && (
                    <Button onClick={onAction}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        浏览人才市场
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-700 mb-2">
                没有找到匹配的人才
            </h3>
            <p className="text-slate-500">
                试试其他关键词或分类
            </p>
        </div>
    );
}

export default EmptyState;

