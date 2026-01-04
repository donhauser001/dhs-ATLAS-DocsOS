/**
 * 分享能力组件
 * 
 * 提供文档分享功能
 */

import { Share2 } from 'lucide-react';
import { registerCapability } from '../registry';
import type { CapabilityComponentProps } from '../types';

/**
 * 分享按钮组件
 */
export function ShareButton({ documentPath, capabilityId }: CapabilityComponentProps) {
    const handleClick = () => {
        // TODO: 实现分享功能
        console.log(`[${capabilityId}] 分享文档`, documentPath);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 
                     bg-white border border-slate-200 rounded-lg
                     hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700
                     transition-all duration-150"
        >
            <Share2 size={14} className="text-slate-500" />
            分享
        </button>
    );
}

// 注册能力
registerCapability({
    id: 'share',
    label: '分享',
    icon: 'share-2',
    description: '分享文档给其他用户',
    renderMode: 'button',
    ButtonComponent: ShareButton,
    order: 30,
});

