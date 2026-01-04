import React, { useState } from 'react';
import { Heart, User, Calendar, Tag, X, ExternalLink } from 'lucide-react';
import { GalleryItem, getCategoryColor, formatDate, formatNumber } from './types';

interface GalleryCardProps {
    item: GalleryItem;
    aspectRatio?: 'square' | 'auto' | '4:3' | '16:9';
    showInfo?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

// 占位图颜色
const PLACEHOLDER_COLORS = [
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-red-500',
    'from-green-400 to-teal-500',
    'from-cyan-400 to-blue-500',
    'from-rose-400 to-purple-500',
];

function getPlaceholderColor(id: string): string {
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
}

export const GalleryCard: React.FC<GalleryCardProps> = ({
    item,
    aspectRatio = 'square',
    showInfo = true,
    size = 'md',
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const categoryColors = getCategoryColor(item.categoryOption?.color);
    const placeholderColor = getPlaceholderColor(item.id);
    
    const aspectClasses = {
        'square': 'aspect-square',
        'auto': 'aspect-auto',
        '4:3': 'aspect-[4/3]',
        '16:9': 'aspect-video',
    };
    
    const sizeClasses = {
        sm: { title: 'text-sm', meta: 'text-xs', padding: 'p-2' },
        md: { title: 'text-base', meta: 'text-sm', padding: 'p-3' },
        lg: { title: 'text-lg', meta: 'text-sm', padding: 'p-4' },
    };
    
    const styles = sizeClasses[size];
    
    return (
        <>
            {/* 卡片 */}
            <div 
                className="group bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 cursor-pointer"
                onClick={() => setIsModalOpen(true)}
            >
                {/* 封面图 */}
                <div className={`relative ${aspectClasses[aspectRatio]} bg-slate-100 overflow-hidden`}>
                    {item.cover && !imageError ? (
                        <img
                            src={item.cover}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${placeholderColor} flex items-center justify-center`}>
                            <span className="text-white/80 text-4xl font-bold">
                                {item.title?.charAt(0) || '?'}
                            </span>
                        </div>
                    )}
                    
                    {/* 悬浮遮罩 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <ExternalLink className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    {/* 分类标签 */}
                    {item.categoryOption && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                            {item.categoryOption.label}
                        </div>
                    )}
                    
                    {/* 点赞数 */}
                    {item.likes !== undefined && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs">
                            <Heart className="w-3 h-3 fill-current" />
                            {formatNumber(item.likes)}
                        </div>
                    )}
                </div>
                
                {/* 信息区 */}
                {showInfo && (
                    <div className={styles.padding}>
                        <h3 className={`font-semibold text-slate-800 truncate ${styles.title}`}>
                            {item.title}
                        </h3>
                        <div className={`flex items-center gap-3 mt-1.5 text-slate-500 ${styles.meta}`}>
                            {item.author && (
                                <span className="flex items-center gap-1">
                                    <User className="w-3.5 h-3.5" />
                                    {item.author}
                                </span>
                            )}
                            {item.date && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(item.date)}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {/* 详情弹窗 */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl max-w-[90vw] max-h-[90vh] overflow-auto shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* 大图 - 弹窗宽度自适应图片 */}
                        <div className="relative">
                            {item.cover && !imageError ? (
                                <img
                                    src={item.cover}
                                    alt={item.title}
                                    className="block max-h-[65vh] w-auto rounded-t-2xl"
                                />
                            ) : (
                                <div className={`w-96 h-64 bg-gradient-to-br ${placeholderColor} flex items-center justify-center rounded-t-2xl`}>
                                    <span className="text-white/80 text-8xl font-bold">
                                        {item.title?.charAt(0) || '?'}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* 详情信息 */}
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{item.title}</h2>
                                    <div className="flex items-center gap-4 mt-2 text-slate-500">
                                        {item.author && (
                                            <span className="flex items-center gap-1.5">
                                                <User className="w-4 h-4" />
                                                {item.author}
                                            </span>
                                        )}
                                        {item.date && (
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(item.date)}
                                            </span>
                                        )}
                                        {item.likes !== undefined && (
                                            <span className="flex items-center gap-1.5">
                                                <Heart className="w-4 h-4" />
                                                {formatNumber(item.likes)} 点赞
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {item.categoryOption && (
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors.bg} ${categoryColors.text}`}>
                                        {item.categoryOption.label}
                                    </span>
                                )}
                            </div>
                            
                            {item.description && (
                                <p className="mt-4 text-slate-600 leading-relaxed">{item.description}</p>
                            )}
                            
                            {item.tags && item.tags.length > 0 && (
                                <div className="flex items-center gap-2 mt-4 flex-wrap">
                                    <Tag className="w-4 h-4 text-slate-400" />
                                    {item.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-sm rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

