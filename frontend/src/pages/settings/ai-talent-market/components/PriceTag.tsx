/**
 * PriceTag - 价格标签组件
 * 
 * 显示人才的价格信息
 */

import type { TalentPrice } from '../types';

interface PriceTagProps {
    price: TalentPrice;
    className?: string;
}

export function PriceTag({ price, className = '' }: PriceTagProps) {
    if (price.type === 'free') {
        return (
            <span className={`text-green-600 font-medium ${className}`}>
                免费
            </span>
        );
    }

    if (price.type === 'subscription') {
        return (
            <span className={`text-slate-700 ${className}`}>
                ¥{price.amount}/月
            </span>
        );
    }

    return (
        <span className={`text-slate-700 ${className}`}>
            ¥{price.amount}
        </span>
    );
}

export default PriceTag;

