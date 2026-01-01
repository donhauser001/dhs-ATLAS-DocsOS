/**
 * ProposalReview - 变更确认态
 * 
 * Phase 3.0: UI 内功
 * 
 * 目标体验：像在签字确认修改内容
 * 
 * 特点：
 * - 清晰的变更对比
 * - 变更理由必填
 * - 明确的确认/取消按钮
 * - 审计信息展示
 */

import { useState, useCallback } from 'react';
import {
  FileCheck,
  FileX,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Proposal, MachineBlock } from '@/types/adl';

// ============================================================
// 类型定义
// ============================================================

interface ProposalReviewProps {
  /** Proposal 数据 */
  proposal: Proposal;
  /** 原始 Block 数据（可选） */
  originalBlock?: MachineBlock;
  /** 确认执行回调 */
  onExecute: (reason: string) => Promise<void>;
  /** 取消/拒绝回调 */
  onReject: (reason: string) => Promise<void>;
  /** 关闭回调 */
  onClose: () => void;
}

// ============================================================
// 主组件
// ============================================================

export function ProposalReview({
  proposal,
  originalBlock,
  onExecute,
  onReject,
  onClose,
}: ProposalReviewProps) {
  const [reason, setReason] = useState(proposal.reason || '');
  const [executing, setExecuting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  
  const isPending = proposal.status === 'pending';
  
  // 执行 Proposal
  const handleExecute = useCallback(async () => {
    if (!reason.trim()) {
      alert('请填写变更理由');
      return;
    }
    
    setExecuting(true);
    try {
      await onExecute(reason);
    } finally {
      setExecuting(false);
    }
  }, [reason, onExecute]);
  
  // 拒绝 Proposal
  const handleReject = useCallback(async () => {
    const rejectReason = prompt('请输入拒绝理由:');
    if (!rejectReason) return;
    
    setRejecting(true);
    try {
      await onReject(rejectReason);
    } finally {
      setRejecting(false);
    }
  }, [onReject]);
  
  return (
    <div className="proposal-review max-w-3xl mx-auto">
      {/* 头部 */}
      <div
        className="proposal-header p-6 rounded-t-lg"
        style={{
          backgroundColor: getStatusBg(proposal.status),
          borderBottom: `2px solid ${getStatusColor(proposal.status)}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={proposal.status} />
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: `var(--ui-field-value-color)` }}
              >
                变更提案审核
              </h2>
              <span
                className="text-sm font-mono"
                style={{ color: `var(--ui-field-label-color)` }}
              >
                {proposal.id}
              </span>
            </div>
          </div>
          
          <StatusBadge status={proposal.status} />
        </div>
      </div>
      
      {/* 内容区 */}
      <div
        className="proposal-content p-6 space-y-6"
        style={{
          backgroundColor: `var(--ui-block-body-bg)`,
          border: `1px solid var(--ui-block-body-border)`,
          borderTop: 'none',
        }}
      >
        {/* 元信息 */}
        <MetaInfo proposal={proposal} />
        
        {/* 变更详情 */}
        <ChangeDetails
          operation={proposal.operation}
          changes={proposal.changes}
          original={originalBlock}
          targetAnchor={proposal.target_anchor}
        />
        
        {/* 变更理由（可编辑或只读） */}
        <div className="reason-section">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            <MessageSquare size={14} className="inline mr-1" />
            变更理由 <span className="text-red-500">*</span>
          </label>
          
          {isPending ? (
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请描述此次变更的目的和原因..."
              rows={3}
              className="w-full"
              style={{
                backgroundColor: `var(--ui-field-input-bg)`,
                border: `1px solid var(--ui-field-input-border)`,
                color: `var(--ui-field-value-color)`,
              }}
            />
          ) : (
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: `var(--ui-field-readonly-bg)`,
                color: `var(--ui-field-value-color)`,
              }}
            >
              {proposal.reason || '未提供理由'}
            </div>
          )}
        </div>
        
        {/* 确认声明 */}
        {isPending && (
          <div
            className="confirmation-notice p-4 rounded-lg"
            style={{
              backgroundColor: `var(--color-status-info-bg)`,
              border: `1px solid var(--color-status-info)`,
            }}
          >
            <AlertCircle
              size={16}
              className="inline mr-2"
              style={{ color: `var(--color-status-info)` }}
            />
            <span style={{ color: `var(--color-status-info-text)` }}>
              执行此变更将直接修改文档内容并创建 Git 提交。此操作不可撤销。
            </span>
          </div>
        )}
      </div>
      
      {/* 操作栏 */}
      <div
        className="proposal-actions p-6 rounded-b-lg flex items-center justify-between"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          borderTop: `1px solid var(--ui-block-header-border)`,
        }}
      >
        <Button
          variant="ghost"
          onClick={onClose}
        >
          关闭
        </Button>
        
        {isPending && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={rejecting}
              style={{
                borderColor: `var(--color-status-error)`,
                color: `var(--color-status-error)`,
              }}
            >
              <FileX size={16} className="mr-1" />
              {rejecting ? '处理中...' : '拒绝'}
            </Button>
            
            <Button
              onClick={handleExecute}
              disabled={executing || !reason.trim()}
              style={{
                backgroundColor: `var(--color-status-active)`,
                color: '#FFFFFF',
              }}
            >
              <FileCheck size={16} className="mr-1" />
              {executing ? '执行中...' : '确认执行'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 子组件
// ============================================================

function MetaInfo({ proposal }: { proposal: Proposal }) {
  return (
    <div
      className="meta-info grid grid-cols-2 gap-4 p-4 rounded-lg"
      style={{
        backgroundColor: `var(--ui-block-header-bg)`,
      }}
    >
      <div>
        <span
          className="text-xs"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          目标文件
        </span>
        <div
          className="font-mono text-sm mt-1"
          style={{ color: `var(--ui-field-value-color)` }}
        >
          {proposal.target_file}
        </div>
      </div>
      
      <div>
        <span
          className="text-xs"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          目标 Block
        </span>
        <div
          className="font-mono text-sm mt-1"
          style={{ color: `var(--ui-field-value-color)` }}
        >
          #{proposal.target_anchor}
        </div>
      </div>
      
      <div>
        <span
          className="text-xs"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          <User size={12} className="inline mr-1" />
          创建者
        </span>
        <div
          className="text-sm mt-1"
          style={{ color: `var(--ui-field-value-color)` }}
        >
          {proposal.created_by}
        </div>
      </div>
      
      <div>
        <span
          className="text-xs"
          style={{ color: `var(--ui-field-label-color)` }}
        >
          <Clock size={12} className="inline mr-1" />
          创建时间
        </span>
        <div
          className="text-sm mt-1"
          style={{ color: `var(--ui-field-value-color)` }}
        >
          {new Date(proposal.created_at).toLocaleString('zh-CN')}
        </div>
      </div>
    </div>
  );
}

function ChangeDetails({
  operation,
  changes,
  original,
}: {
  operation: string;
  changes: Record<string, unknown>;
  original?: MachineBlock;
  targetAnchor?: string;
}) {
  const operationLabels: Record<string, string> = {
    update: '更新字段',
    create: '创建 Block',
    delete: '删除 Block',
  };
  
  return (
    <div className="change-details">
      <h4
        className="text-sm font-medium mb-3"
        style={{ color: `var(--ui-field-label-color)` }}
      >
        {operationLabels[operation] || operation}
      </h4>
      
      <div className="space-y-2">
        {Object.entries(changes).map(([field, newValue]) => {
          const oldValue = original?.[field];
          
          return (
            <div
              key={field}
              className="change-item p-3 rounded"
              style={{
                backgroundColor: `var(--ui-field-changed-bg)`,
                border: `1px solid var(--ui-field-changed-border)`,
              }}
            >
              <div
                className="text-xs font-medium mb-2"
                style={{ color: `var(--color-status-draft-text)` }}
              >
                {field}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                {original && (
                  <>
                    <span
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: `var(--ui-proposal-diff-removed-bg)`,
                        color: `var(--ui-field-value-color)`,
                      }}
                    >
                      {formatValue(oldValue)}
                    </span>
                    <ArrowRight
                      size={14}
                      style={{ color: `var(--ui-field-label-color)` }}
                    />
                  </>
                )}
                <span
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: `var(--ui-proposal-diff-added-bg)`,
                    color: `var(--ui-field-value-color)`,
                  }}
                >
                  {formatValue(newValue)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    pending: {
      label: '待审核',
      color: `var(--color-status-draft)`,
      bg: `var(--color-status-draft-bg)`,
    },
    executed: {
      label: '已执行',
      color: `var(--color-status-active)`,
      bg: `var(--color-status-active-bg)`,
    },
    rejected: {
      label: '已拒绝',
      color: `var(--color-status-error)`,
      bg: `var(--color-status-error-bg)`,
    },
  };
  
  const { label, color, bg } = config[status] || config.pending;
  
  return (
    <span
      className="px-3 py-1 rounded-full text-sm font-medium"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  const icons: Record<string, typeof CheckCircle> = {
    pending: Clock,
    executed: CheckCircle,
    rejected: FileX,
  };
  
  const Icon = icons[status] || Clock;
  
  return (
    <Icon
      size={24}
      style={{ color: getStatusColor(status) }}
    />
  );
}

// ============================================================
// 辅助函数
// ============================================================

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: `var(--color-status-draft)`,
    executed: `var(--color-status-active)`,
    rejected: `var(--color-status-error)`,
  };
  return colors[status] || colors.pending;
}

function getStatusBg(status: string): string {
  const bgs: Record<string, string> = {
    pending: `var(--ui-proposal-pending-bg)`,
    executed: `var(--ui-proposal-approved-bg)`,
    rejected: `var(--ui-proposal-rejected-bg)`,
  };
  return bgs[status] || bgs.pending;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

export default ProposalReview;

