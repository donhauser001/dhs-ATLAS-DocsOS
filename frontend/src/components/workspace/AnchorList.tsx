/**
 * AnchorList - 文档结构（Anchor 列表）组件
 */

import { Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block } from '@/api/adl';

interface AnchorListProps {
  blocks: Block[];
  activeAnchor?: string;
  onAnchorClick?: (anchor: string) => void;
}

export function AnchorList({ blocks, activeAnchor, onAnchorClick }: AnchorListProps) {
  if (blocks.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        暂无内容
      </div>
    );
  }
  
  return (
    <div className="p-2">
      {blocks.map((block) => (
        <button
          key={block.anchor}
          onClick={() => onAnchorClick?.(block.anchor)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
            activeAnchor === block.anchor
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent text-muted-foreground hover:text-foreground"
          )}
          style={{ paddingLeft: `${(block.level - 1) * 12 + 8}px` }}
        >
          <Hash className="h-3 w-3 flex-shrink-0 opacity-50" />
          <span className="truncate">{block.heading || block.anchor}</span>
          {block.machine?.type && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {block.machine.type}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

