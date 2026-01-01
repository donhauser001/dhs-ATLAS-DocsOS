/**
 * CommitHistory - 变更历史组件
 * 
 * Phase 3.0: UI 内功
 * 
 * 特点：
 * - Git 提交历史展示
 * - Proposal 执行记录
 * - 点击查看详情
 */

import { } from 'react';
import {
  GitCommit,
  Clock,
  User,
  FileText,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================
// 类型定义
// ============================================================

export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

interface CommitHistoryProps {
  /** 提交列表 */
  commits: CommitInfo[];
  /** 加载中 */
  loading?: boolean;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 提交点击回调 */
  onCommitClick?: (commit: CommitInfo) => void;
}

// ============================================================
// 主组件
// ============================================================

export function CommitHistory({
  commits,
  loading = false,
  onRefresh,
  onCommitClick,
}: CommitHistoryProps) {
  return (
    <div className="commit-history">
      {/* 头部 */}
      <div
        className="history-header flex items-center justify-between p-4 rounded-t-lg"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          borderBottom: `1px solid var(--ui-block-header-border)`,
        }}
      >
        <div className="flex items-center gap-2">
          <GitCommit size={18} style={{ color: `var(--color-brand-primary)` }} />
          <h3
            className="font-semibold"
            style={{ color: `var(--ui-field-value-color)` }}
          >
            变更历史
          </h3>
          <span
            className="text-sm"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            ({commits.length} 条记录)
          </span>
        </div>
        
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              className={loading ? 'animate-spin' : ''}
            />
          </Button>
        )}
      </div>
      
      {/* 提交列表 */}
      <div
        className="commit-list"
        style={{
          backgroundColor: `var(--ui-block-body-bg)`,
          border: `1px solid var(--ui-block-body-border)`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      >
        {loading ? (
          <div
            className="text-center py-8"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
            <p>加载中...</p>
          </div>
        ) : commits.length === 0 ? (
          <div
            className="text-center py-8"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            <GitCommit size={32} className="mx-auto mb-2 opacity-50" />
            <p>暂无变更记录</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {commits.map((commit) => (
              <CommitItem
                key={commit.hash}
                commit={commit}
                onClick={() => onCommitClick?.(commit)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 提交项组件
// ============================================================

function CommitItem({
  commit,
  onClick,
}: {
  commit: CommitInfo;
  onClick: () => void;
}) {
  // 解析提交消息（支持 Proposal 格式）
  const isProposal = commit.message.startsWith('[Proposal]');
  
  return (
    <button
      className="commit-item w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* 时间线节点 */}
        <div className="mt-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: isProposal
                ? `var(--color-brand-primary)`
                : `var(--color-status-active)`,
            }}
          />
        </div>
        
        {/* 提交信息 */}
        <div>
          <div
            className="font-medium text-sm"
            style={{ color: `var(--ui-field-value-color)` }}
          >
            {commit.message}
          </div>
          
          <div
            className="flex items-center gap-3 mt-1 text-xs"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            <span className="flex items-center gap-1">
              <User size={12} />
              {commit.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {formatDate(commit.date)}
            </span>
            <span
              className="font-mono px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `var(--ui-block-header-bg)`,
              }}
            >
              {commit.shortHash}
            </span>
          </div>
          
          {/* 修改的文件 */}
          {commit.files.length > 0 && (
            <div
              className="flex items-center gap-1 mt-2 text-xs"
              style={{ color: `var(--ui-field-label-color)` }}
            >
              <FileText size={12} />
              {commit.files.length === 1 ? (
                <span>{commit.files[0]}</span>
              ) : (
                <span>{commit.files.length} 个文件</span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <ChevronRight
        size={16}
        style={{ color: `var(--ui-field-label-color)` }}
      />
    </button>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 1 小时内
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} 分钟前`;
  }
  
  // 24 小时内
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} 小时前`;
  }
  
  // 7 天内
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} 天前`;
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN');
}

export default CommitHistory;

