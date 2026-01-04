import React, { useMemo, useRef } from 'react';
import { Library, ChevronLeft, ChevronRight, Heart, User } from 'lucide-react';
import type { DisplayRendererProps } from '../types';
import { parseAtlasDataBlocks } from '../list/parseAtlasData';
import { GalleryItem, parseGalleryData, groupByCategory, getCategoryColor, formatNumber } from './types';
import { GalleryCard } from './GalleryCard';

// 书架行组件
const ShelfRow: React.FC<{
    category: string;
    items: GalleryItem[];
    color?: string;
}> = ({ category, items, color }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const categoryColors = getCategoryColor(color);
    
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };
    
    return (
        <div className="mb-8">
            {/* 分类标题 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className={`w-1 h-6 rounded-full ${categoryColors.bg.replace('bg-', 'bg-').replace('-50', '-500')}`} />
                    <h3 className="text-lg font-semibold text-slate-800">{category}</h3>
                    <span className="text-sm text-slate-500">({items.length})</span>
                </div>
                
                {/* 滚动按钮 */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            {/* 书架滚动区 */}
            <div 
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {items.map(item => (
                    <div key={item.id} className="flex-shrink-0 w-72">
                        <GalleryCard
                            item={item}
                            aspectRatio="4:3"
                            showInfo={true}
                            size="md"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export const GalleryShelfRenderer: React.FC<DisplayRendererProps> = ({
    bodyContent,
    frontmatter,
}) => {
    // 解析数据
    const dataBlocks = useMemo(() => parseAtlasDataBlocks(bodyContent || ''), [bodyContent]);
    const galleryDataBlock = dataBlocks.find(block => block.type === 'gallery');
    
    const items = useMemo(() => {
        if (!galleryDataBlock) return [];
        return parseGalleryData(galleryDataBlock);
    }, [galleryDataBlock]);
    
    // 按分类分组
    const groupedItems = useMemo(() => {
        return groupByCategory(items);
    }, [items]);
    
    // 统计信息
    const stats = useMemo(() => {
        const totalLikes = items.reduce((sum, item) => sum + (item.likes || 0), 0);
        const authors = new Set(items.map(item => item.author).filter(Boolean));
        return {
            total: items.length,
            categories: groupedItems.size,
            likes: totalLikes,
            authors: authors.size,
        };
    }, [items, groupedItems]);
    
    if (!galleryDataBlock) {
        return (
            <div className="max-w-[1200px] mx-auto px-8 py-6">
                <div className="text-center text-slate-500 py-12">
                    没有找到画廊数据
                </div>
            </div>
        );
    }
    
    return (
        <div className="w-full px-8 py-6">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <Library className="w-5 h-5 text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-800">作品书架</h2>
                </div>
                
                {/* 统计信息 */}
                <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">{stats.total}</span> 作品
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-700">{stats.categories}</span> 分类
                    </span>
                    <span className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-slate-700">{stats.authors}</span> 设计师
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium text-slate-700">{formatNumber(stats.likes)}</span>
                    </span>
                </div>
            </div>
            
            {/* 书架列表 */}
            <div className="space-y-2">
                {Array.from(groupedItems.entries()).map(([category, categoryItems]) => {
                    const color = categoryItems[0]?.categoryOption?.color;
                    return (
                        <ShelfRow
                            key={category}
                            category={category}
                            items={categoryItems}
                            color={color}
                        />
                    );
                })}
            </div>
            
            {items.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    没有作品数据
                </div>
            )}
        </div>
    );
};

