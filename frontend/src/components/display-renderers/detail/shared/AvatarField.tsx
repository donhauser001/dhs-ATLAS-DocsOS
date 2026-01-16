/**
 * AvatarField - 头像字段组件
 * 
 * 单独一行显示头像
 */

import React from 'react';
import { User } from 'lucide-react';

export interface AvatarFieldProps {
    value: unknown;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
};

const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
};

export const AvatarField: React.FC<AvatarFieldProps> = ({ value, size = 'md' }) => {
    const imgSrc = value as string;
    const containerClass = sizeClasses[size];
    const iconClass = iconSizeClasses[size];

    if (!imgSrc) {
        return (
            <div className="py-2">
                <div className={`${containerClass} bg-slate-100 rounded-full flex items-center justify-center`}>
                    <User className={`${iconClass} text-slate-300`} />
                </div>
            </div>
        );
    }

    const finalSrc = imgSrc.startsWith('data:') || imgSrc.startsWith('http')
        ? imgSrc
        : `/api/files/preview?path=${encodeURIComponent(imgSrc)}`;

    return (
        <div className="py-2">
            <img
                src={finalSrc}
                alt="头像"
                className={`${containerClass} rounded-full object-cover border-2 border-slate-200 shadow-sm`}
            />
        </div>
    );
};
