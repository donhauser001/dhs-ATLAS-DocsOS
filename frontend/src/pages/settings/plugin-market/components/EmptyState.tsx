/**
 * EmptyState - 空状态组件
 */

import { Package } from 'lucide-react';
import type { TabType } from '../types';

interface EmptyStateProps {
    activeTab: TabType;
}

export function EmptyState({ activeTab }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Package className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">
                {activeTab === 'installed' ? '暂无已安装的插件' : '没有找到匹配的插件'}
            </p>
        </div>
    );
}

export default EmptyState;

