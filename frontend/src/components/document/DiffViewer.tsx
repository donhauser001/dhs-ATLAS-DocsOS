/**
 * DiffViewer - 变更对比视图
 * 
 * Phase 3.0: UI 内功
 * 
 * 特点：
 * - 并排对比
 * - 行级高亮
 * - 支持展开/折叠
 */

import { useState, useMemo } from 'react';
import {
  GitCompare,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Equal,
} from 'lucide-react';

// ============================================================
// 类型定义
// ============================================================

export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged' | 'context';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffBlock {
  type: 'modified' | 'added' | 'removed';
  oldStart?: number;
  oldCount?: number;
  newStart?: number;
  newCount?: number;
  lines: DiffLine[];
}

interface DiffViewerProps {
  /** 旧内容 */
  oldContent: string;
  /** 新内容 */
  newContent: string;
  /** 旧文件名 */
  oldFileName?: string;
  /** 新文件名 */
  newFileName?: string;
  /** 显示模式 */
  mode?: 'split' | 'unified';
}

// ============================================================
// 主组件
// ============================================================

export function DiffViewer({
  oldContent,
  newContent,
  oldFileName = '修改前',
  newFileName = '修改后',
  mode = 'split',
}: DiffViewerProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(
    new Set(Array.from({ length: 10 }, (_, i) => i))
  );
  
  // 计算 diff
  const diffBlocks = useMemo(() => {
    return computeDiff(oldContent, newContent);
  }, [oldContent, newContent]);
  
  // 统计
  const stats = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    
    for (const block of diffBlocks) {
      for (const line of block.lines) {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') deletions++;
      }
    }
    
    return { additions, deletions };
  }, [diffBlocks]);
  
  // 切换 Block 展开
  const toggleBlock = (index: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  return (
    <div className="diff-viewer">
      {/* 头部 */}
      <div
        className="diff-header flex items-center justify-between p-4 rounded-t-lg"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          borderBottom: `1px solid var(--ui-block-header-border)`,
        }}
      >
        <div className="flex items-center gap-2">
          <GitCompare size={18} style={{ color: `var(--color-brand-primary)` }} />
          <h3
            className="font-semibold"
            style={{ color: `var(--ui-field-value-color)` }}
          >
            变更对比
          </h3>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span
            className="flex items-center gap-1"
            style={{ color: `var(--color-status-active)` }}
          >
            <Plus size={14} />
            {stats.additions} 新增
          </span>
          <span
            className="flex items-center gap-1"
            style={{ color: `var(--color-status-error)` }}
          >
            <Minus size={14} />
            {stats.deletions} 删除
          </span>
        </div>
      </div>
      
      {/* 内容区 */}
      <div
        className="diff-content overflow-x-auto"
        style={{
          backgroundColor: `var(--ui-block-body-bg)`,
          border: `1px solid var(--ui-block-body-border)`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
        }}
      >
        {mode === 'split' ? (
          <SplitView
            diffBlocks={diffBlocks}
            oldFileName={oldFileName}
            newFileName={newFileName}
            expandedBlocks={expandedBlocks}
            onToggleBlock={toggleBlock}
          />
        ) : (
          <UnifiedView
            diffBlocks={diffBlocks}
            expandedBlocks={expandedBlocks}
            onToggleBlock={toggleBlock}
          />
        )}
        
        {diffBlocks.length === 0 && (
          <div
            className="text-center py-8"
            style={{ color: `var(--ui-field-label-color)` }}
          >
            <Equal size={32} className="mx-auto mb-2 opacity-50" />
            <p>内容相同，无差异</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 并排视图
// ============================================================

function SplitView({
  diffBlocks,
  oldFileName,
  newFileName,
  expandedBlocks,
  onToggleBlock,
}: {
  diffBlocks: DiffBlock[];
  oldFileName: string;
  newFileName: string;
  expandedBlocks: Set<number>;
  onToggleBlock: (index: number) => void;
}) {
  return (
    <div className="split-view">
      {/* 文件名头部 */}
      <div
        className="grid grid-cols-2 divide-x text-sm font-medium"
        style={{
          backgroundColor: `var(--ui-block-header-bg)`,
          color: `var(--ui-field-label-color)`,
        }}
      >
        <div className="px-4 py-2">{oldFileName}</div>
        <div className="px-4 py-2">{newFileName}</div>
      </div>
      
      {/* Diff 内容 */}
      {diffBlocks.map((block, blockIndex) => (
        <div key={blockIndex} className="diff-block">
          {/* Block 头部 */}
          <button
            className="w-full flex items-center gap-2 px-4 py-1 text-xs hover:bg-slate-50 transition-colors"
            style={{
              backgroundColor: `var(--ui-block-header-bg)`,
              color: `var(--ui-field-label-color)`,
            }}
            onClick={() => onToggleBlock(blockIndex)}
          >
            {expandedBlocks.has(blockIndex) ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            @@ {block.oldStart},{block.oldCount} → {block.newStart},{block.newCount} @@
          </button>
          
          {/* Block 内容 */}
          {expandedBlocks.has(blockIndex) && (
            <div className="grid grid-cols-2 divide-x font-mono text-sm">
              {/* 左侧（旧） */}
              <div>
                {block.lines
                  .filter((l) => l.type !== 'add')
                  .map((line, lineIndex) => (
                    <DiffLineRow
                      key={lineIndex}
                      line={line}
                      lineNumber={line.oldLineNumber}
                      side="old"
                    />
                  ))}
              </div>
              
              {/* 右侧（新） */}
              <div>
                {block.lines
                  .filter((l) => l.type !== 'remove')
                  .map((line, lineIndex) => (
                    <DiffLineRow
                      key={lineIndex}
                      line={line}
                      lineNumber={line.newLineNumber}
                      side="new"
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 统一视图
// ============================================================

function UnifiedView({
  diffBlocks,
  expandedBlocks,
  onToggleBlock,
}: {
  diffBlocks: DiffBlock[];
  expandedBlocks: Set<number>;
  onToggleBlock: (index: number) => void;
}) {
  return (
    <div className="unified-view">
      {diffBlocks.map((block, blockIndex) => (
        <div key={blockIndex} className="diff-block">
          {/* Block 头部 */}
          <button
            className="w-full flex items-center gap-2 px-4 py-1 text-xs hover:bg-slate-50 transition-colors"
            style={{
              backgroundColor: `var(--ui-block-header-bg)`,
              color: `var(--ui-field-label-color)`,
            }}
            onClick={() => onToggleBlock(blockIndex)}
          >
            {expandedBlocks.has(blockIndex) ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            @@ {block.oldStart},{block.oldCount} → {block.newStart},{block.newCount} @@
          </button>
          
          {/* Block 内容 */}
          {expandedBlocks.has(blockIndex) && (
            <div className="font-mono text-sm">
              {block.lines.map((line, lineIndex) => (
                <DiffLineRow
                  key={lineIndex}
                  line={line}
                  lineNumber={line.type === 'remove' ? line.oldLineNumber : line.newLineNumber}
                  side="unified"
                  showPrefix
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Diff 行组件
// ============================================================

function DiffLineRow({
  line,
  lineNumber,
  showPrefix = false,
}: {
  line: DiffLine;
  lineNumber?: number;
  side?: 'old' | 'new' | 'unified';
  showPrefix?: boolean;
}) {
  const getLineStyle = () => {
    switch (line.type) {
      case 'add':
        return {
          backgroundColor: `var(--ui-proposal-diff-added-bg)`,
          color: `var(--ui-field-value-color)`,
        };
      case 'remove':
        return {
          backgroundColor: `var(--ui-proposal-diff-removed-bg)`,
          color: `var(--ui-field-value-color)`,
        };
      default:
        return {
          color: `var(--ui-field-value-color)`,
        };
    }
  };
  
  const getPrefix = () => {
    if (!showPrefix) return null;
    
    switch (line.type) {
      case 'add':
        return <span style={{ color: `var(--color-status-active)` }}>+</span>;
      case 'remove':
        return <span style={{ color: `var(--color-status-error)` }}>-</span>;
      default:
        return <span> </span>;
    }
  };
  
  return (
    <div
      className="flex"
      style={getLineStyle()}
    >
      {/* 行号 */}
      <span
        className="w-12 flex-shrink-0 px-2 text-right select-none"
        style={{
          color: `var(--ui-field-label-color)`,
          backgroundColor: 'rgba(0,0,0,0.02)',
        }}
      >
        {lineNumber || ''}
      </span>
      
      {/* 前缀 */}
      {showPrefix && (
        <span className="w-4 flex-shrink-0 text-center select-none">
          {getPrefix()}
        </span>
      )}
      
      {/* 内容 */}
      <span className="flex-1 px-2 whitespace-pre-wrap break-all">
        {line.content || ' '}
      </span>
    </div>
  );
}

// ============================================================
// Diff 算法
// ============================================================

function computeDiff(oldContent: string, newContent: string): DiffBlock[] {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const blocks: DiffBlock[] = [];
  
  // 简单的 LCS-based diff
  const lcs = computeLCS(oldLines, newLines);
  
  let oldIndex = 0;
  let newIndex = 0;
  let currentBlock: DiffBlock | null = null;
  
  for (const match of lcs) {
    // 处理不匹配的部分
    if (oldIndex < match.oldIndex || newIndex < match.newIndex) {
      if (!currentBlock) {
        currentBlock = {
          type: 'modified',
          oldStart: oldIndex + 1,
          newStart: newIndex + 1,
          oldCount: 0,
          newCount: 0,
          lines: [],
        };
      }
      
      // 添加删除的行
      while (oldIndex < match.oldIndex) {
        currentBlock.lines.push({
          type: 'remove',
          content: oldLines[oldIndex],
          oldLineNumber: oldIndex + 1,
        });
        currentBlock.oldCount!++;
        oldIndex++;
      }
      
      // 添加新增的行
      while (newIndex < match.newIndex) {
        currentBlock.lines.push({
          type: 'add',
          content: newLines[newIndex],
          newLineNumber: newIndex + 1,
        });
        currentBlock.newCount!++;
        newIndex++;
      }
    }
    
    // 添加匹配的行作为上下文
    if (currentBlock && currentBlock.lines.length > 0) {
      blocks.push(currentBlock);
      currentBlock = null;
    }
    
    // 跳过匹配的行
    oldIndex++;
    newIndex++;
  }
  
  // 处理末尾
  if (oldIndex < oldLines.length || newIndex < newLines.length) {
    const block: DiffBlock = {
      type: 'modified',
      oldStart: oldIndex + 1,
      newStart: newIndex + 1,
      oldCount: 0,
      newCount: 0,
      lines: [],
    };
    
    while (oldIndex < oldLines.length) {
      block.lines.push({
        type: 'remove',
        content: oldLines[oldIndex],
        oldLineNumber: oldIndex + 1,
      });
      block.oldCount!++;
      oldIndex++;
    }
    
    while (newIndex < newLines.length) {
      block.lines.push({
        type: 'add',
        content: newLines[newIndex],
        newLineNumber: newIndex + 1,
      });
      block.newCount!++;
      newIndex++;
    }
    
    if (block.lines.length > 0) {
      blocks.push(block);
    }
  }
  
  return blocks;
}

interface LCSMatch {
  oldIndex: number;
  newIndex: number;
}

function computeLCS(oldLines: string[], newLines: string[]): LCSMatch[] {
  const m = oldLines.length;
  const n = newLines.length;
  
  // DP 表
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // 填充 DP 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 回溯找匹配
  const matches: LCSMatch[] = [];
  let i = m;
  let j = n;
  
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) {
      matches.unshift({ oldIndex: i - 1, newIndex: j - 1 });
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  
  return matches;
}

export default DiffViewer;

