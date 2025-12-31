/**
 * WorkspaceTree - 目录树导航组件
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/api/workspace';

interface WorkspaceTreeProps {
  tree: TreeNode[];
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
}

function TreeItem({ node, level }: TreeItemProps) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(level < 2); // 默认展开前两级
  
  const currentPath = location.pathname.replace('/workspace/', '').replace('/workspace', '');
  const isActive = node.path && currentPath === node.path;
  
  if (node.type === 'directory') {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center gap-1 px-2 py-1.5 text-sm hover:bg-accent rounded-md transition-colors",
            "text-left"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        
        {isOpen && node.children && (
          <div>
            {node.children.map((child, index) => (
              <TreeItem key={child.path || `${node.name}-${index}`} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Document node
  return (
    <Link
      to={`/workspace/${node.path}`}
      className={cn(
        "flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-colors",
        isActive 
          ? "bg-accent text-accent-foreground font-medium" 
          : "hover:bg-accent text-muted-foreground hover:text-foreground"
      )}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      <span className="w-4" /> {/* Spacer for alignment */}
      <FileText className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{node.name.replace('.md', '')}</span>
    </Link>
  );
}

export function WorkspaceTree({ tree }: WorkspaceTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        暂无文档
      </div>
    );
  }
  
  return (
    <div className="p-2">
      {tree.map((node, index) => (
        <TreeItem key={node.path || `root-${index}`} node={node} level={0} />
      ))}
    </div>
  );
}

