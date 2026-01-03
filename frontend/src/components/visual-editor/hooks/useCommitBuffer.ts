/**
 * useCommitBuffer - 提案机制 Hook
 * 
 * 批量收集用户的微操作（如改颜色、拖拽顺序），显式提交。
 * 这与 Phase 3.0 定义的"提案机制"对齐，提供事务性的变更管理。
 */

import { useState, useCallback } from 'react';

/**
 * 待提交变更项
 */
export interface PendingChange {
    /** 变更唯一 ID */
    id: string;
    /** 变更类型 */
    type: 'field' | 'block' | 'component' | 'structure' | 'property';
    /** 变更描述（用于显示） */
    description: string;
    /** 变更时间戳 */
    timestamp: number;
    /** 应用变更的函数 */
    apply: () => void;
    /** 撤销变更的函数 */
    revert: () => void;
}

/**
 * 创建变更的参数（不含自动生成的字段）
 */
export type CreateChangeParams = Omit<PendingChange, 'id' | 'timestamp'>;

/**
 * useCommitBuffer 返回值
 */
export interface CommitBufferResult {
    /** 待提交变更列表 */
    pendingChanges: PendingChange[];
    /** 添加一个变更到缓冲区 */
    addChange: (change: CreateChangeParams) => void;
    /** 提交所有变更 */
    commitAll: () => void;
    /** 放弃所有变更（逆序撤销） */
    discardAll: () => void;
    /** 移除指定变更 */
    removeChange: (id: string) => void;
    /** 清空缓冲区（不执行任何操作） */
    clearBuffer: () => void;
    /** 是否有待提交变更 */
    hasPendingChanges: boolean;
    /** 待提交变更数量 */
    pendingCount: number;
}

/**
 * 提案机制 Hook
 * 
 * 用于批量收集用户操作，提供"待提交"状态展示，
 * 支持一键提交或放弃。
 * 
 * @example
 * ```tsx
 * const { pendingChanges, addChange, commitAll, discardAll } = useCommitBuffer();
 * 
 * // 添加变更
 * addChange({
 *     type: 'field',
 *     description: '修改客户分类为"图书出版"',
 *     apply: () => setCategory('图书出版'),
 *     revert: () => setCategory(previousValue),
 * });
 * 
 * // 显示待提交状态
 * {pendingChanges.length > 0 && (
 *     <div>{pendingChanges.length} 项待提交</div>
 * )}
 * ```
 */
export function useCommitBuffer(): CommitBufferResult {
    const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);

    // 添加变更
    const addChange = useCallback((change: CreateChangeParams) => {
        const newChange: PendingChange = {
            ...change,
            id: `change-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            timestamp: Date.now(),
        };
        setPendingChanges(prev => [...prev, newChange]);
    }, []);

    // 提交所有变更
    const commitAll = useCallback(() => {
        // 按时间顺序执行所有变更
        pendingChanges.forEach(change => {
            try {
                change.apply();
            } catch (error) {
                console.error(`Failed to apply change ${change.id}:`, error);
            }
        });
        setPendingChanges([]);
    }, [pendingChanges]);

    // 放弃所有变更（逆序撤销）
    const discardAll = useCallback(() => {
        // 逆序执行撤销，确保依赖关系正确
        [...pendingChanges].reverse().forEach(change => {
            try {
                change.revert();
            } catch (error) {
                console.error(`Failed to revert change ${change.id}:`, error);
            }
        });
        setPendingChanges([]);
    }, [pendingChanges]);

    // 移除指定变更
    const removeChange = useCallback((id: string) => {
        setPendingChanges(prev => prev.filter(c => c.id !== id));
    }, []);

    // 清空缓冲区
    const clearBuffer = useCallback(() => {
        setPendingChanges([]);
    }, []);

    return {
        pendingChanges,
        addChange,
        commitAll,
        discardAll,
        removeChange,
        clearBuffer,
        hasPendingChanges: pendingChanges.length > 0,
        pendingCount: pendingChanges.length,
    };
}

export default useCommitBuffer;

