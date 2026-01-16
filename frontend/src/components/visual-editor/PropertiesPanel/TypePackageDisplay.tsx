/**
 * TypePackageDisplay - 类型包静态显示组件
 * 
 * 根据 document_type（类型包ID）显示类型包的名称
 * 只读显示，不可编辑
 */

import { useEffect, useState } from 'react';
import { getAllTypePackages, TypePackageInfo } from '@/api/type-packages';

interface TypePackageDisplayProps {
    /** 类型包 ID（document_type 字段值） */
    value: string;
}

// 类型包缓存
let typePackagesCache: TypePackageInfo[] | null = null;
let cachePromise: Promise<TypePackageInfo[]> | null = null;

/**
 * 获取类型包列表（带缓存）
 */
async function getTypePackagesWithCache(): Promise<TypePackageInfo[]> {
    if (typePackagesCache) {
        return typePackagesCache;
    }
    
    if (cachePromise) {
        return cachePromise;
    }
    
    cachePromise = getAllTypePackages().then(packages => {
        typePackagesCache = packages;
        return packages;
    }).catch(err => {
        console.error('[TypePackageDisplay] Failed to load type packages:', err);
        cachePromise = null;
        return [];
    });
    
    return cachePromise;
}

/**
 * 清除缓存（在需要时调用）
 */
export function clearTypePackageCache() {
    typePackagesCache = null;
    cachePromise = null;
}

export function TypePackageDisplay({ value }: TypePackageDisplayProps) {
    const [packageInfo, setPackageInfo] = useState<TypePackageInfo | null>(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!value) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        getTypePackagesWithCache().then(packages => {
            const found = packages.find(p => p.id === value);
            setPackageInfo(found || null);
            setLoading(false);
        });
    }, [value]);
    
    if (loading) {
        return <span className="text-xs text-slate-400">加载中...</span>;
    }
    
    if (!value) {
        return <span className="text-xs text-slate-400">—</span>;
    }
    
    if (!packageInfo) {
        // 显示原始值（类型包不存在或未安装）
        return (
            <span className="text-xs text-amber-600 font-mono">
                {value}
                <span className="text-amber-400 ml-1">（未安装）</span>
            </span>
        );
    }
    
    // 正常显示类型包名称 - 简洁样式
    return (
        <span 
            className="text-xs font-medium"
            style={{ color: packageInfo.color || '#475569' }}
        >
            {packageInfo.name}
        </span>
    );
}

export default TypePackageDisplay;
