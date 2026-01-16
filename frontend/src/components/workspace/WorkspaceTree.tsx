/**
 * WorkspaceTree - 目录树导航组件
 * 
 * 使用 slug 进行导航（/d/:slug），确保浏览器地址栏显示英文 URL
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
  
  // 检查当前路径是否匹配
  const currentPath = location.pathname;
  const isSlugRoute = currentPath.startsWith('/d/');
  const currentSlug = isSlugRoute ? currentPath.replace('/d/', '') : null;
  const currentDocPath = currentPath.replace('/workspace/', '').replace('/workspace', '');
  
  // 通过 slug 或 path 判断是否激活
  const isActive = node.type === 'document' && (
    (node.slug && currentSlug === node.slug) ||
    (node.path && currentDocPath === node.path)
  );
  
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
  
  // Document node - 优先使用 slug 导航
  const linkTo = node.slug ? `/d/${node.slug}` : `/workspace/${node.path}`;
  
  return (
    <Link
      to={linkTo}
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

